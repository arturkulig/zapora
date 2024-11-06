import { Observable } from "./Observable";
import { ReceivedReceit } from "./Observer";
import { SimpleSubscription } from "./SimpleSubscription";
import { Subscribable } from "./Subscribable";
import { then } from "./then";

export function takeLast<T>(
  source: Subscribable<T>,
  amount: number,
): Observable<T> {
  return new Observable<T>((observer) => {
    if (amount <= 0) {
      if (!observer.closed) {
        void observer.complete?.();
      }
      return new SimpleSubscription();
    }

    const buffer: T[] = [];
    const { next, complete } = observer;

    return source.subscribe({
      get closed() {
        return observer.closed;
      },
      ...(next || complete
        ? {
            next: (value) => {
              buffer.push(value);
              if (buffer.length > amount) {
                buffer.shift();
              }
            },
            complete: () => {
              return then(
                next
                  ? buffer
                      .splice(0)
                      .reduce<ReceivedReceit>(
                        (acc, item) =>
                          then(acc, () => next.call(observer, item)),
                        undefined,
                      )
                  : undefined,
                () => complete?.call(observer),
              );
            },
          }
        : undefined),
    });
  });
}
