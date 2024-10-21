import { ZBElement } from "./ZBElement";
import {
  ElementNamespace,
  ElementTagNames,
} from "./internal/ElementNamespaces";
import { createElement } from "./internal/createElement";

export function render<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
>(element: ZBElement<NS, TN>, root: HTMLElement) {
  const [app, life] = createElement(element);
  root.appendChild(app);
  life.pushRefMounted();

  return () => {
    root.removeChild(app);
    life.uninstallApplicators();
    life.pushUnmounted();
  };
}
