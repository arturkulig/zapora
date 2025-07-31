import { Observable } from "./Observable";
import { Observer } from "./Observer";
import { getQueueingObserver } from "./queueingObserver";
import { State } from "./State";
import { Subscribable } from "./Subscribable";
import { then } from "./then";
import { TidySubscription } from "./TidySubscription";

type StatesToCombine<T extends any[]> = {
  [id in Extract<keyof T, number>]: State<T[id]>;
};
type SourcesToCombine<T extends any[]> = {
  [id in Extract<keyof T, number>]: Subscribable<T[id]>;
};

enum CombiningEntryStatus {
  EMPTY,
  VALUE,
}
type CombiningResult<T extends any[]> = Array<CombiningEntry<T[number]>> & {
  [id in Extract<keyof T, number>]: CombiningEntry<T[id]>;
};
type CombiningEntry<T> =
  | { status: CombiningEntryStatus.EMPTY; completed: boolean }
  | { status: CombiningEntryStatus.VALUE; completed: boolean; value: T };

export function combineLatest<const T extends any[] = unknown[]>(
  _sources: StatesToCombine<T>,
): State<T>;
export function combineLatest<const T extends any[] = unknown[]>(
  _sources: SourcesToCombine<T>,
): Observable<T>;
export function combineLatest<const T extends any[] = unknown[]>(
  _sources: SourcesToCombine<T>,
): Observable<T> {
  const sources: Subscribable<T[number]>[] = _sources as any as Subscribable<
    T[number]
  >[];

  const producer = (observer: Observer<T>) => {
    const queueingObserver = getQueueingObserver(observer);
    const { next, complete } = queueingObserver;

    const combined: CombiningResult<T> = sources.map(
      (source): CombiningEntry<T[number]> =>
        source instanceof State
          ? {
              completed: false,
              status: CombiningEntryStatus.VALUE,
              value: source.value as T[number],
            }
          : { completed: false, status: CombiningEntryStatus.EMPTY },
    );

    const firstMessageConfirmations = new Array<() => void>();

    function confirmFirstMessage() {
      if (firstMessageConfirmations.length === 0) {
        return;
      }
      for (const confirmation of firstMessageConfirmations.splice(0)) {
        queueMicrotask(confirmation);
      }
    }

    const subscriptions = sources.map((source, subscriptionIndex) =>
      source.subscribe({
        get closed() {
          return observer.closed;
        },
        ...(next
          ? {
              next: (value) => {
                const replacedEntry = combined[subscriptionIndex];
                switch (replacedEntry.status) {
                  case CombiningEntryStatus.EMPTY: {
                    combined[subscriptionIndex] = {
                      status: CombiningEntryStatus.VALUE,
                      completed: replacedEntry.completed,
                      value,
                    };
                    break;
                  }
                  case CombiningEntryStatus.VALUE: {
                    replacedEntry.value = value;
                    break;
                  }
                }

                const acc: unknown[] = [];

                for (const entry of combined) {
                  if (entry.status === CombiningEntryStatus.EMPTY) {
                    return new Promise((resolve) => {
                      firstMessageConfirmations.push(resolve);
                    });
                  }

                  acc.push(entry.value);
                }

                return then(next(acc as T), confirmFirstMessage);
              },
            }
          : undefined),
        ...(complete
          ? {
              complete: () => {
                combined[subscriptionIndex].completed = true;

                for (const entry of combined) {
                  if (!entry.completed) {
                    return;
                  }
                }

                return complete();
              },
            }
          : undefined),
      }),
    );

    return new TidySubscription(() => {
      for (const subscription of subscriptions.splice(0)) {
        if (!subscription.closed) {
          subscription.cancel();
        }
      }
    });
  };

  for (const source of sources) {
    if (!(source instanceof State)) {
      return new Observable<T>(producer);
    }
  }

  return new State<T>(
    producer,
    () =>
      (sources as State<T[number]>[]).map(
        (source): T[number] => source.value as T[number],
      ) as T,
  );
}
