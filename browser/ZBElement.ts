import type { Observer } from "@zapora/core";
import type { AnimationMessage } from "./internal/applyAnimation";
import type { ChildKey } from "./internal/children/ChildKey";
import type {
  fragmentNamespace,
  fragmentTagName,
} from "./internal/children/fragmentSymbols";
import type { ElementNamespace } from "./internal/ElementNamespaces";
import type { ImmutableProperties } from "./internal/ImmutableProperties";
import type { StreamMaybe } from "./internal/StreamMaybe";
import type { ZBEventHandler } from "./internal/ZBEventHandler";

export interface ZBElement<ElementType = any>
  extends ZBElementArguments<ElementType> {
  namespace: ElementNamespace;
  tag: string;
}

export interface ZBElementArguments<ElementType = any> {
  key?: ChildKey;
  props?: {
    [id in Extract<
      Exclude<keyof ElementType, ImmutableProperties>,
      string
    >]?: StreamMaybe<ElementType[id]>;
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
  ref?: Observer<ElementType>;
}

export type ZBChildren = ZBChild[];

export type ZBFragment = {
  namespace: typeof fragmentNamespace;
  tag: typeof fragmentTagName;
  children: ZBChildren;
  key?: ChildKey;
};

export type ZBChild = ZBFragment | ZBElement | string;
