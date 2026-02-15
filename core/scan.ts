import { Observable } from "./Observable";
import { Observer } from "./Observer";
import { Producer } from "./Producer";
import { State } from "./State";
import { Subscribable } from "./Subscribable";

export function scan<ITEM, REDUCED>(
  source: State<ITEM>,
  accumulate: ScanAccumulator<ITEM, REDUCED>,
  start: REDUCED,
): State<REDUCED>;
export function scan<ITEM, REDUCED>(
  source: Subscribable<ITEM>,
  accumulate: ScanAccumulator<ITEM, REDUCED>,
  start: REDUCED,
): Observable<REDUCED>;
export function scan<ITEM, REDUCED>(
  source: State<ITEM> | Subscribable<ITEM>,
  accumulate: ScanAccumulator<ITEM, REDUCED>,
  start: REDUCED,
): State<REDUCED> {
  const producer: Producer<REDUCED> = (observer: Observer<REDUCED>) => {
    let lastAccumulate: REDUCED = start;
    const { next, complete } = observer;

    return source.subscribe({
      get closed() {
        return observer.closed;
      },
      ...(next
        ? {
            next: (value: ITEM) =>
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
