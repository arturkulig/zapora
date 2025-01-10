import { ZB_NS, ZB_TAG_CONTEXT } from "../internal/fragmentSymbols";
import { ZBChildren, ZBContextElement } from "./types";

export class Context<T> {
  #id = Symbol("context symbol");

  get id() {
    return this.#id;
  }

  provide(instance: T, children: ZBChildren): ZBContextElement {
    return {
      namespace: ZB_NS,
      tag: ZB_TAG_CONTEXT,
      id: this.id,
      instance,
      children,
    };
  }
}
