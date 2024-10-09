import { Subscribable } from "@zapora/core";
import { applicator } from "./internal/applicator";
import {
  ElementNamespace,
  ElementTagNames,
  NamespaceToElementRepository,
} from "./internal/ElementNamespaces";
import { Mod } from "./internal/Mod";

export function style<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
  Prop extends Extract<keyof CSSStyleDeclaration, string>,
>(
  name: Prop,
  source: CSSStyleDeclaration[Prop] | Subscribable<CSSStyleDeclaration[Prop]>,
): Mod<NS, TN> {
  return applicator<NS, TN, CSSStyleDeclaration[Prop]>(
    (element) => (element as AnyPotentialElement).style[name],
    (element, value) => ((element as AnyPotentialElement).style[name] = value),
    source,
  );
}

type AnyPotentialElement = {
  [ns in keyof NamespaceToElementRepository]: NamespaceToElementRepository[ns][keyof NamespaceToElementRepository[ns]];
}[keyof NamespaceToElementRepository];
