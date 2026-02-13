import { Observable } from "./Observable";
import { SimpleSubscription } from "./SimpleSubscription";
import { then } from "./then";

export function ofIterable<T>(iterable: Iterable<T>) {
  return new Observable<T>((observer) => {
    const iterator = iterable[Symbol.iterator]();
    const subscription = new SimpleSubscription();

    push();

    return subscription;

    function push() {
      if (subscription.closed || observer.closed) {
        iterator.return?.();
        return;
      }

      const iterationResult = iterator.next();
      if (iterationResult.done) {
        if (!observer.closed) {
          void observer.complete?.();
        }
        return;
      }
      void then(
        !observer.closed ? observer.next?.(iterationResult.value) : undefined,
        push,
      );
    }
  });
}
