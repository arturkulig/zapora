import { then } from "./internal/then";
import { Observable } from "./Observable";
import { Subscribable } from "./Subscribable";
import { Subscription } from "./Subscription";

export function startWith<T>(source: Subscribable<T>, first: T): Observable<T> {
  return new Observable<T>((observer) => {
    const { next, complete } = observer;

    let sourceIntendedToBeClosed = false;
    let sourceSubscription: null | Subscription = null;

    if (next || complete) {
      void then(
        observer.closed ? undefined : next?.call(observer, first),
        subscribeToSource,
      );

      function subscribeToSource() {
        if (sourceIntendedToBeClosed || observer.closed) {
          return;
        }
        sourceSubscription = source.subscribe({
          get closed() {
            return observer.closed;
          },
          ...(next
            ? {
                next: next.bind(observer),
              }
            : undefined),
          ...(complete
            ? {
                complete: complete.bind(observer),
              }
            : undefined),
        });
      }
    }

    return {
      get closed() {
        if (sourceSubscription) {
          return sourceSubscription.closed;
        }
        return sourceIntendedToBeClosed;
      },
      cancel() {
        sourceIntendedToBeClosed = true;
        sourceSubscription?.cancel();
      },
    };
  });
}
