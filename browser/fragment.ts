import { ZB_NS, ZB_TAG_FRAGMENT } from "./internal/children/fragmentSymbols";
import { ZBChildList, ZBFragment } from "./publicTypes";

function fragmentWithKey(key: TemplateStringsArray) {
  return (children: ZBChildList): ZBFragment => ({
    namespace: ZB_NS,
    tag: ZB_TAG_FRAGMENT,
    key: key.join(""),
    children,
  });
}

function fragmentWoKey(children: ZBChildList): ZBFragment {
  return {
    namespace: ZB_NS,
    tag: ZB_TAG_FRAGMENT,
    children,
  };
}

export const fragment = Object.assign(fragmentWoKey, { key: fragmentWithKey });
