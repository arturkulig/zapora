import { Observable } from "./Observable";
import { Subscribable } from "./Subscribable";

export function filter<T>(
  this: void,
  source: Subscribable<T>,
  predicate: (value: T) => boolean,
): Observable<T> {
  return new Observable<T>((observer) => {
    const { next, complete } = observer;
    return source.subscribe({
      get closed() {
        return observer.closed;
      },
      ...(next
        ? {
            next: (value: T) => {
              if (predicate(value)) {
                return next.call(observer, value);
              }
            },
          }
        : undefined),
      ...(complete ? { complete: complete.bind(observer) } : undefined),
    });
  });
}
