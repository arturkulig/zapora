import { ZBChildren, ZBElement } from "../public";
import { ChildNodeManipulator } from "./ChildNodeManipulator";
import { StreamedComponentController } from "./ComponentController";
import { ContextComposer } from "./ContextComposer";
import { createDomElement } from "./createDomElement";
import { ElementController } from "./ElementController";
import { ElementControlQueue } from "./ElementControlQueue";
import { AnyElement, namespacesFull } from "./ElementNamespaces";
import { ParentNodeManipulator } from "./ParentNodeManipulator";
import { ComponentStateEntry, resolveNonElements } from "./resolveNonElements";
import {
  isSamePath,
  ZBFinalElementTag,
  ZBPathedFinalChild,
  ZBPathedFinalChildren,
  ZonePath,
} from "./ZonePath";

export class ChildrenComponentController extends StreamedComponentController<
  ParentNode,
  ZBChildren
> {
  private controllers = new WeakMap<Node, ElementController>();
  private zonedNodesMap = new WeakMap<Node, ZonePath>();
  private localStates: ComponentStateEntry[] = [];

  constructor(
    private queue: ElementControlQueue,
    element: ParentNode,
    private contexts: ContextComposer,
  ) {
    super(element);
  }

  protected deinitialize(): void {
    const children = Array.from(this.element.childNodes);
    this.element.replaceChildren();
    for (const child of children) {
      const elementController = this.controllers.get(child);
      if (elementController) {
        this.queue.scheduleUnmount(elementController);
      }
    }
  }
  protected applyValue(rawRight: ZBChildren | undefined): void {
    const leftNodes = Array.from(this.element.childNodes);

    if (!rawRight) {
      if (this.element.childNodes.length > 0) {
        for (const node of leftNodes) {
          const controller = this.controllers.get(node);
          if (controller) {
            this.queue.scheduleUnmount(controller);
          }
        }
        // console.log("clear node", tag(this.element), this.element);
        this.element.replaceChildren();
        this.localStates = [];
        this.zonedNodesMap = new WeakMap();
      }
      return;
    }

    const pathedRight: ZBPathedFinalChildren = [];
    const usedStates: ComponentStateEntry[] = [];
    resolveNonElements(
      rawRight,
      [],
      this.localStates,
      usedStates,
      this.contexts,
      pathedRight,
    );
    this.localStates = usedStates;

    const rightMaterialized = this.materializeRightNodes(pathedRight);

    const { inserts, existing, remove } = this.compactRender(rightMaterialized);

    // removal of left out
    if (remove.size > 0)
      // console.log("remove", ...remove, "from", ...this.element.children);
      for (const node of remove) {
        // console.log("pre", this.element.childNodes.length);
        this.element.removeChild(node);
        // console.log("post", this.element.childNodes.length);
        const controller = this.controllers.get(node);
        if (controller) {
          this.queue.scheduleUnmount(controller);
        }
      }

    // reorder of remaining
    const elementAsParent = new ParentNodeManipulator(this.element);
    for (let i = 0; i < this.element.childNodes.length; i++) {
      const existingNode = existing[i];
      if (this.element.childNodes[i] !== existingNode) {
        const afterNode = this.element.childNodes[i] ?? null;
        // console.log(
        //   "insert existing",
        //   tag(existing[i]),
        //   existing[i],
        //   "before",
        //   tag(afterNode),
        //   afterNode,
        // );
        this.element.insertBefore(existing[i], afterNode);
      }
    }

    // inserts of new
    for (const instruction of inserts) {
      if (instruction.inserts.length === 0) {
        continue;
      }

      if (instruction.before) {
        // console.log(
        //   "insert many new",
        //   instruction.inserts.length,
        //   ...instruction.inserts.map(tag),
        //   [...instruction.inserts],
        //   "before",
        //   tag(instruction.before),
        //   instruction.before,
        // );
        new ChildNodeManipulator(instruction.before).before(
          instruction.inserts,
        );
      } else {
        // console.log(
        //   "insert many new",
        //   instruction.inserts.length,
        //   ...instruction.inserts.map(tag),
        //   [...instruction.inserts],
        //   "into",
        //   tag(this.element),
        //   this.element,
        // );
        elementAsParent.append(instruction.inserts);
      }
    }

    // follow with new properties on all children
    this.finalizeRightNodes(rightMaterialized);
  }

  private finalizeRightNodes(settledList: Settled[]) {
    for (const settled of settledList) {
      if (settled.type === ZBFinalElementTag.element) {
        let controller: ElementController;
        if (!settled.present) {
          controller = new ElementController(this.queue, settled.node);
          this.controllers.set(settled.node, controller);
        }
        const foundController = this.controllers.get(settled.node);
        if (!foundController) {
          throw new Error("Alien element encountered among nodes");
        }
        controller = foundController;
        controller.designate(settled.desc, settled.context);
      }
    }
  }

  private compactRender(settledList: Settled[]) {
    const existing: ChildNode[] = [];
    const nodesLeftForRemoval = new Set(Array.from(this.element.childNodes));
    const insertInstructions: {
      inserts: ChildNode[];
      before: ChildNode | null;
    }[] = [{ inserts: [], before: null }];

    for (const settled of settledList) {
      const lastInstruction = insertInstructions.at(-1)!;

      if (nodesLeftForRemoval.has(settled.node)) {
        nodesLeftForRemoval.delete(settled.node);
        existing.push(settled.node);

        // if (lastInstruction.before) {
        //   lastInstruction.inserts.push(lastInstruction.before);
        //   lastInstruction.before = settled.node;
        // } else {
        //   lastInstruction.before = settled.node;
        // }

        if (!lastInstruction.before && lastInstruction.inserts.length > 0) {
          lastInstruction.before = settled.node;
        }
      } else {
        if (lastInstruction.before) {
          insertInstructions.push({ inserts: [settled.node], before: null });
        } else {
          lastInstruction.inserts.push(settled.node);
        }
      }
    }

    return {
      inserts: insertInstructions,
      existing,
      remove: nodesLeftForRemoval,
    };
  }

  private materializeRightNodes(resolvedRight: ZBPathedFinalChildren) {
    const pathedLeftChildren: ZonedNode[] = this.getZonedLeftSide();

    const list: Settled[] = [];
    const nextZoneNodesMap = new WeakMap<Node, ZonePath>();

    for (const pathedRightChild of resolvedRight) {
      const leftNodeMatchingPath = findOfKey(
        pathedLeftChildren,
        pathedRightChild.path,
      )?.node;
      const settled = settleOnNode(pathedRightChild, leftNodeMatchingPath);
      list.push(settled);
      nextZoneNodesMap.set(settled.node, pathedRightChild.path);
    }

    this.zonedNodesMap = nextZoneNodesMap;
    return list;
  }

  private getZonedLeftSide() {
    const result: ZonedNode[] = [];
    for (const node of Array.from(this.element.childNodes)) {
      result.push({ path: this.zonedNodesMap.get(node)!, node });
    }
    return result;
  }
}

