import { applyDescription } from "../internal/applyDescription";
import { ContextComposer } from "../internal/ContextComposer";
import { createDomElement } from "../internal/createDomElement";
import { ZBElement } from "./types";

export function render(element: ZBElement, root: HTMLElement) {
  const appNode = createDomElement(element);
  const appLife = applyDescription(element, appNode, new ContextComposer());
  root.appendChild(appNode);
  appLife.pushRefMounted();

  return () => {
    root.removeChild(appNode);
    appLife.uninstallApplicators();
    appLife.pushUnmounted();
  };
}
