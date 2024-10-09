import { ElementDescription } from "../ElementDescription";
import {
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
  element: Element;
  uninstallers: Unmod[];

  constructor(description: ElementDescription<NS, TN>) {
    this.element = document.createElementNS(
      namespacesFull[description.namespace],
      description.tag,
    );
    this.uninstallers =
      description.mods?.map((mod) =>
        mod(this.element as NamespaceToElementRepository[NS][TN]),
      ) ?? [];
  }

  destroy(parent: Element) {
    for (const uninstalled of this.uninstallers.splice(0)) {
      uninstalled();
    }
    parent.removeChild(this.element);
  }
}
