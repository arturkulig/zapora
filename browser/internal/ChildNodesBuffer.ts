import { ChildNodeManipulator } from "./ChildNodeManipulator";
import { ParentNodeManipulator } from "./ParentNodeManipulator";

type RenderingStrategySegment = {
  closing: ChildNode | null;
  nodes: ChildNode[];
};

export class ChildNodesBuffer {
  nodes: Node[] = [];
  existingSegments: Node[] = [];
  newSegments: RenderingStrategySegment[] = [{ closing: null, nodes: [] }];

  constructor(private parent: Element) {}

  appendExistingChild(child: ChildNode) {
    this.appendChild(child);
    this.existingSegments.push(child);
    const last = this.newSegments[this.newSegments.length - 1];
    if (last.closing == null) {
      last.closing = child;
    }
  }

  appendNewChild(child: ChildNode) {
    this.appendChild(child);
    const last = this.newSegments[this.newSegments.length - 1];
    if (last.closing != null) {
      this.newSegments.push({ closing: null, nodes: [child] });
    } else {
      last.nodes.push(child);
    }
  }

  private appendChild(child: Node) {
    this.nodes.push(child);
  }

  flushRender() {
    // remove all nodes meant to be removed
    // leaving only those that are present on both sides
    const removedNodes = [
      ...new Set(Array.from(this.parent.childNodes)).difference(
        new Set(this.nodes),
      ),
    ];
    for (const removedChild of removedNodes) {
      this.parent.removeChild(removedChild);
    }

    const newNodes = this.newSegments.flatMap((segment) => segment.nodes);

    // depending on whether
    // there are child nodes remaining...
    if (this.parent.childNodes.length === 0) {
      // ...apply all instantly
      new ParentNodeManipulator(this.parent).replaceChildren(this.nodes);
    } else {
      // swap positions of existing elements
      for (let index = 0; index < this.existingSegments.length; index++) {
        if (this.parent.childNodes[index] !== this.existingSegments[index]) {
          this.parent.childNodes[index].before(this.existingSegments[index]);
        }
      }
      // ...add new in segments
      for (const segment of this.newSegments) {
        if (segment.closing == null) {
          new ParentNodeManipulator(this.parent).append(segment.nodes);
        } else {
          new ChildNodeManipulator(segment.closing).before(segment.nodes);
        }
      }
    }

    return {
      removed: removedNodes,
      added: newNodes,
    };
  }
}
