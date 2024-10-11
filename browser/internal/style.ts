import { Subscribable } from "@zapora/core";
import { applicator } from "./applicator";

export function style<Prop extends Extract<keyof CSSStyleDeclaration, string>>(
  element: any,
  propertyName: string,
  source: CSSStyleDeclaration[Prop] | Subscribable<CSSStyleDeclaration[Prop]>,
) {
  let initial: CSSStyleDeclaration[Prop];

  return applicator<CSSStyleDeclaration[Prop]>(
    element,
    source,
    (element) => {
      initial = element.style[propertyName];
    },
    (element) => {
      element.style[propertyName] = initial;
    },
    (element, value) => {
      element.style[propertyName] = value;
    },
  );
}
