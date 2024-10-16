import type { EventHandler } from "./EventHandler";
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
    [id in keyof HTMLElementEventMap]?: EventHandler<HTMLElementEventMap[id]>;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:passive`]?: EventHandler<
      HTMLElementEventMap[id]
    >;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:passive:capture`]?: EventHandler<
      HTMLElementEventMap[id]
    >;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:passive:capture:once`]?: EventHandler<
      HTMLElementEventMap[id]
    >;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:capture`]?: EventHandler<
      HTMLElementEventMap[id]
    >;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:capture:once`]?: EventHandler<
      HTMLElementEventMap[id]
    >;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:once`]?: EventHandler<
      HTMLElementEventMap[id]
    >;
  };
}
