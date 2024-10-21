import { Observer } from "@zapora/core";
import { AnimationMessage } from "./internal/applyAnimation";
import {
  ElementNamespace,
  ElementTagNames,
  NamespaceToElementRepository,
} from "./internal/ElementNamespaces";
import { ImmutableProperties } from "./internal/ImmutableProperties";
import { StreamMaybe } from "./internal/StreamMaybe";
import type { ZBEventHandler } from "./internal/ZBEventHandler";

export interface ZBElement<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
> extends ZBElementArguments<NS, TN> {
  namespace: NS;
  tag: TN;
}

export interface ZBElementArguments<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
> {
  key?: string | number;
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
    [id in keyof HTMLElementEventMap]?: ZBEventHandler<HTMLElementEventMap[id]>;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:passive`]?: ZBEventHandler<
      HTMLElementEventMap[id]
    >;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:passive:capture`]?: ZBEventHandler<
      HTMLElementEventMap[id]
    >;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:passive:capture:once`]?: ZBEventHandler<
      HTMLElementEventMap[id]
    >;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:capture`]?: ZBEventHandler<
      HTMLElementEventMap[id]
    >;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:capture:once`]?: ZBEventHandler<
      HTMLElementEventMap[id]
    >;
  } & {
    [id in keyof HTMLElementEventMap as `${id}:once`]?: ZBEventHandler<
      HTMLElementEventMap[id]
    >;
  };
  children?: StreamMaybe<ZBChildren>;
  ref?: Observer<NamespaceToElementRepository[NS][TN]>;
}

export type ZBChildren = ZBChild[];

export type ZBChild = ZBElement<any, any>;
