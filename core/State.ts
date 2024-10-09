import { Observable } from "./Observable";
import { Producer } from "./Producer";

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
}
