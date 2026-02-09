import { Producer } from "./Producer.js";

export interface Subscribable<T> {
  subscribe: Producer<T>;
}

export type Subscribed<T extends Subscribable<any>> =
  T extends Subscribable<infer R> ? R : never;
