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
      const firstPromised =
        !observer.closed && next ? next.call(observer, this.value) : undefined;
      return this.subscribe({
        get closed() {
          return observer.closed;
        },
        ...(next
          ? {
              next: (value) => {
                if (firstPushed) {
                  if (!observer.closed) {
                    return next.call(observer, value);
                  }
                  return;
                }
                return then(firstPromised, () => {
                  firstPushed = true;
                  if (!observer.closed) {
                    return next.call(observer, value);
                  }
                });
              },
            }
          : undefined),
        ...(complete
          ? {
              complete: () => {
                if (firstPushed) {
                  if (!observer.closed) {
                    return complete.call(observer);
                  }
                  return;
                }
                return then(firstPromised, () => {
                  firstPushed = true;
                  if (!observer.closed) {
                    return complete.call(observer);
                  }
                });
              },
            }
          : undefined),
      });
    });
  }
}
