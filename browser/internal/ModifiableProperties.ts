import { AnyPotentialElement } from "./ElementNamespaces";
import { ImmutableProperties } from "./ImmutableProperties";

export type ModifiableProperties = Exclude<
  keyof AnyPotentialElement,
  ImmutableProperties
>;
