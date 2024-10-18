import type { ZBElement } from "../ZBElement";
import { applyDescription } from "./applyDescription";
import {
  AnyPotentialElement,
  ElementNamespace,
  namespacesFull,
} from "./ElementNamespaces";
import { Uninstaller } from "./Uninstaller";

export function createElement(
  description: ZBElement<any, any>,
): [Element, Uninstaller] {
  const element = document.createElementNS(
    namespacesFull[description.namespace as ElementNamespace],
    description.tag,
  ) as AnyPotentialElement;
  return [element, applyDescription(description, element)];
}
