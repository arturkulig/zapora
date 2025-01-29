import type { Atom, Observer } from "@zapora/core";
import type { AnimationMessage } from "../internal/AnimationComponentController";
import type { ChildKey } from "../internal/ChildKey";
import type { ContextResolver } from "../internal/ContextResolver";
import type { ElementNamespace } from "../internal/ElementNamespaces";
import type {
  ZB_NS,
  ZB_TAG_COMPONENT,
  ZB_TAG_CONTEXT,
  ZB_TAG_FRAGMENT,
} from "../internal/fragmentSymbols";
import type { StreamMaybe } from "../internal/StreamMaybe";

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
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
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

export interface ZBElement extends ZBElementDesc {
  namespace: ElementNamespace;
  tag: string;
  key?: ChildKey;
}

export interface ZBElementDesc {
  children?: StreamMaybe<ZBChildren>;
  className?: StreamMaybe<string | string[]>;
  props?: Record<string, StreamMaybe<any>>;
  style?: Record<string, StreamMaybe<string>>;
  animate?: AnimationMessage | AnimationMessage[];
  on?: Record<string, ZBEventHandler>;
  ref?: RefType;
}

export type RefType<E = Element> = (element: E | null) => void;

export type ZBEventHandler<E = Event> = ((event: E) => void) | Observer<E>;
