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
    const { next, complete } = observer;
    let lastReceit: ReceivedReceit = undefined;
    let pendingInnerStream: Subscribable<U> | undefined = undefined;

    const sourceSubsription = source.subscribe({
      get closed() {
        return observer.closed;
      },
      ...(next
        ? {
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
                innerStreamSubscription = innerStream.subscribe({
                  get closed() {
                    return observer.closed;
                  },
                  next: (value) => {
                    return (lastReceit = next.call(observer, value));
                  },
                });
              });
            },
          }
        : undefined),
      ...(complete
        ? {
            complete: () => {
              return (lastReceit = then(lastReceit, () =>
                complete.call(observer),
              ));
            },
          }
        : undefined),
    });

    return new TidySubscription(() => {
      lastReceit = undefined;
      pendingInnerStream = undefined;
      if (!innerStreamSubscription.closed) {
        innerStreamSubscription.cancel();
      }
      if (!sourceSubsription.closed) {
        sourceSubsription.cancel();
      }
    });
  });
}
