import { Producer } from "./Producer";
import { Subscribable } from "./Subscribable";

export class Observable<T> implements Subscribable<T> {
  constructor(public subscribe: Producer<T>) {}

  pipe<R>(transform: pipeTransform<typeof this, R>): R {
    return transform(this);
  }
}

export interface pipeTransform<T, R> {
  (this: void, source: T): R;
}
