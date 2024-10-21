import type { ZBElementArguments } from "../ZBElement";
import { AnimationMessage, applyAnimation } from "./applyAnimation";
import { applyChildren } from "./applyChildren";
import { applyEventHandler } from "./applyEventHandler";
import { applyProps } from "./applyProps";
import { applyStyle } from "./applyStyle";
import { Lifecycle } from "./Lifecycle";
import type { ZBEventHandler } from "./ZBEventHandler";

const nullArr: never[] = [];

export function applyDescription(
  description: ZBElementArguments<any, any>,
  element: Element,
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
      ? [applyChildren(element, description.children)]
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
