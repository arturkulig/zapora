import {
  ElementNamespace,
  ElementTagNames,
  NamespaceToElementRepository,
} from "./ElementNamespaces";

export type Mod<NS extends ElementNamespace, TN extends ElementTagNames<NS>> = (
  element: NamespaceToElementRepository[NS][TN],
) => Unmod;

export type Unmod = () => void;
