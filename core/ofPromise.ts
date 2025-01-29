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
        return then(observer.next?.(value), () => {
          if (subscription.closed) {
            return;
          }
          return observer.complete?.();
        });
      })
      .catch((error) => {
        console.error(error);
        if (subscription.closed) {
          return;
        }
        return observer.complete?.();
      });

    return subscription;
  });
}
