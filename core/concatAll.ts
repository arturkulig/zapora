import { Observable } from "./Observable";
import { SimpleSubscription } from "./SimpleSubscription";
import { Subscribable } from "./Subscribable";
import { Subscription } from "./Subscription";
import { TidySubscription } from "./TidySubscription";

export function concatAll<T>(
  source: Subscribable<Subscribable<T>>,
): Observable<T> {
  return new Observable<T>((observer) => {
    const { next, complete } = observer;
    const nextBound = next?.bind(observer);
    const completeBound = complete?.bind(observer);
    let substreamSubscription: Subscription = new SimpleSubscription();

    const sourceSubscription = source.subscribe({
      get closed() {
        return observer.closed;
      },
      next: (substream) => {
        return new Promise<void>((resolve) => {
          substreamSubscription = substream.subscribe({
            get closed() {
              return observer.closed;
            },
            ...(nextBound ? { next: nextBound } : undefined),
            complete: resolve,
          });
        });
      },
      complete: completeBound,
    });
    return new TidySubscription(() => {
      if (!substreamSubscription.closed) substreamSubscription.cancel();
      if (!sourceSubscription.closed) sourceSubscription.cancel();
    });
  });
}
