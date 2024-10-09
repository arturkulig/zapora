import { ArrayOrIterable } from "./internal/ArrayOrIterable";
import { Observable } from "./Observable";
import { Observer } from "./Observer";
import { Producer } from "./Producer";
import { SimpleSubscription } from "./SimpleSubscription";
import { State, StateMaybe } from "./State";
import { Subscription } from "./Subscription";
import { TidySubscription } from "./TidySubscription";

export function concat<T>(sources: ArrayOrIterable<StateMaybe<T>>): State<T>;
export function concat<T>(
  sources: ArrayOrIterable<Observable<T>>,
): Observable<T>;
export function concat<T>(
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
    const pendingSources = [...sources];
    const { next } = rawObserver;
    let currentSubscription: Subscription = new SimpleSubscription();

    subscribeToPending();

    return new TidySubscription(() => {
      currentSubscription.cancel();
    });

    function subscribeToPending() {
      const nextObservable = pendingSources.shift();

      if (!nextObservable) {
        void rawObserver.complete?.();
        return;
      }

      currentSubscription = nextObservable.subscribe({
        get closed() {
          return rawObserver.closed;
        },
        ...(next ? { next: next.bind(rawObserver) } : undefined),
        complete() {
          subscribeToPending();
        },
      });
    }
  };

  const firstStateEncountered = sourcesArray.find(
    (source): source is State<T> => source instanceof State,
  );
  if (firstStateEncountered) {
    return new State(producer, () => firstStateEncountered.value);
  }
  return new Observable(producer);
}
