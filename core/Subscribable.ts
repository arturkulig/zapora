import { Producer } from "./Producer.js";

export interface Subscribable<T> {
  subscribe: Producer<T>;
}
