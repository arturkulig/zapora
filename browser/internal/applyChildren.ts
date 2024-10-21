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
    (parent: Element, childrenDescriptions) => {
      for (const childDescription of childrenDescriptions) {
        const [child, lifecycle] = createElement(childDescription);
        lifecycles.set(child, lifecycle);
        parent.appendChild(child);
        lifecycle.pushRefMounted();
      }
    },
    // apply streamed
    (parent: Element, childrenDescriptions) => {
      const key2Element: Record<string, ChildNode> = {};
      for (const child of Array.from(parent.childNodes)) {
        const keyMaybe = elementToKey.get(child);
        if (keyMaybe != null) {
          key2Element[keyMaybe] = child;
        }
      }

      // formulate the future state of children
      const right = new ChildNodesBuffer(parent);
      for (
        let rightIdx = 0;
        rightIdx < childrenDescriptions.length;
        rightIdx++
      ) {
        const rightDescription = childrenDescriptions[rightIdx];

        const childKey =
          rightDescription.key == null
            ? undefined
            : typeof rightDescription.key === "string"
              ? `s${rightDescription.key}`
              : `n${rightDescription.key}`;

        const leftNode: ChildNode | undefined = childKey
          ? key2Element[childKey]
          : !elementToKey.has(parent.childNodes[rightIdx])
            ? parent.childNodes[rightIdx]
            : undefined;

        if (
          leftNode instanceof Element &&
          leftNode.namespaceURI ===
            namespacesFull[rightDescription.namespace as ElementNamespace] &&
          leftNode.tagName === rightDescription.tag
        ) {
          lifecycles.get(leftNode)?.uninstallApplicators();
          const life = applyDescription(rightDescription, leftNode);
          lifecycles.set(leftNode, life);
          right.appendExistingChild(leftNode, childKey);
        } else {
          const [child, life] = createElement(rightDescription);
          if (rightDescription.key != null) {
            elementToKey.set(child, rightDescription.key);
          }
          lifecycles.set(child, life);
          right.appendNewChild(child, childKey);
        }
      }

      const { removed, added } = right.flushRender();

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
