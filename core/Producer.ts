import { Observer } from "./Observer.js";
import { Subscription } from "./Subscription.js";

export interface Producer<T> {
  (observer: Observer<T>): Subscription;
}
