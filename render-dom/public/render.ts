import { ContextComposer } from "../internal/ContextComposer";
import { ElementController } from "../internal/ElementController";
import { ElementControlQueue } from "../internal/ElementControlQueue";
import { ZBChild } from "./types";

export function render(element: ZBChild, root: HTMLElement) {
  const emptyContext = new ContextComposer();
  const queue = new ElementControlQueue();
  const rootController = new ElementController(queue, root);
  rootController.designate({ children: element }, emptyContext);
  return () => {
    queue.scheduleUnmount(rootController);
  };
}
