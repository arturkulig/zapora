import { ChildNodeController } from "./ChildNodeController";
import { ParentNodeController } from "./ParentNodeController";

type RenderingStrategySegment = {
  closing: ChildNode | null;
  nodes: ChildNode[];
};

export class ChildNodesBuffer {
  nodes: Node[] = [];
  newSegments: RenderingStrategySegment[] = [{ closing: null, nodes: [] }];

  constructor(private parent: Element) {}

  appendExistingChild(child: ChildNode) {
    this.appendChild(child);
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
      new ParentNodeController(this.parent).replaceChildren(this.nodes);
    } else {
      // ...add new in segments
      for (const segment of this.newSegments) {
        if (segment.closing == null) {
          new ParentNodeController(this.parent).append(segment.nodes);
        } else {
          new ChildNodeController(segment.closing).before(segment.nodes);
        }
      }
    }

    return {
      removed: removedNodes,
      added: newNodes,
    };
  }
}
