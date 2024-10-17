import type { EventHandler } from "./EventHandler";
import { AnimationMessage } from "./internal/applyAnimation";
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
> extends ElementProperties<NS, TN> {
  namespace: NS;
  tag: TN;
}

export interface ElementProperties<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
> {
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
  children?: Array<ElementDescription<any, any>>;
}
