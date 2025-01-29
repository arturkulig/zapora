import { Observable } from "./Observable";
import { Observer } from "./Observer";
import { Producer } from "./Producer";
import { State } from "./State";
import { Subscribable } from "./Subscribable";

export function scan<T, U>(
  source: State<T>,
  accumulate: ScanAccumulator<T, U>,
  start: U,
): State<U>;
export function scan<T, U>(
  source: Subscribable<T>,
  accumulate: ScanAccumulator<T, U>,
  start: U,
): Observable<U>;
export function scan<T, U>(
  source: State<T> | Subscribable<T>,
  accumulate: ScanAccumulator<T, U>,
  start: U,
): State<U> {
  const producer: Producer<U> = (observer: Observer<U>) => {
    let lastAccumulate: U = start;
    const { next, complete } = observer;

    return source.subscribe({
      get closed() {
        return observer.closed;
      },
      ...(next
        ? {
            next: (value: T) =>
              next.call(
                observer,
                (lastAccumulate = accumulate(lastAccumulate, value)),
              ),
          }
        : undefined),
      ...(complete ? { complete: complete.bind(observer) } : undefined),
    });
  };
  if (source instanceof State) {
    return new State(producer, () => accumulate(start, source.value));
  }
  return new State(producer, () => start);
}

type ScanAccumulator<T, U> = (previousValue: U, nextValue: T) => U;
