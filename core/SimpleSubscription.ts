import { Subscription } from "./Subscription";

export class SimpleSubscription implements Subscription {
  #closed = false;

  get closed() {
    return this.#closed;
  }

  cancel() {
    this.#closed = true;
  }
}
