import { ZBChildren } from "../ZBElement";
import { applicator } from "./applicator";
import { applyDescription } from "./applyDescription";
import { createElement } from "./createElement";
import { StreamMaybe } from "./StreamMaybe";
import { Uninstaller } from "./Uninstaller";

const ARG_MAX_LEN = 2 ** 16;

export function applyChildren(element: any, source: StreamMaybe<ZBChildren>) {
  let uninstallers: WeakMap<ChildNode, Uninstaller> = new WeakMap();

  let key2Element: Record<string, ChildNode> = {};

  return applicator(
    element,
    source,
    // init
    (parent: Element) => {
      parent.replaceChildren();
    },
    // destroy
    (parent: Element) => {
      for (const child of Array.from(parent.childNodes)) {
        uninstallers.get(child)?.();
      }
      parent.replaceChildren();
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
      const right = new RenderingStrategy();
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
          : parent.childNodes[rightIdx];

        if (
          leftNode instanceof Element &&
          (leftNode.namespaceURI == null ||
            leftNode.namespaceURI === rightDescription.namespace) &&
          leftNode.tagName === rightDescription.tag
        ) {
          uninstallers.get(leftNode)?.();
          uninstallers.set(
            leftNode,
            applyDescription(rightDescription, leftNode),
          );
          right.appendExistingChild(leftNode, childKey);
        } else {
          const [child, uninstaller] = createElement(rightDescription);
          uninstallers.set(child, uninstaller);
          right.appendNewChild(child, childKey);
        }
      }

      key2Element = right.key2Element;

      // remove elements intended to be left out
      const removedList = new Set(Array.from(parent.childNodes)).difference(
        new Set(right.nodes),
      );
      for (const removedChild of removedList) {
        uninstallers.get(removedChild)?.();
        parent.removeChild(removedChild);
      }

      // replace children entirely if no children remain from the past
      if (parent.childNodes.length === 0) {
        if (right.nodes.length < ARG_MAX_LEN) {
          parent.replaceChildren(...right.nodes);
        } else {
          while (right.nodes.length) {
            parent.append(...right.nodes.splice(0, ARG_MAX_LEN));
          }
        }
        return;
      }

      // while all nodes left are meant to stay
      // add remaining new nodes
      for (const segment of right.newSegments) {
        if (segment.closing == null) {
          if (segment.nodes.length < ARG_MAX_LEN) {
            parent.append(...segment.nodes);
          } else {
            while (segment.nodes.length) {
              parent.append(...segment.nodes.splice(0, ARG_MAX_LEN));
            }
          }
        } else {
          if (segment.nodes.length < ARG_MAX_LEN) {
            segment.closing.before(...segment.nodes);
          } else {
            while (segment.nodes.length) {
              segment.closing.before(...segment.nodes.splice(0, ARG_MAX_LEN));
            }
          }
        }
      }
    },
  );
}

type RenderingStrategySegment = {
  closing: ChildNode | null;
  nodes: ChildNode[];
};

class RenderingStrategy {
  nodes: ChildNode[] = [];
  newSegments: RenderingStrategySegment[] = [{ closing: null, nodes: [] }];
  key2Element: Record<string, ChildNode> = {};

  appendExistingChild(child: ChildNode, key?: string) {
    this.appendChild(child, key);
    const last = this.newSegments[this.newSegments.length - 1];
    if (last.closing == null) {
      last.closing = child;
    }
  }

  appendNewChild(child: ChildNode, key?: string) {
    this.appendChild(child, key);
    const last = this.newSegments[this.newSegments.length - 1];
    if (last.closing != null) {
      this.newSegments.push({ closing: null, nodes: [child] });
    } else {
      last.nodes.push(child);
    }
  }

  private appendChild(child: ChildNode, key?: string) {
    this.nodes.push(child);
    if (typeof key === "string") {
      this.key2Element[key] = child;
    }
  }
}
