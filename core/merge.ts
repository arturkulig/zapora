import { ArrayOrIterable } from "./internal/ArrayOrIterable";
import { identity } from "./internal/identity";
import { Observable } from "./Observable";
import { Observer } from "./Observer";
import { Producer } from "./Producer";
import { getQueueingObserver } from "./queueingObserver";
import { SimpleSubscription } from "./SimpleSubscription";
import { State, StateMaybe } from "./State";
import { TidySubscription } from "./TidySubscription";

export function merge<T>(sources: ArrayOrIterable<StateMaybe<T>>): State<T>;
export function merge<T>(
  sources: ArrayOrIterable<Observable<T>>,
): Observable<T>;
export function merge<T>(
  sources: ArrayOrIterable<StateMaybe<T>>,
): StateMaybe<T> {
  const sourcesArray: Array<StateMaybe<T>> = Array.isArray(sources)
    ? sources
    : [...sources];

  const producer: Producer<T> = (rawObserver: Observer<T>) => {
    if (sourcesArray.length === 0) {
      if (!rawObserver.closed) {
        void rawObserver.complete?.();
      }
      return new SimpleSubscription();
    }

    const queueingObserver = getQueueingObserver(rawObserver, {
      trim: { maxLength: sourcesArray.length, reject: "oldest" },
    });
    const { next, complete } = queueingObserver;

    const completed = sourcesArray.map(() => false);

    const subscriptions = sourcesArray.map((observable, i) =>
      observable.subscribe({
        get closed() {
          return queueingObserver.closed;
        },
        ...(next ? { next } : undefined),
        ...(complete
          ? {
              complete: () => {
                completed[i] = true;
                if (completed.every(identity)) {
                  return complete();
                }
              },
            }
          : undefined),
      }),
    );

    return new TidySubscription(() => {
      for (const subscription of subscriptions.splice(0)) {
        subscription.cancel();
      }
    });
  };

  const firstStateEncountered = sourcesArray.find(
    (source): source is State<T> => source instanceof State,
  );
  if (firstStateEncountered) {
    return new State(producer, () => firstStateEncountered.value);
  }
  return new Observable(producer);
}
