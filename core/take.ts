import { then } from "./internal/then";
import { Observable } from "./Observable";
import { SimpleSubscription } from "./SimpleSubscription";
import { Subscribable } from "./Subscribable";

export function take<T>(
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

    let taken = 0;
    const { next, complete } = observer;
    return source.subscribe({
      get closed() {
        return taken >= amount || observer.closed;
      },
      ...(next || complete
        ? {
            next: (value) => {
              taken++;
              if (taken === amount && complete) {
                return then(
                  next?.call(observer, value),
                  complete.bind(observer),
                );
              }
              return next?.call(observer, value);
            },
          }
        : undefined),
      ...(complete
        ? {
            complete: () => {
              return complete.call(observer);
            },
          }
        : undefined),
    });
  });
}
