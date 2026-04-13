import { BidirectionalObservable } from "./Bidirectional";
import { BroadcastObserver } from "./BroadcastObserver";
import { ClosingObserver } from "./ClosingObserver";
import { Observable } from "./Observable";
import { getQueueingObserver } from "./queueingObserver";

export class Subject<T> extends BidirectionalObservable<T, T> {
  constructor() {
    const broadcast = new BroadcastObserver<T>();
    const receiver = new ClosingObserver(broadcast);
    super(
      new Observable((observer) =>
        broadcast.add(getQueueingObserver(observer)),
      ),
      receiver,
    );
  }
}
