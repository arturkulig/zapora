import {
  ElementNamespace,
  namespacesFull,
} from "../internal/ElementNamespaces";
import type { ZBElement } from "../public/types";

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
