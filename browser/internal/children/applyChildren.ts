import { ZBChildren } from "../../ZBElement";
import { applicator } from "../applicator";
import { applyDescription } from "../applyDescription";
import { createDomElement } from "../createDomElement";
import { Lifecycle } from "../Lifecycle";
import { StreamMaybe } from "../StreamMaybe";
import { readyChildrenBuffer } from "./readyChildrenBuffer";
import { resolveNonElements } from "./resolveNonElements";
import { ZonePath } from "./WithPath";

export function applyChildren(
  parent: Element,
  source: StreamMaybe<ZBChildren>,
) {
  const lifecycles = new WeakMap<Node, Lifecycle>();
  const keyMap = new WeakMap<Node, ZonePath>();

  return applicator(
    parent,
    source,
    // init
    (parent: Element) => {
      parent.replaceChildren();
    },
    // destroy
    (parent: Element) => {
      const children = Array.from(parent.childNodes);
      parent.replaceChildren();
      for (const child of children) {
        const life = lifecycles.get(child);
        if (life) {
          life.uninstallApplicators();
          life.pushUnmounted();
        }
      }
    },
    // apply state
    (parent: Element, rightChildDescList) => {
      const resolvedRight = resolveNonElements(rightChildDescList);

      for (const rightChildDesc of resolvedRight) {
        let added: Node;
        if (typeof rightChildDesc.item === "string") {
          const child = document.createTextNode(rightChildDesc.item);
          added = child;
          parent.append(child);
        } else {
          const child = createDomElement(rightChildDesc.item);
          added = child;
          const lifecycle = applyDescription(rightChildDesc.item, child);
          lifecycles.set(child, lifecycle);
          parent.appendChild(child);
          lifecycle.pushRefMounted();
        }
        keyMap.set(added, rightChildDesc.path);
      }
    },
    // apply streamed
    (parent: Element, rightChildDescList) => {
      const resolvedRight = resolveNonElements(rightChildDescList);

      // formulate the future state of children
      const buffer = readyChildrenBuffer(
        parent,
        resolvedRight,
        keyMap,
        lifecycles,
      );

      // render

      const { removed, added } = buffer.flushRender();

      // inform of lifecycle changes

      for (const node of removed) {
        const life = lifecycles.get(node);
        if (life) {
          life.uninstallApplicators();
          life.pushUnmounted();
        }
      }

      for (const node of added) {
        lifecycles.get(node)?.pushRefMounted();
      }
    },
  );
}
