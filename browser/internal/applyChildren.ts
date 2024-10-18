import { ZBChildren } from "../ZBElement";
import { applicator } from "./applicator";
import { applyDescription } from "./applyDescription";
import { createElement } from "./createElement";
import { StreamMaybe } from "./StreamMaybe";
import { Uninstaller } from "./Uninstaller";

export function applyChildren(element: any, source: StreamMaybe<ZBChildren>) {
  let uninstallers: WeakMap<ChildNode, Uninstaller> = new WeakMap();

  let key2Element: Record<string, ChildNode> = {};

  return applicator(
    element,
    source,
    // init
    (parent: Element) => {
      while (parent.childNodes.length > 0) {
        parent.removeChild(parent.childNodes[0]);
      }
    },
    // destroy
    (parent: Element) => {
      while (parent.childNodes.length > 0) {
        const removed = parent.childNodes[0];
        if (removed instanceof Element) {
          uninstallers.get(removed)?.();
        }
        parent.removeChild(removed);
      }
    },
    // apply state
    (parent: Element, childrenDescriptions) => {
      for (const childDescription of childrenDescriptions) {
        const [child, uninstaller] = createElement(childDescription);
        uninstallers.set(child, uninstaller);
        parent.appendChild(child);
      }
    },
    // apply streamed
    (parent: Element, childrenDescriptions) => {
      // formulate the future state of children
      const rightSideKeyed = childrenDescriptions.map(
        (rightDescription, rightIdx): [string, ChildNode] => {
          const leftNode: ChildNode | undefined = rightDescription.key
            ? key2Element[rightDescription.key]
            : parent.childNodes[rightIdx];

          const childKey =
            rightDescription.key == null
              ? `n${rightIdx}`
              : typeof rightDescription.key === "string"
                ? `s${rightDescription.key}`
                : `n${rightDescription.key}`;

          if (leftNode instanceof Element) {
            if (
              (leftNode.namespaceURI == null ||
                leftNode.namespaceURI === rightDescription.namespace) &&
              leftNode.tagName === rightDescription.tag
            ) {
              uninstallers.get(leftNode)?.();
              uninstallers.set(
                leftNode,
                applyDescription(rightDescription, leftNode),
              );
              return [childKey, leftNode];
            }
          }

          const [child, uninstaller] = createElement(rightDescription);
          uninstallers.set(child, uninstaller);
          return [childKey, child];
        },
      );

      key2Element = Object.fromEntries(rightSideKeyed);

      // apply the future state of children
      const rightSide = rightSideKeyed.map((entry) => entry[1]);

      // clean up left out
      const leftOut = new Set(Array.from(parent.childNodes)).difference(
        new Set(rightSide),
      );
      for (const formerChild of leftOut) {
        uninstallers.get(formerChild)?.();
      }

      parent.replaceChildren(...rightSide);

      // let leftIdx = 0; // existing nodes crawl interation index
      // let rightIdx = 0; // intended nodes crawl interation index

      // while (
      //   leftIdx < leftSide.length ||
      //   rightIdx < childrenDescriptions.length
      // ) {
      //   const leftElement: ChildNode | undefined = leftSide[leftIdx];
      //   const rightElement: ChildNode | undefined = rightSide[rightIdx];

      //   // same node
      //   if (leftElement === rightElement) {
      //     leftIdx++;
      //     rightIdx++;
      //     continue;
      //   }

      //   if (!leftElement) {
      //     parent.append(...rightSide.slice(rightIdx));
      //     break;
      //   }

      //   if (!rightElement) {
      //     parent.removeChild(leftElement);
      //     continue;
      //   }

      //   // node gone
      //   if (!rightElement || !rightSide.includes(leftElement)) {
      //     parent.removeChild(leftElement);
      //     leftSide.splice(leftIdx, 1);
      //     continue;
      //   }

      //   // new node
      //   if (!leftSide.includes(rightElement)) {
      //     parent.insertBefore(rightElement, leftElement);
      //     rightIdx++;
      //     continue;
      //   }

      //   parent.insertBefore(rightElement, leftElement);
      //   rightIdx++;
      //   continue;
      // }
    },
  );
}
