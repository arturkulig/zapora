import { Subscribable } from "@zapora/core";

export type StreamMaybe<T> = T | Subscribable<T>;
