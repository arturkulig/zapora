import { then } from "./internal/then";
import { Observable } from "./Observable";
import { SimpleSubscription } from "./SimpleSubscription";

export function ofIterable<T>(iterable: Iterable<T>) {
  return new Observable<T>((observer) => {
    const iterator = iterable[Symbol.iterator]();
    const subscription = new SimpleSubscription();
    let iterationDone = false;

    push();

    return subscription;

    function push() {
      if (iterationDone) {
        return;
      }

      if (subscription.closed || observer.closed) {
        iterator.return?.();
        return;
      }

      const iterationResult = iterator.next();
      if (iterationResult.done) {
        iterationDone = true;
        then(observer.complete?.(), push);
        return;
      }
      then(observer.next?.(iterationResult.value), push);
    }
  });
}
