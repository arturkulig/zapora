import { Observer } from "./Observer.js";
import { Subscription } from "./Subscription.js";

export interface Producer<T> {
  (this: void, observer: Observer<T>): Subscription;
}
