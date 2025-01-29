import { BidirectionalState } from "./Bidirectional";
import { BroadcastObserver } from "./BroadcastObserver";
import { ReceivedReceit } from "./Observer";
import { getQueueingObserver } from "./queueingObserver";
import { State } from "./State";

export class Atom<T> extends BidirectionalState<T, T> {
  #atomValue: T;

  constructor(initialValue: T) {
    const broadcast = new BroadcastObserver<T>();
    super(
      new State(
        (observer) =>
          broadcast.add(
            getQueueingObserver(observer, {
              trim: { maxLength: 1, reject: "oldest" },
            }),
          ),
        () => this.#atomValue,
      ),
      broadcast,
    );
    this.#atomValue = initialValue;
  }

  next(value: T): ReceivedReceit {
    this.#atomValue = value;
    return super.next(this.#atomValue);
  }

  update(updater: (value: T) => T): ReceivedReceit {
    this.#atomValue = updater(this.#atomValue);
    return super.next(this.#atomValue);
  }

  complete(): ReceivedReceit {
    return super.complete();
  }
}
