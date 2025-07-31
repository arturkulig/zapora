import { Observable } from "./Observable";
import { Producer } from "./Producer";
import { then } from "./then";

export type StateMaybe<T> = State<T> | Observable<T>;
export class State<T> extends Observable<T> {
  #valueGetter: () => T;

  public get value() {
    return this.#valueGetter();
  }

  constructor(updatesProducer: Producer<T>, valueGetter: () => T) {
    super(updatesProducer);
    this.#valueGetter = valueGetter;
  }

  /** Convert to regular observable that releases current state as first message */
  toObservable(): Observable<T> {
    return new Observable<T>((observer) => {
      const { next, complete } = observer;
      let firstPushed = false;
      const firstPromised = next ? next.call(observer, this.value) : undefined;
      return this.subscribe({
        get closed() {
          return observer.closed;
        },
        ...(next
          ? {
              next: (value) => {
                if (firstPushed) {
                  return next.call(observer, value);
                }
                return then(firstPromised, () => {
                  firstPushed = true;
                  return next.call(observer, value);
                });
              },
            }
          : undefined),
        ...(complete
          ? {
              complete: () => {
                if (firstPushed) {
                  return complete.call(observer);
                }
                return then(firstPromised, () => {
                  firstPushed = true;
                  return complete.call(observer);
                });
              },
            }
          : undefined),
      });
    });
  }
}
