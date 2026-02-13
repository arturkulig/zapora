import { Observable } from "./Observable";
import { Observer } from "./Observer";
import { Producer } from "./Producer";
import { State } from "./State";
import { Subscribable } from "./Subscribable";
import { TidySubscription } from "./TidySubscription";

export function mapAsync<T, U>(
  source: State<T> | Subscribable<T>,
  transform: MapAsyncTransform<T, U>,
): Observable<U> {
  const producer: Producer<U> = (observer: Observer<U>) => {
    let subCancelled = false;
    const { next, complete } = observer;
    const sourceSub = source.subscribe({
      get closed() {
        return observer.closed;
      },
      ...(next
        ? {
            next: async (value: T) => {
              const transformedValue = await transform(value);
              return subCancelled || observer.closed
                ? undefined
                : next.call(observer, transformedValue);
            },
          }
        : undefined),
      ...(complete
        ? {
            complete: () => {
              return subCancelled || observer.closed
                ? undefined
                : complete.call(observer);
            },
          }
        : undefined),
    });
    return new TidySubscription(() => {
      subCancelled = true;
      if (!sourceSub.closed) {
        sourceSub.cancel();
      }
    });
  };
  return new Observable(producer);
}

type MapAsyncTransform<T, U> = (value: T) => Promise<U>;
