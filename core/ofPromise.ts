import { Observable } from "./Observable";
import { SimpleSubscription } from "./SimpleSubscription";
import { then } from "./then";

export function ofPromise<T>(source: Promise<T>) {
  return new Observable<T>((observer) => {
    const subscription = new SimpleSubscription();

    source
      .then((value) => {
        if (subscription.closed) {
          return;
        }
        then(observer.next?.(value), () => {
          if (subscription.closed) {
            return;
          }
          observer.complete?.();
        });
      })
      .catch((error) => {
        (globalThis as any).console.error(error);
        if (subscription.closed) {
          return;
        }
        observer.complete?.();
      });

    return subscription;
  });
}
