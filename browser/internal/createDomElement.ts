import type { ZBElement } from "../publicTypes";
import { ElementNamespace, namespacesFull } from "./ElementNamespaces";

export function createDomElement(description: ZBElement): Element {
  const element =
    description.namespace === "html"
      ? document.createElement(description.tag)
      : document.createElementNS(
          namespacesFull[description.namespace as ElementNamespace],
          description.tag,
        );
  return element;
}
