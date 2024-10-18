import { ZBElement } from "./ZBElement";
import {
  AnyPotentialElement,
  ElementNamespace,
  ElementTagNames,
} from "./internal/ElementNamespaces";
import { createElement } from "./internal/createElement";

export function render<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
>(element: ZBElement<NS, TN>, root: HTMLElement) {
  const [app, destroy] = createElement(element);
  root.appendChild(app as AnyPotentialElement);
  return () => {
    destroy();
  };
}
