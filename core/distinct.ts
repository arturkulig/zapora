import { Observable } from "./Observable";
import { Producer } from "./Producer";
import { State } from "./State";
import { Subscribable } from "./Subscribable";

export function distinct<T>(
  this: void,
  source: State<T>,
  equals?: (prev: T, present: T) => boolean,
): State<T>;
export function distinct<T>(
  this: void,
  source: Subscribable<T>,
  equals?: (prev: T, present: T) => boolean,
): Observable<T>;
export function distinct<T>(
  this: void,
  source: Subscribable<T> | State<T>,
  equals?: (prev: T, present: T) => boolean,
): Observable<T> | State<T> {
  const producer: Producer<T> = (observer) => {
    const { next, complete } = observer;

    let last = null as null | { value: T };

    return source.subscribe({
      get closed() {
        return observer.closed;
      },
      ...(!next
        ? undefined
        : equals
          ? {
              next: (value: T) => {
                if (last == null) {
                  last = { value };
                  return next.call(observer, value);
                }
                if (!equals(last.value, value)) {
                  last.value = value;
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
  };

  if (source instanceof State) {
    return new State<T>(producer, () => source.value);
  }

  return new Observable<T>(producer);
}
