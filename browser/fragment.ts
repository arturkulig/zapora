import {
  fragmentNamespace,
  fragmentTagName,
} from "./internal/children/fragmentSymbols";
import { ZBChildren, ZBFragment } from "./ZBElement";

export function fragment(
  key: TemplateStringsArray,
): (children: ZBChildren) => ZBFragment;
export function fragment(children: ZBChildren): ZBFragment;
export function fragment(
  arg: TemplateStringsArray | ZBChildren,
): ZBFragment | ((children: ZBChildren) => ZBFragment) {
  if ("raw" in arg) {
    const keyFinal = arg.join("");
    return (children: ZBChildren) => ({
      namespace: fragmentNamespace,
      tag: fragmentTagName,
      key: keyFinal,
      children,
    });
  } else {
    return {
      namespace: fragmentNamespace,
      tag: fragmentTagName,
      children: arg,
    } satisfies ZBFragment;
  }
}
