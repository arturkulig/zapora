import { Observer } from "@zapora/core";

export type EventHandler<E extends Event> = (event: E) => void | Observer<E>;
