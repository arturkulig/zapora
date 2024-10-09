import {
  ElementNamespace,
  ElementTagNames,
} from "./internal/ElementNamespaces";
import { Mod } from "./internal/Mod";

export interface ElementDescription<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
> {
  namespace: NS;
  tag: TN;
  mods?: Mod<NS, TN>[];
}
