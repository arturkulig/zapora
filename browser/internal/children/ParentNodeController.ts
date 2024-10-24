import { CONFIG } from "../config";

export class ParentNodeController {
  constructor(private element: ParentNode) {}

  append(nodes: (Node | string)[]) {
    if (nodes.length < CONFIG.ARG_MAX_LEN) {
      this.element.append(...nodes);
    } else {
      let page = 0;
      while (nodes.length > page * CONFIG.ARG_MAX_LEN) {
        this.element.append(
          ...nodes.slice(
            page * CONFIG.ARG_MAX_LEN,
            (page + 1) * CONFIG.ARG_MAX_LEN,
          ),
        );
        page++;
      }
    }
  }

  replaceChildren(nodes: (Node | string)[]) {
    if (nodes.length < CONFIG.ARG_MAX_LEN) {
      this.element.replaceChildren(...nodes);
    } else {
      this.element.replaceChildren(...nodes.slice(0, CONFIG.ARG_MAX_LEN));
      let page = 1;
      while (nodes.length > page * CONFIG.ARG_MAX_LEN) {
        this.element.append(
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
