import { ZBChildren } from "../public/types";
import { applicator } from "./applicator";
import { applyDescription } from "./applyDescription";
import { ContextComposer } from "./ContextComposer";
import { createDomElement } from "./createDomElement";
import { Lifecycle } from "./Lifecycle";
import { readyChildrenBuffer } from "./readyChildrenBuffer";
import { ComponentStateEntry, resolveNonElements } from "./resolveNonElements";
import { StreamMaybe } from "./StreamMaybe";
import { ZBFinalElementTag, ZBPathedFinalChildren, ZonePath } from "./ZonePath";

export function applyChildren(
  parent: Element,
  source: StreamMaybe<ZBChildren>,
  contexts: ContextComposer,
) {
  const lifecycles = new WeakMap<Node, Lifecycle>();
  const keyMap = new WeakMap<Node, ZonePath>();
  const localStates: ComponentStateEntry[] = [];

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
      const resolvedRight: ZBPathedFinalChildren = [];
      resolveNonElements(
        rightChildDescList,
        [],
        localStates,
        contexts,
        resolvedRight,
      );

      for (const rightChildDesc of resolvedRight) {
        let added: Node;
        if (rightChildDesc.type === ZBFinalElementTag.string) {
          const child = document.createTextNode(rightChildDesc.desc);
          added = child;
          parent.append(child);
        } else {
          const child = createDomElement(rightChildDesc.desc);
          added = child;
          const lifecycle = applyDescription(
            rightChildDesc.desc,
            child,
            rightChildDesc.contexts,
          );
          lifecycles.set(child, lifecycle);
          parent.appendChild(child);
          lifecycle.pushRefMounted();
        }
        keyMap.set(added, rightChildDesc.path);
      }
    },
    // apply streamed
    (parent: Element, rightChildDescList) => {
      const resolvedRight: ZBPathedFinalChildren = [];
      resolveNonElements(
        rightChildDescList,
        [],
        localStates,
        contexts,
        resolvedRight,
      );

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
