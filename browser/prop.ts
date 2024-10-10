import { Subscribable } from "@zapora/core";
import { applicator } from "./internal/applicator";
import {
  ElementNamespace,
  ElementTagNames,
  NamespaceToElementRepository,
} from "./internal/ElementNamespaces";
import { Mod } from "./internal/Mod";

export function prop<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
  Prop extends Extract<keyof NamespaceToElementRepository[NS][TN], string>,
>(
  name: Prop,
  source:
    | NamespaceToElementRepository[NS][TN][Prop]
    | Subscribable<NamespaceToElementRepository[NS][TN][Prop]>,
): Mod<NS, TN> {
  let initial: NamespaceToElementRepository[NS][TN][Prop];
  return applicator<NS, TN, NamespaceToElementRepository[NS][TN][Prop]>(
    source,
    (element) => {
      initial = element[name];
    },
    (element) => {
      element[name] = initial;
    },
    (element, value) => {
      element[name] = value;
    },
  );
}
