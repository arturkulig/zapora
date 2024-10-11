import { ElementDescription } from "../ElementDescription";
import { animate, AnimationMessage } from "./animate";
import {
  AnyPotentialElement,
  ElementNamespace,
  ElementTagNames,
  namespacesFull,
} from "./ElementNamespaces";
import { prop } from "./prop";
import { style } from "./style";

const nullArr: never[] = [];

export class Material {
  element: AnyPotentialElement;
  uninstallers: (() => void)[];

  constructor(
    description: ElementDescription<
      ElementNamespace,
      ElementTagNames<ElementNamespace>
    >,
  ) {
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
