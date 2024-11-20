import { BroadcastObserver } from "./BroadcastObserver";
import { CompleteObserver, ReceivedReceit } from "./Observer";
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

  next(value: T): ReceivedReceit {
    this.#value = value;
    return this.#broadcast.next(this.#value);
  }

  update(updater: (value: T) => T): ReceivedReceit {
    this.#value = updater(this.#value);
    return this.#broadcast.next(this.#value);
  }

  complete(): ReceivedReceit {
    return this.#broadcast.complete();
  }
}
