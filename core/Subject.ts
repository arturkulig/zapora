import { BroadcastObserver } from "./BroadcastObserver";
import { Observable } from "./Observable";
import { CompleteObserver } from "./Observer";
import { getQueueingObserver } from "./queueingObserver";

export class Subject<T> extends Observable<T> implements CompleteObserver<T> {
  #broadcast: BroadcastObserver<T>;

  get closed() {
    return this.#broadcast.closed;
  }

  constructor() {
    const broadcast = new BroadcastObserver<T>();
    super((observer) => broadcast.add(getQueueingObserver(observer)));
    this.#broadcast = broadcast;
  }

  next(value: T): void | Promise<void> {
    return this.#broadcast.next(value);
  }

  complete(): void | Promise<void> {
    return this.#broadcast.complete();
  }
}
