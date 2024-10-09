import { Observable } from "./Observable";

export function distinct<T>(this: void, source: Observable<T>): Observable<T>;
export function distinct<T, K>(
  this: void,
  source: Observable<T>,
  extractor: (value: T) => K,
): Observable<T>;
export function distinct<T, K>(
  this: void,
  source: Observable<T>,
  extractor?: (value: T) => K,
): Observable<T> {
  return new Observable<T>((observer) => {
    const { next, complete } = observer;

    let last = null as null | { value: T | K };

    return source.subscribe({
      get closed() {
        return observer.closed;
      },
      ...(!next
        ? undefined
        : extractor
          ? {
              next: (value: T) => {
                const extracted = extractor(value);
                if (last == null) {
                  last = { value: extracted };
                  return next.call(observer, value);
                }
                if (extracted !== last.value) {
                  last.value = extracted;
                  return next.call(observer, value);
                }
              },
            }
          : {
              next: (value: T) => {
                if (last == null) {
                  last = { value };
                  return next.call(observer, value);
                }
                if (value !== last.value) {
                  last.value = value;
                  return next.call(observer, value);
                }
              },
            }),
      ...(complete ? { complete: () => complete.call(observer) } : undefined),
    });
  });
}
