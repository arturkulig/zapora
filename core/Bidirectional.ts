import { PipeTransform } from "./Observable";
import { Observer } from "./Observer";
import { Subscribable } from "./Subscribable";
import { Subscription } from "./Subscription";

export class Bidirectional<IN, OUT> implements Observer<IN>, Subscribable<OUT> {
  #out: Subscribable<OUT>;
  #in: Observer<IN>;

  constructor(output: Subscribable<OUT>, input: Observer<IN>) {
    this.#out = output;
    this.#in = input;
  }

  get closed() {
    return this.#in.closed;
  }

  next(value: IN) {
    return this.#in.next?.(value);
  }

  complete() {
    return this.#in.complete?.();
  }

  subscribe(observer: Observer<OUT>): Subscription {
    return this.#out.subscribe(observer);
  }

  pipe<R>(transform: PipeTransform<typeof this, R>): R {
    return transform(this);
  }
}
