import type { ElementDescription } from "../ElementDescription";
import type { EventHandler } from "../EventHandler";
import { animate, AnimationMessage } from "./animate";
import {
  AnyPotentialElement,
  ElementNamespace,
  ElementTagNames,
  namespacesFull,
} from "./ElementNamespaces";
import { event } from "./event";
import { prop } from "./prop";
import { style } from "./style";
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
                ? prop(this.element, propertyName, streamOrValue)
                : undefined,
          )
        : nullArr),
      ...(description.style
        ? Object.entries(description.style).map(
            ([propertyName, streamOrValue]) =>
              streamOrValue != null
                ? style(this.element, propertyName, streamOrValue)
                : undefined,
          )
        : nullArr),
      ...(description.on
        ? Object.entries(description.on).map(([propertyName, handler]) =>
            handler != null
              ? event(
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
            .map((source) => animate(this.element, source))
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
