import { Observer } from "@zapora/core";

export type ZBEventHandler<E extends Event> =
  | ((event: E) => void)
  | Observer<E>;
