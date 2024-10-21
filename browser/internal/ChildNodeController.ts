import { CONFIG } from "./config";

export class ChildNodeController {
  constructor(private element: ChildNode) {}

  get childNodes() {
    return this.element.childNodes;
  }

  before(nodes: (Node | string)[]) {
    if (nodes.length < CONFIG.ARG_MAX_LEN) {
      this.element.before(...nodes);
    } else {
      let page = 0;
      while (nodes.length > page * CONFIG.ARG_MAX_LEN) {
        this.element.before(
          ...nodes.slice(
            page * CONFIG.ARG_MAX_LEN,
            (page + 1) * CONFIG.ARG_MAX_LEN,
          ),
        );
        page++;
      }
    }
  }
}
