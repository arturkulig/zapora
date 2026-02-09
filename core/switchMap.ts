import { Observable } from "./Observable";
import { ReceivedReceit } from "./Observer";
import { SimpleSubscription } from "./SimpleSubscription";
import { Subscribable } from "./Subscribable";
import { Subscription } from "./Subscription";
import { then } from "./then";
import { TidySubscription } from "./TidySubscription";

export function switchMap<T, U>(
  source: Subscribable<T>,
  transform: (value: T) => Subscribable<U>,
): Observable<U> {
  return new Observable<U>((observer) => {
    let innerStreamSubscription: Subscription = new SimpleSubscription();
    let lastReceit: ReceivedReceit = undefined;
    let pendingInnerStream: Subscribable<U> | undefined = undefined;
    let outerCompleted = false;
    let innerCompleted = false;

    const sourceSubscription = source.subscribe({
      get closed() {
        return observer.closed;
      },

      next(outerValue) {
        if (!innerStreamSubscription.closed) {
          innerStreamSubscription.cancel();
        }

        const innerStream = transform(outerValue);
        pendingInnerStream = innerStream;

        void then(lastReceit, () => {
          if (innerStream !== pendingInnerStream) {
            return;
          }
          lastReceit = undefined;
          innerCompleted = false;
          innerStreamSubscription = innerStream.subscribe({
            get closed() {
              return observer.closed;
            },
            next: (value) => {
              if (observer.closed) {
                return;
              }
              return (lastReceit = observer.next?.(value));
            },
            complete: () => {
              innerCompleted = true;
              return targetComplete();
            },
          });
        });
      },

      complete: () => {
        if (observer.closed) {
          return;
        }
        outerCompleted = true;
        return targetComplete();
      },
    });

    function targetComplete() {
      return (lastReceit = then(lastReceit, () => {
        if (outerCompleted && innerCompleted) {
          return observer.complete?.();
        }
      }));
    }

    return new TidySubscription(() => {
      lastReceit = undefined;
      pendingInnerStream = undefined;
      if (!innerStreamSubscription.closed) {
        innerStreamSubscription.cancel();
      }
      if (!sourceSubscription.closed) {
        sourceSubscription.cancel();
      }
    });
  });
}
