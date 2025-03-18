import { Observable, State } from "@zapora/core";

export type StreamMaybe<T> = T | Stream<T>;
export type Stream<T> = Observable<T> | State<T>;
