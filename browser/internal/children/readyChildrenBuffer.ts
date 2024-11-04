import { ZBElement } from "../../publicTypes";
import { applyDescription } from "../applyDescription";
import { createDomElement } from "../createDomElement";
import { ElementNamespace, namespacesFull } from "../ElementNamespaces";
import { Lifecycle } from "../Lifecycle";
import { ChildNodesBuffer } from "./ChildNodesBuffer";
import {
  FinalChild,
  isSamePath,
  ZBPathedFinalChildren,
  ZonePath,
} from "./ZonePath";

export function readyChildrenBuffer(
  parent: Element,
  pathedChildList: ZBPathedFinalChildren,
  keyMap: WeakMap<Node, ZonePath>,
  lifecycles: WeakMap<Node, Lifecycle>,
) {
  const buffer = new ChildNodesBuffer(parent);

  for (let rightIdx = 0; rightIdx < pathedChildList.length; rightIdx++) {
    const pathedChild = pathedChildList[rightIdx];

    // left node is
    // one with matching key
    // or one at the same position, but only if both don't have keys
    const leftNode = findOfKey(keyMap, parent, pathedChild.path);

    const rightNode = establishNode(lifecycles, pathedChild.item, leftNode);

    keyMap.set(rightNode, pathedChild.path);

    if (leftNode === rightNode) {
      buffer.appendExistingChild(rightNode);
    } else {
      buffer.appendNewChild(rightNode);
    }
  }

  return buffer;
}

function establishNode(
  lifecycles: WeakMap<Node, Lifecycle>,
  desc: FinalChild,
  leftNode?: Node,
) {
  if (typeof desc === "string") {
    const right =
      leftNode && isSameTextNode(leftNode, desc)
        ? leftNode
        : document.createTextNode(desc);

    return right;
  } else {
    const right =
      leftNode && isSameElement(leftNode, desc)
        ? leftNode
        : createDomElement(desc);

    if (leftNode === right) {
      lifecycles.get(leftNode)?.uninstallApplicators();
    }

    const life = applyDescription(desc, right);
    lifecycles.set(right, life);

    return right;
  }
}

function findOfKey(
  keyMap: WeakMap<Node, ZonePath>,
  parent: Element,
  soughtZonedKey: ZonePath,
) {
  let foundAtPosition: ChildNode | undefined = undefined;

  for (let index = 0; index < parent.childNodes.length; index++) {
    const child = parent.childNodes[index];

    const childZonedKey = keyMap.get(child);

    if (isSamePath(childZonedKey, soughtZonedKey)) {
      return child;
    }
  }

  return foundAtPosition;
}

function isSameTextNode(node: Node, desc: string): node is Text {
  return isTextNode(node) && node.textContent === desc;
}

function isTextNode(node: Node): node is Text {
  return node && node.nodeType === node.TEXT_NODE;
}

function isSameElement(node: Node, desc: ZBElement): node is Element {
  return (
    node instanceof Element &&
    node.namespaceURI === namespacesFull[desc.namespace as ElementNamespace] &&
    node.tagName === desc.tag
  );
}
