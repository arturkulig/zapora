import { Producer } from "./Producer";
import { Subscribable } from "./Subscribable";

export class Observable<T> implements Subscribable<T> {
  constructor(public subscribe: Producer<T>) {}

  pipe<R>(transform: PipeTransform<typeof this, R>): R {
    return transform(this);
  }
}

export interface PipeTransform<T, R> {
  (this: void, source: T): R;
}
