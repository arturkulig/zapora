import { Uninstaller } from "../internal/applicator";
import { ContextComposer } from "../internal/ContextComposer";
import { ElementController } from "../internal/ElementController";
import { ZBChild } from "./types";

export function render(element: ZBChild, root: HTMLElement): Uninstaller {
  const emptyContext = new ContextComposer();
  const rootController = new ElementController(root);
  rootController.applyDescription({ children: element }, emptyContext);
  return () => {
    rootController.unmounted();
  };
}
