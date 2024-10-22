import { ZBChildren } from "../ZBElement";
import { applicator } from "./applicator";
import { applyDescription } from "./applyDescription";
import { ChildNodesBuffer } from "./ChildNodesBuffer";
import { createElement } from "./createElement";
import { ElementNamespace, namespacesFull } from "./ElementNamespaces";
import { Lifecycle } from "./Lifecycle";
import { StreamMaybe } from "./StreamMaybe";

export function applyChildren(element: any, source: StreamMaybe<ZBChildren>) {
  const lifecycles = new WeakMap<ChildNode, Lifecycle>();
  const elementToKey = new WeakMap<ChildNode, string | number>();

  return applicator(
    element,
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
      for (const rightChildDesc of rightChildDescList) {
        if (typeof rightChildDesc === "string") {
          parent.append(rightChildDesc);
        } else {
          const [child, lifecycle] = createElement(rightChildDesc);
          lifecycles.set(child, lifecycle);
          parent.appendChild(child);
          lifecycle.pushRefMounted();
        }
      }
    },
    // apply streamed
    (parent: Element, rightChildDescList) => {
      const key2Element: Record<string, ChildNode> = {};
      for (const child of Array.from(parent.childNodes)) {
        const keyMaybe = elementToKey.get(child);
        if (keyMaybe != null) {
          key2Element[keyMaybe] = child;
        }
      }

      // formulate the future state of children
      const right = new ChildNodesBuffer(parent);
      for (let rightIdx = 0; rightIdx < rightChildDescList.length; rightIdx++) {
        const rightDesc = rightChildDescList[rightIdx];

        const multiTypeKey =
          typeof rightDesc === "object" ? rightDesc.key : undefined;
        const singleTypeKey =
          multiTypeKey == null
            ? undefined
            : typeof multiTypeKey === "string"
              ? `s${multiTypeKey}`
              : `n${multiTypeKey}`;

        // left node is
        // one with matching key
        // or one at the same position, but only if both don't have keys
        const leftNode =
          singleTypeKey == null
            ? !elementToKey.has(parent.childNodes[rightIdx])
              ? parent.childNodes[rightIdx]
              : undefined
            : key2Element[singleTypeKey];

        if (typeof rightDesc === "string") {
          if (leftNode && leftNode.nodeType === leftNode.TEXT_NODE) {
            right.appendExistingChild(leftNode);
          } else {
            right.appendNewChild(document.createTextNode(rightDesc));
          }
          continue;
        }

        if (
          leftNode instanceof Element &&
          leftNode.namespaceURI ===
            namespacesFull[rightDesc.namespace as ElementNamespace] &&
          leftNode.tagName === rightDesc.tag
        ) {
          lifecycles.get(leftNode)?.uninstallApplicators();
          const life = applyDescription(rightDesc, leftNode);
          lifecycles.set(leftNode, life);
          right.appendExistingChild(leftNode, singleTypeKey);
        } else {
          const [child, life] = createElement(rightDesc);
          if (singleTypeKey != null) {
            elementToKey.set(child, singleTypeKey);
          }
          lifecycles.set(child, life);
          right.appendNewChild(child, singleTypeKey);
        }
      }

      // render

      const { removed, added } = right.flushRender();

      // inform of lifecycle changes

      for (const node of removed) {
        const life = lifecycles.get(node)!;
        life.uninstallApplicators();
        life.pushUnmounted();
      }

      for (const node of added) {
        lifecycles.get(node)!.pushRefMounted();
      }
    },
  );
}
