import { ChildNodeController } from "./ChildNodeController";
import { ParentNodeController } from "./ParentNodeController";

type RenderingStrategySegment = {
  closing: ChildNode | null;
  nodes: ChildNode[];
};

export class ChildNodesBuffer {
  nodes: ChildNode[] = [];
  newSegments: RenderingStrategySegment[] = [{ closing: null, nodes: [] }];
  key2Element: Record<string, ChildNode> = {};

  constructor(private parent: Element) {}

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
