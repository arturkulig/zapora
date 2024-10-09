import { Observable } from "./Observable";
import { Observer } from "./Observer";
import { Producer } from "./Producer";
import { State } from "./State";
import { Subscribable } from "./Subscribable";

export function map<T, U>(
  observable: State<T>,
  transform: MapTransform<T, U>,
): State<U>;
export function map<T, U>(
  observable: Subscribable<T>,
  transform: MapTransform<T, U>,
): Observable<U>;
export function map<T, U>(
  observable: State<T> | Subscribable<T>,
  transform: MapTransform<T, U>,
): State<U> | Observable<U> {
  const producer: Producer<U> = (observer: Observer<U>) => {
    const { next, complete } = observer;
    return observable.subscribe({
      get closed() {
        return observer.closed;
      },
      ...(next
        ? { next: (value: T) => next.call(observer, transform(value)) }
        : undefined),
      ...(complete ? { complete: () => complete.call(observer) } : undefined),
    });
  };
  if (observable instanceof State) {
    return new State(producer, () => transform(observable.value));
  }
  return new Observable(producer);
}

type MapTransform<T, U> = (value: T) => U;