type Settled =
  | {
      type: typeof ZBFinalElementTag.string;
      present: boolean;
      node: Text;
    }
  | {
      type: typeof ZBFinalElementTag.element;
      present: boolean;
      node: AnyElement;
      desc: ZBElement;
      context: ContextComposer;
    };

function settleOnNode(
  intented: ZBPathedFinalChild,
  candidate: ChildNode | undefined,
): Settled {
  switch (intented.type) {
    case ZBFinalElementTag.string: {
      return candidate && isSameTextNode(candidate, intented.desc)
        ? { type: ZBFinalElementTag.string, present: true, node: candidate }
        : {
            type: ZBFinalElementTag.string,
            present: false,
            node: document.createTextNode(intented.desc),
          };
    }
    case ZBFinalElementTag.element: {
      return candidate && isSameElementType(candidate, intented.desc)
        ? {
            type: ZBFinalElementTag.element,
            present: true,
            node: candidate,
            desc: intented.desc,
            context: intented.contexts,
          }
        : {
            type: ZBFinalElementTag.element,
            present: false,
            node: createDomElement(intented.desc),
            desc: intented.desc,
            context: intented.contexts,
          };
    }
  }
}

type ZonedNode = { path: ZonePath; node: ChildNode };
function findOfKey(pathedLeftChildren: ZonedNode[], soughtZonedKey: ZonePath) {
  for (const child of pathedLeftChildren) {
    if (isSamePath(child.path, soughtZonedKey)) {
      return child;
    }
  }

  return;
}

function isSameTextNode(node: Node, desc: string): node is Text {
  return isTextNode(node) && node.textContent === desc;
}

function isTextNode(node: Node): node is Text {
  return node && node.nodeType === node.TEXT_NODE;
}

function isSameElementType(node: Node, desc: ZBElement): node is AnyElement {
  return (
    node instanceof Element &&
    node.namespaceURI === namespacesFull[desc.namespace] &&
    node.tagName === desc.tag
  );
}

// function tag(subject: Node) {
//   if (subject instanceof Text) {
//     return `"${subject.textContent}"`;
//   }
//   if (subject instanceof Element) {
//     return `${subject.tagName}${subject.id ? `"${subject.id}` : ""}${subject.className ? `.${[...subject.classList].join(".")}` : ""}>${subject.childNodes.length}`;
//   }
//   return String(subject);
// }
