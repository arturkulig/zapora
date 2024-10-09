import { ElementDescription } from "./ElementDescription";
import {
  ElementNamespace,
  ElementTagNames,
} from "./internal/ElementNamespaces";
import { Material } from "./internal/Material";

export function render<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
>(element: ElementDescription<NS, TN>, root: HTMLElement) {
  const app = new Material(element);
  root.appendChild(app.element);
  return () => {
    app.destroy(root);
  };
}
