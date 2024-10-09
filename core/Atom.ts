import { BroadcastObserver } from "./BroadcastObserver";
import { CompleteObserver } from "./Observer";
import { getQueueingObserver } from "./queueingObserver";
import { State } from "./State";

export class Atom<T> extends State<T> implements CompleteObserver<T> {
  #value: T;

  #broadcast: BroadcastObserver<T>;

  get closed() {
    return this.#broadcast.closed;
  }

  constructor(initialValue: T) {
    const broadcast = new BroadcastObserver<T>();
    super(
      (observer) =>
        broadcast.add(
          getQueueingObserver(observer, {
            trim: { maxLength: 1, reject: "oldest" },
          }),
        ),
      () => this.#value,
    );
    this.#broadcast = broadcast;
    this.#value = initialValue;
  }

  next(value: T): void | Promise<void> {
    this.#value = value;
    return this.#broadcast.next(value);
  }

  complete(): void | Promise<void> {
    return this.#broadcast.complete();
  }
}
