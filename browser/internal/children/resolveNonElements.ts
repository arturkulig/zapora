import { ZBChildren, ZBFragment } from "../../ZBElement";
import { fragmentNamespace, fragmentTagName } from "./fragmentSymbols";
import { ZBPathedFinalChildren, Zone } from "./WithPath";

export function resolveNonElements(
  children: ZBChildren,
): ZBPathedFinalChildren {
  const result: ZBPathedFinalChildren = [];

  for (let index = 0; index < children.length; index++) {
    const child = children[index];

    if (typeof child === "object") {
      if (
        child.namespace === fragmentNamespace &&
        child.tag === fragmentTagName
      ) {
        const fragment = child as ZBFragment;
        if (fragment.children) {
          const fragmentZone: Zone =
            fragment.key == null
              ? {
                  origin: true,
                  position: index,
                }
              : {
                  origin: true,
                  key: fragment.key,
                };

          for (const fragmentChild of resolveNonElements(fragment.children)) {
            result.push({
              path: [fragmentZone, ...fragmentChild.path],
              item: fragmentChild.item,
            });
          }
        }
      } else {
        result.push({
          item: child,
          path: child.key
            ? [
                {
                  origin: null,
                  key: child.key,
                },
              ]
            : [{ origin: null, position: index }],
        });
      }
    } else {
      result.push({
        path: [{ origin: null, position: index }],
        item: child,
      });
    }
  }

  return result;
}
