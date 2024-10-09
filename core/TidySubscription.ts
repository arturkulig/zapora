import { Subscription } from "./Subscription";

export class TidySubscription implements Subscription {
  #closed = false;
  #cleanup?: () => void;

  get closed() {
    return this.#closed;
  }

  constructor(cleanup?: () => void) {
    this.#cleanup = cleanup;
  }

  cancel() {
    if (this.#closed) {
      return;
    }

    this.#closed = true;
    try {
      this.#cleanup?.();
    } catch (e) {
      this.#closed = false;
      throw e;
    }
  }
}
