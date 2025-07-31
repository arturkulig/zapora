import { noop } from "./internal/noop";
import { CompleteObserver, Observer } from "./Observer";
import { Subscription } from "./Subscription";

export class BroadcastObserver<T> implements CompleteObserver<T> {
  #listeners = new Set<{ observer: Observer<T> }>();

  get closed() {
    if (this.#listeners.size === 0) {
      return false;
    } // maybe always false?
    for (const listener of this.#listeners) {
      if (!listener.observer.closed) {
        return false;
      }
    }
    return true;
  }

  add(observer: Observer<T>): Subscription {
    const listener = { observer };
    this.#listeners.add(listener);
    const listeners = this.#listeners;
    return {
      get closed() {
        return !listeners.has(listener);
      },
      cancel() {
        listeners.delete(listener);
      },
    };
  }

  next(value: T) {
    if (this.#listeners.size === 0) {
      return;
    }
    const receits = Array.from(this.#listeners, (listener) => {
      if (!listener.observer.closed) {
        return listener.observer.next?.(value);
      }
    });
    return receits.some((receit) => receit !== undefined)
      ? Promise.allSettled(receits.filter((item) => item != null)).then(noop)
      : undefined;
  }

  complete() {
    if (this.#listeners.size === 0) {
      return;
    }
    const listeners = this.#listeners;
    this.#listeners = new Set();
    const receits = Array.from(listeners, (listener) => {
      if (!listener.observer.closed) {
        return listener.observer.complete?.();
      }
    });
    return receits.some((receit) => receit !== undefined)
      ? Promise.allSettled(receits).then(noop)
      : undefined;
  }
}
