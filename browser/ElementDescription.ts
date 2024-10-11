import { AnimationMessage } from "./internal/animate";
import {
  ElementNamespace,
  ElementTagNames,
  NamespaceToElementRepository,
} from "./internal/ElementNamespaces";
import { ImmutableProperties } from "./internal/ImmutableProperties";
import { StreamMaybe } from "./internal/StreamMaybe";

export interface ElementDescription<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
> {
  namespace: NS;
  tag: TN;
  props?: {
    [id in Extract<
      Exclude<keyof NamespaceToElementRepository[NS][TN], ImmutableProperties>,
      string
    >]?: StreamMaybe<NamespaceToElementRepository[NS][TN][id]>;
  };
  style?: {
    [id in keyof CSSStyleDeclaration]?: StreamMaybe<CSSStyleDeclaration[id]>;
  };
  animate?: AnimationMessage | AnimationMessage[];
  on?: {
    [id in keyof HTMLElementEventMap]?: (
      event: HTMLElementEventMap[id],
    ) => void;
  };
}
