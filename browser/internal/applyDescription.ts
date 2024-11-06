import type { ZBElementArguments, ZBEventHandler } from "../public/types";
import { AnimationMessage, applyAnimation } from "./applyAnimation";
import { applyChildren } from "./applyChildren";
import { applyEventHandler } from "./applyEventHandler";
import { applyProps } from "./applyProps";
import { applyStyle } from "./applyStyle";
import { ContextComposer } from "./ContextComposer";
import { Lifecycle } from "./Lifecycle";

const nullArr: never[] = [];

export function applyDescription(
  description: ZBElementArguments,
  element: Element,
  contexts: ContextComposer,
): Lifecycle {
  const uninstallers = [
    ...(description.props
      ? Object.entries(description.props).map(
          ([propertyName, streamOrValue]) =>
            streamOrValue != null
              ? applyProps(element, propertyName, streamOrValue)
              : undefined,
        )
      : nullArr),
    ...(description.style
      ? Object.entries(description.style).map(
          ([propertyName, streamOrValue]) =>
            streamOrValue != null
              ? applyStyle(element, propertyName, streamOrValue)
              : undefined,
        )
      : nullArr),
    ...(description.on
      ? Object.entries(description.on).map(([propertyName, handler]) =>
          handler != null
            ? applyEventHandler(
                element,
                propertyName,
                handler as ZBEventHandler<Event>,
              )
            : undefined,
        )
      : nullArr),
    ...(description.animate
      ? new Array<AnimationMessage>()
          .concat(description.animate)
          .map((source) => applyAnimation(element, source))
      : nullArr),
    ...(description.children
      ? [applyChildren(element, description.children, contexts)]
      : nullArr),
  ].filter((uninstaller) => uninstaller != null);

  return {
    pushRefMounted: () => {
      const { ref } = description;
      if (!ref) {
        return;
      }
      if (!ref.closed) {
        ref.next?.(element);
      }
    },
    uninstallApplicators: () => {
      for (const uninstalled of uninstallers.splice(0)) {
        uninstalled();
      }
    },
    pushUnmounted: () => {
      const { ref } = description;
      if (!ref) {
        return;
      }
      if (!ref.closed) {
        ref.complete?.();
      }
    },
  };
}
