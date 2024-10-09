import { noop } from "./internal/noop";
import { then } from "./internal/then";
import { Observable } from "./Observable";
import { State } from "./State";
import { Subscribable } from "./Subscribable";
import { Subscription } from "./Subscription";
import { TidySubscription } from "./TidySubscription";

type SourcesToCombine<T extends any[]> = Array<Subscribable<T[number]>> & {
  [id in Extract<keyof T, number>]: Subscribable<T[id]>;
};
enum CombiningEntryStatus {
  EMPTY,
  VALUE,
  CLOSED,
}
type CombiningResult<T extends any[]> = Array<CombiningEntry<T[number]>> & {
  [id in Extract<keyof T, number>]: CombiningEntry<T[id]>;
};
type CombiningEntry<T> =
  | { ok: CombiningEntryStatus.EMPTY }
  | { ok: CombiningEntryStatus.VALUE; value: T };

export function withLatestFrom<const T extends any[] = unknown[]>(
  sources: SourcesToCombine<T>,
): Observable<T> {
  return new Observable<T>((observer) => {
    const { next, complete } = observer;

    const combined: CombiningResult<T> = sources.map(
      (source): CombiningEntry<T[number]> =>
        source instanceof State
          ? {
              ok: CombiningEntryStatus.VALUE,
              value: source.value as T[number],
            }
          : { ok: CombiningEntryStatus.EMPTY },
    );

    let firstMessageConfirmation: () => void = noop;

    let closed = false;
    const subscriptions: Subscription[] = sources.map(
      (source, subscriptionIndex) =>
        source.subscribe({
          get closed() {
            return closed || observer.closed;
          },
          ...(next
            ? {
                next: (value) => {
                  const replacedEntry = combined[subscriptionIndex];
                  switch (replacedEntry.ok) {
                    case CombiningEntryStatus.EMPTY: {
                      combined[subscriptionIndex] = {
                        ok: CombiningEntryStatus.VALUE,
                        value,
                      };
                      break;
                    }
                    case CombiningEntryStatus.VALUE: {
                      replacedEntry.value = value;
                      break;
                    }
                  }

                  const nextCombinedValue: unknown[] = [];

                  for (const entry of combined) {
                    if (entry.ok === CombiningEntryStatus.EMPTY) {
                      return subscriptionIndex === 0
                        ? new Promise((resolve) => {
                            firstMessageConfirmation = () => {
                              firstMessageConfirmation = noop;
                              resolve();
                            };
                          })
                        : undefined;
                    }

                    nextCombinedValue.push(entry.value);
                  }

                  const receit =
                    subscriptionIndex === 0 || firstMessageConfirmation !== noop
                      ? then(
                          next.call(observer, nextCombinedValue as T),
                          firstMessageConfirmation,
                        )
                      : undefined;

                  return subscriptionIndex === 0 ? receit : undefined;
                },
              }
            : undefined),

          ...(subscriptionIndex === 0
            ? {
                complete: () => {
                  closed = true;
                  return complete?.call(observer);
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
  });
}
