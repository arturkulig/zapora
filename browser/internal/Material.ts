import type { ElementDescription } from "../ElementDescription";
import type { EventHandler } from "../EventHandler";
import { AnimationMessage, applyAnimation } from "./applyAnimation";
import { applyChildren } from "./applyChildren";
import { applyEventHandler } from "./applyEventHandler";
import { applyProps } from "./applyProps";
import { applyStyle } from "./applyStyle";
import {
  AnyPotentialElement,
  ElementNamespace,
  ElementTagNames,
  namespacesFull,
} from "./ElementNamespaces";
import { Uninstaller } from "./Uninstaller";

const nullArr: never[] = [];

export class Material<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
> {
  element: AnyPotentialElement;
  uninstallers: Uninstaller[];

  constructor(description: ElementDescription<NS, TN>) {
    this.element = document.createElementNS(
      namespacesFull[description.namespace],
      description.tag,
    ) as AnyPotentialElement;
    this.uninstallers = [
      ...(description.props
        ? Object.entries(description.props).map(
            ([propertyName, streamOrValue]) =>
              streamOrValue != null
                ? applyProps(this.element, propertyName, streamOrValue)
                : undefined,
          )
        : nullArr),
      ...(description.style
        ? Object.entries(description.style).map(
            ([propertyName, streamOrValue]) =>
              streamOrValue != null
                ? applyStyle(this.element, propertyName, streamOrValue)
                : undefined,
          )
        : nullArr),
      ...(description.on
        ? Object.entries(description.on).map(([propertyName, handler]) =>
            handler != null
              ? applyEventHandler(
                  this.element,
                  propertyName,
                  handler as EventHandler<Event>,
                )
              : undefined,
          )
        : nullArr),
      ...(description.animate
        ? new Array<AnimationMessage>()
            .concat(description.animate)
            .map((source) => applyAnimation(this.element, source))
        : nullArr),
      ...(description.children
        ? [applyChildren(this.element, description.children)]
        : nullArr),
    ].filter((uninstaller) => uninstaller != null);
  }

  destroy(parent: Element) {
    for (const uninstalled of this.uninstallers.splice(0)) {
      uninstalled();
    }
    parent.removeChild(this.element as AnyPotentialElement);
  }
}
