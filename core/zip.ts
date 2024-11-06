import { Observable } from "./Observable";
import { Subscribable } from "./Subscribable";
import { then } from "./then";
import { TidySubscription } from "./TidySubscription";

type SourcesToZip<T extends any[]> = Array<Subscribable<T[number]>> & {
  [id in Extract<keyof T, number>]: Subscribable<T[id]>;
};

type CombiningEntry<T> =
  | { filled: false }
  | { filled: true; value: T; ack?: () => void };

export function zip<const T extends any[] = unknown[]>(
  sources: SourcesToZip<T>,
): Observable<T> {
  return new Observable<T>((observer) => {
    const { next, complete } = observer;

    let closed = false;

    let nextMessageBuilder: CombiningEntry<T[number]>[] = sources.map(() => ({
      filled: false,
    }));

    const sourceSubs = sources.map((source, sourceIndex) =>
      source.subscribe({
        get closed() {
          return closed || observer.closed;
        },

        ...(next
          ? {
              next: (value) => {
                const nextMessage: unknown[] = [];
                const acks: (() => void)[] = [];

                nextMessageBuilder[sourceIndex] = { filled: true, value };

                for (const entry of nextMessageBuilder) {
                  if (!entry.filled) {
                    return new Promise<void>((resolve) => {
                      nextMessageBuilder[sourceIndex] = {
                        filled: true,
                        value,
                        ack: resolve,
                      };
                    });
                  }
                  nextMessage.push(entry.value);
                  if (entry.ack) {
                    acks.push(entry.ack);
                  }
                }

                nextMessageBuilder = sources.map(() => ({
                  filled: false,
                }));
                return then(next.call(observer, nextMessage as T), () => {
                  for (const ack of acks) {
                    ack();
                  }
                });
              },
            }
          : undefined),

        complete: () => {
          closed = true;
          return then(complete?.call(observer), () => {
            for (const entry of nextMessageBuilder.splice(0)) {
              if (entry.filled) {
                entry.ack?.();
              }
            }
          });
        },
      }),
    );

    return new TidySubscription(() => {
      for (const sub of sourceSubs.splice(0)) {
        if (!sub.closed) {
          sub.cancel();
        }
      }
    });
  });
}
