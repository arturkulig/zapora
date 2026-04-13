import { CompleteObserver, Observer, ReceivedReceit } from "./Observer";

export class ClosingObserver<T> implements CompleteObserver<T> {
  #completed = false;
  get closed(): boolean {
    return this.#completed || !!this.#inner.closed;
  }

  #inner: Observer<T>;
  constructor(inner: Observer<T>) {
    this.#inner = inner;
  }

  next(value: T): ReceivedReceit {
    if (this.closed) {
      return;
    }
    return this.#inner.next?.(value);
  }

  complete(): ReceivedReceit {
    if (this.closed) {
      return;
    }
    this.#completed = true;
    return this.#inner.complete?.();
  }
}
