import { AnyEventMap, ZBChildren, ZBElement } from "../public";
import { ChildNodeManipulator } from "./ChildNodeManipulator";
import { ComponentController } from "./ComponentController";
import { ContextComposer } from "./ContextComposer";
import { createDomElement } from "./createDomElement";
import { ElementController } from "./ElementController";
import {
  AnyElement,
  ElementNamespace,
  namespacesFull,
} from "./ElementNamespaces";
import { ParentNodeManipulator } from "./ParentNodeManipulator";
import { ComponentStateEntry, resolveNonElements } from "./resolveNonElements";
import {
  isSamePath,
  ZBFinalElementTag,
  ZBPathedFinalChild,
  ZBPathedFinalChildren,
  ZonePath,
} from "./ZonePath";

export class ChildrenComponentController<
  ELEMENT extends Element,
> extends ComponentController<ELEMENT, ZBChildren> {
  private controllers = new WeakMap<
    Node,
    ElementController<AnyElement, AnyEventMap>
  >();
  private keyMap = new WeakMap<Node, ZonePath>();
  private localStates: ComponentStateEntry[] = [];

  constructor(
    element: ELEMENT,
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
        elementController.applyDescription({}, this.contexts);
        elementController.unmounted();
      }
    }
  }
  protected applyValue(rawRight: ZBChildren): void {
    const pathedRight: ZBPathedFinalChildren = [];
    resolveNonElements(
      rawRight,
      [],
      this.localStates,
      this.contexts,
      pathedRight,
    );

    const leftNodes = Array.from(this.element.childNodes);

    const pathedLeftChildren: ZonedNode[] = getZonedLeftSide(
      leftNodes,
      this.keyMap,
    );

    const rightSettled = materializeRightNodes(pathedLeftChildren, pathedRight);

    const { inserts, existing, remove } = compactRender(
      leftNodes,
      rightSettled,
    );

    // removal of left out
    for (const node of remove) {
      this.element.removeChild(node);
      this.controllers.get(node)?.unmounted();
    }

    // reorder of remaining
    const parent = new ParentNodeManipulator(this.element);
    parent.append(existing);

    // inserts of new
    for (const instruction of inserts) {
      if (instruction.before) {
        new ChildNodeManipulator(instruction.before).before(
          instruction.inserts,
        );
      } else {
        parent.append(instruction.inserts);
      }
    }

    // follow with new properties on all children
    finalizeRightNodes(rightSettled, this.controllers);

    // inform of the mount
    if (this.element.parentNode) {
      for (const settled of rightSettled) {
        if (!settled.present && settled.type === ZBFinalElementTag.element) {
          this.controllers.get(settled.node)!.mounted();
        }
      }
    }
  }

  mounted() {
    for (const child of Array.from(this.element.childNodes)) {
      this.controllers.get(child)?.mounted();
    }
  }
}

function compactRender(leftNodes: ChildNode[], settledList: Settled[]) {
  const nodesLeftForRemoval = new Set(leftNodes);

  const insertInstructions: {
    inserts: ChildNode[];
    before: ChildNode | null;
  }[] = [{ inserts: [], before: null }];

  for (const settled of settledList) {
    const lastInstruction = insertInstructions.at(-1)!;

    if (settled.present) {
      nodesLeftForRemoval.delete(settled.node);

      if (lastInstruction.before) {
        lastInstruction.inserts.push(lastInstruction.before);
        lastInstruction.before = settled.node;
      } else {
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

  const existing: ChildNode[] = [];

  for (const insert of insertInstructions) {
    if (insert.before) {
      existing.push(insert.before);
    }
  }

  return { inserts: insertInstructions, existing, remove: nodesLeftForRemoval };
}

function finalizeRightNodes(
  settledList: Settled[],
  controllers: WeakMap<AnyElement, ElementController<AnyElement, AnyEventMap>>,
) {
  for (const settled of settledList) {
    if (settled.type === ZBFinalElementTag.element) {
      let controller: ElementController<AnyElement, AnyEventMap>;
      if (!settled.present) {
        controller = new ElementController(settled.node);
        controllers.set(settled.node, controller);
      }
      const foundController = controllers.get(settled.node);
      if (!foundController) {
        throw new Error("Alien element encountered among nodes");
      }
      controller = foundController;
      controller.applyDescription(settled.desc, settled.context);
    }
  }
}

function materializeRightNodes(
  pathedLeftChildren: ZonedNode[],
  resolvedRight: ZBPathedFinalChildren,
) {
  const result: Settled[] = [];
  for (const pathedRightChild of resolvedRight) {
    const leftNodeMatchingPath = findOfKey(
      pathedLeftChildren,
      pathedRightChild.path,
    )?.node;
    result.push(settleOnNode(pathedRightChild, leftNodeMatchingPath));
  }
  return result;
}

function getZonedLeftSide(
  leftNodes: ChildNode[],
  keyMap: WeakMap<Node, ZonePath>,
) {
  const result: ZonedNode[] = [];
  for (const node of leftNodes) {
    result.push({ path: keyMap.get(node)!, node });
  }
  return result;
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
    node.namespaceURI === namespacesFull[desc.namespace as ElementNamespace] &&
    node.tagName === desc.tag
  );
}
