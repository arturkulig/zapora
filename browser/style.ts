import { Subscribable } from "@zapora/core";
import { applicator } from "./internal/applicator";
import {
  AnyPotentialElement,
  ElementNamespace,
  ElementTagNames,
} from "./internal/ElementNamespaces";
import { Mod } from "./internal/Mod";

export function style<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
  Prop extends Extract<keyof CSSStyleDeclaration, string>,
>(
  propertyName: Prop,
  source: CSSStyleDeclaration[Prop] | Subscribable<CSSStyleDeclaration[Prop]>,
): Mod<NS, TN> {
  let initial: CSSStyleDeclaration[Prop];

  return applicator<NS, TN, CSSStyleDeclaration[Prop]>(
    source,
    (element) => {
      initial = (element as AnyPotentialElement).style[propertyName];
    },
    (element) => {
      (element as AnyPotentialElement).style[propertyName] = initial;
    },
    (element, value) => {
      (element as AnyPotentialElement).style[propertyName] = value;
    },
  );
}
