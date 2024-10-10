import { ElementDescription } from "../ElementDescription";
import {
  AnyPotentialElement,
  ElementNamespace,
  ElementTagNames,
  namespacesFull,
  NamespaceToElementRepository,
} from "./ElementNamespaces";
import { Unmod } from "./Mod";

export class Material<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
> {
  element: NamespaceToElementRepository[NS][TN];
  uninstallers: Unmod[];

  constructor(description: ElementDescription<NS, TN>) {
    this.element = document.createElementNS(
      namespacesFull[description.namespace],
      description.tag,
    ) as NamespaceToElementRepository[NS][TN];
    this.uninstallers = description.mods?.map((mod) => mod(this.element)) ?? [];
  }

  destroy(parent: Element) {
    for (const uninstalled of this.uninstallers.splice(0)) {
      uninstalled();
    }
    parent.removeChild(this.element as AnyPotentialElement);
  }
}
