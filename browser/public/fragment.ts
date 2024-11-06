import { ZB_NS, ZB_TAG_FRAGMENT } from "../internal/fragmentSymbols";
import { ZBChildren, ZBFragment } from "./types";

function fragmentWithKey(key: TemplateStringsArray) {
  return (children: ZBChildren): ZBFragment => ({
    namespace: ZB_NS,
    tag: ZB_TAG_FRAGMENT,
    key: key.join(""),
    children,
  });
}

function fragmentWoKey(children: ZBChildren): ZBFragment {
  return {
    namespace: ZB_NS,
    tag: ZB_TAG_FRAGMENT,
    children,
  };
}

export const fragment = Object.assign(fragmentWoKey, { key: fragmentWithKey });
