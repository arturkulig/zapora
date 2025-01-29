import { Observable } from "./Observable";
import { Producer } from "./Producer";
import { Subscription } from "./Subscription";
import { then } from "./then";
import { TidySubscription } from "./TidySubscription";

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

  toObservable(): Observable<T> {
    return new Observable<T>((observer) => {
      let innerSub: Subscription | null = null;
      const outerSub = new TidySubscription(() => {
        if (innerSub && !innerSub.closed) {
          innerSub.cancel();
        }
      });
      void then(
        observer.closed ? undefined : observer.next?.(this.value),
        () => {
          if (!observer.closed && !outerSub.closed) {
            innerSub = this.subscribe(observer);
          }
        },
      );
      return outerSub;
    });
  }
}
