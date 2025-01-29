import { Observable, PipeTransform } from "./Observable";
import { CompleteObserver, Observer } from "./Observer";
import { State } from "./State";
import { Subscribable } from "./Subscribable";

export class BidirectionalObservable<OUT, IN>
  extends Observable<OUT>
  implements CompleteObserver<IN>
{
  #in: Observer<IN>;

  constructor(output: Subscribable<OUT>, input: Observer<IN>) {
    super((observer) => output.subscribe(observer));
    this.#in = input;
  }

  get closed() {
    return !!this.#in.closed;
  }

  next(value: IN) {
    return this.#in.next?.(value);
  }

  complete() {
    return this.#in.complete?.();
  }

  pipe<R>(transform: PipeTransform<typeof this, R>): R {
    return transform(this);
  }
}

export class BidirectionalState<OUT, IN>
  extends State<OUT>
  implements CompleteObserver<IN>
{
  #in: Observer<IN>;
  #out: State<OUT>;

  constructor(output: State<OUT>, input: Observer<IN>) {
    super(
      (observer) => output.subscribe(observer),
      () => output.value,
    );
    this.#in = input;
    this.#out = output;
  }

  get closed() {
    return !!this.#in.closed;
  }

  next(value: IN) {
    return this.#in.next?.(value);
  }

  update(valueUpdate: (value: OUT) => IN) {
    return this.#in.next?.(valueUpdate(this.#out.value));
  }

  complete() {
    return this.#in.complete?.();
  }

  pipe<R>(transform: PipeTransform<typeof this, R>): R {
    return transform(this);
  }
}
