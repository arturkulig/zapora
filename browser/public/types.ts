import type { Atom, Observer } from "@zapora/core";
import { Properties as CSSProperties } from "csstype";
import type { AnimationMessage } from "../internal/applyAnimation";
import { ChildKey } from "../internal/ChildKey";
import { ContextResolver } from "../internal/ContextResolver";
import { ElementNamespace } from "../internal/ElementNamespaces";
import {
  ZB_NS,
  ZB_TAG_COMPONENT,
  ZB_TAG_CONTEXT,
  ZB_TAG_FRAGMENT,
} from "../internal/fragmentSymbols";
import { ImmutableProperties } from "../internal/ImmutableProperties";
import { StreamMaybe } from "../internal/StreamMaybe";

export type ZBChild =
  | ZBContextElement
  | ZBComponentElement
  | ZBFragment
  | ZBElement
  | string;
export type ZBChildList = ZBChild[];
export type ZBChildren = ZBChild | ZBChildList;

export interface ZBContextElement {
  namespace: typeof ZB_NS;
  tag: typeof ZB_TAG_CONTEXT;
  id: symbol;
  instance: any;
  children: ZBChildren;
}

export interface ZBComponentElement {
  namespace: typeof ZB_NS;
  tag: typeof ZB_TAG_COMPONENT;
  key?: ChildKey;
  component: ZBComponentRender<any, any>;
  props: any;
  defaultStateValues?: (() => any) | any;
}

export interface ZBFragment {
  namespace: typeof ZB_NS;
  tag: typeof ZB_TAG_FRAGMENT;
  children: ZBChildren;
  key?: ChildKey;
}

export interface ZBComponentRender<
  PROPS = any,
  STATE extends ZBStateArchetype = ZBStateArchetype,
> {
  (
    props: PROPS,
    states: { [id in keyof STATE]: Atom<STATE[id]> },
    context: ContextResolver,
  ): ZBChildren;
}

export type ZBStateArchetype = Record<string, any>;

export interface ZBElement<
  ElementType = any,
  EventMap extends AnyEventMap = AnyEventMap,
> extends ZBElementAllArguments<ElementType, EventMap> {
  namespace: ElementNamespace;
  tag: string;
  key?: ChildKey;
}

export type AnyEventMap =
  | HTMLElementEventMap
  | SVGElementEventMap
  | MathMLElementEventMap;

export interface ZBElementAllArguments<
  ElementType = any,
  EventMap extends AnyEventMap = AnyEventMap,
> extends ZBElementDirectArguments<ElementType, EventMap> {
  children?: StreamMaybe<ZBChildren>;
}

export type ZBElementPropNames<ElementType> = Extract<
  Exclude<keyof ElementType, ImmutableProperties>,
  string
>;

export interface ZBElementDirectArguments<
  ElementType = any,
  EventMap extends AnyEventMap = AnyEventMap,
> {
  className?: StreamMaybe<string>;
  props?: {
    [id in ZBElementPropNames<ElementType>]?: StreamMaybe<ElementType[id]>;
  };
  style?: {
    [id in keyof CSSProperties]?: StreamMaybe<CSSProperties[id]>;
  };
  animate?: AnimationMessage | AnimationMessage[];
  on?: {
    [id in StringOnlyKeys<EventMap>]?: ZBEventHandler<EventMap[id]>;
  } & {
    [id in StringOnlyKeys<EventMap> as `${id}:passive`]?: ZBEventHandler<
      EventMap[id]
    >;
  } & {
    [id in StringOnlyKeys<EventMap> as `${id}:passive:capture`]?: ZBEventHandler<
      EventMap[id]
    >;
  } & {
    [id in StringOnlyKeys<EventMap> as `${id}:passive:capture:once`]?: ZBEventHandler<
      EventMap[id]
    >;
  } & {
    [id in StringOnlyKeys<EventMap> as `${id}:capture`]?: ZBEventHandler<
      EventMap[id]
    >;
  } & {
    [id in StringOnlyKeys<EventMap> as `${id}:capture:once`]?: ZBEventHandler<
      EventMap[id]
    >;
  } & {
    [id in StringOnlyKeys<EventMap> as `${id}:once`]?: ZBEventHandler<
      EventMap[id]
    >;
  };
  ref?: Observer<ElementType>;
}

export type ZBEventHandler<E = Event> = ((event: E) => void) | Observer<E>;

type StringOnlyKeys<T> = Extract<keyof T, string>;
