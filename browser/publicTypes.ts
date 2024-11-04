import type { Atom, Observer } from "@zapora/core";
import type { AnimationMessage } from "./internal/applyAnimation";
import type { ChildKey } from "./internal/children/ChildKey";
import type {
  ZB_NS,
  ZB_TAG_COMPONENT,
  ZB_TAG_FRAGMENT,
} from "./internal/children/fragmentSymbols";
import type { ElementNamespace } from "./internal/ElementNamespaces";
import type { ImmutableProperties } from "./internal/ImmutableProperties";
import type { StreamMaybe } from "./internal/StreamMaybe";
import type { ZBEventHandler } from "./internal/ZBEventHandler";

export type ZBChild = ZBComponentElement | ZBFragment | ZBElement | string;
export type ZBChildList = ZBChild[];
export type ZBChildren = ZBChild | ZBChildList;

export interface ZBComponentElement {
  namespace: typeof ZB_NS;
  tag: typeof ZB_TAG_COMPONENT;
  key?: ChildKey;
  component: ZBComponentRender<any, any>;
  props: any;
  defaultStateValues?: (() => any) | any;
}

export type ZBFragment = {
  namespace: typeof ZB_NS;
  tag: typeof ZB_TAG_FRAGMENT;
  children: ZBChildList;
  key?: ChildKey;
};

export interface ZBComponentRender<
  PROPS = any,
  STATE extends ZBStateArchetype = ZBStateArchetype,
> {
  (props: PROPS, states: { [id in keyof STATE]: Atom<STATE[id]> }): ZBChildren;
}

export type ZBStateArchetype = Record<string, any>;

export interface ZBElement<ElementType = any>
  extends ZBElementArguments<ElementType> {
  namespace: ElementNamespace;
  tag: string;
  key?: ChildKey;
}

export interface ZBElementArguments<ElementType = any> {
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
