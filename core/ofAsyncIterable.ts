import { scheduleImmediately } from "./internal/scheduleImmediately";
import { Observable } from "./Observable";
import { SimpleSubscription } from "./SimpleSubscription";
import { then } from "./then";

export function ofAsyncIterable<T, TReturn = void, TNext = void>(
  iterable: AsyncIterable<T, TReturn, TNext>,
) {
  return new Observable<T>((observer) => {
    const iterator = iterable[Symbol.asyncIterator]();
    const subscription = new SimpleSubscription();

    scheduleImmediately(push);

    return subscription;

    async function push() {
      if (subscription.closed || observer.closed) {
        void iterator.return?.();
        return;
      }

      const iterationResult = await iterator.next();
      if (subscription.closed || observer.closed) {
        void iterator.return?.();
        return;
      }
      if (iterationResult.done) {
        void observer.complete?.();
        return;
      }
      void then(observer.next?.(iterationResult.value), push);
    }
  });
}
