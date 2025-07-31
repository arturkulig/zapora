import { Observable } from "./Observable";
import { Observer } from "./Observer";
import { Producer } from "./Producer";
import { State } from "./State";
import { Subscribable } from "./Subscribable";

export function mapAsync<T, U>(
  observable: State<T> | Subscribable<T>,
  transform: MapAsyncTransform<T, U>,
): Observable<U> {
  const producer: Producer<U> = (observer: Observer<U>) => {
    const { next, complete } = observer;
    return observable.subscribe({
      get closed() {
        return observer.closed;
      },
      ...(next
        ? {
            next: async (value: T) =>
              next.call(observer, await transform(value)),
          }
        : undefined),
      ...(complete ? { complete: () => complete.call(observer) } : undefined),
    });
  };
  return new Observable(producer);
}

type MapAsyncTransform<T, U> = (value: T) => Promise<U>;
