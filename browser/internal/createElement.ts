import type { ZBElement } from "../ZBElement";
import { applyDescription } from "./applyDescription";
import {
  AnyPotentialElement,
  ElementNamespace,
  namespacesFull,
} from "./ElementNamespaces";
import { Lifecycle } from "./Lifecycle";

export function createElement(
  description: ZBElement<any, any>,
): [Element, Lifecycle] {
  const element =
    description.namespace === "html"
      ? document.createElement(description.tag)
      : (document.createElementNS(
          namespacesFull[description.namespace as ElementNamespace],
          description.tag,
        ) as AnyPotentialElement);
  return [element, applyDescription(description, element)];
}
