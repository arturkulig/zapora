import { applyDescription } from "./internal/applyDescription";
import { createDomElement } from "./internal/createDomElement";
import { ZBElement } from "./publicTypes";

export function render(element: ZBElement, root: HTMLElement) {
  const appNode = createDomElement(element);
  const appLife = applyDescription(element, appNode);
  root.appendChild(appNode);
  appLife.pushRefMounted();

  return () => {
    root.removeChild(appNode);
    appLife.uninstallApplicators();
    appLife.pushUnmounted();
  };
}
