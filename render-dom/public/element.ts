import { Observer } from "@zapora/core";
import { AnimationMessage } from "../internal/AnimationComponentController";
import {
  ElementNamespace,
  ElementTagNames,
  NamespaceToElementRepository,
  NamespaceToEventMap,
} from "../internal/ElementNamespaces";
import { ImmutableProperties } from "../internal/ImmutableProperties";
import { StreamMaybe } from "../internal/StreamMaybe";
import { ZBChildren, ZBElement, ZBEventHandler } from "./types";
import type { Properties as CSSProperties } from "csstype";

const spaces = new Proxy(
  {},
  {
    get(_, namespaceShort: ElementNamespace) {
      return new Proxy(
        {},
        {
          get(_, tag: string) {
            return Object.assign(makeElementFactory(namespaceShort, tag), {
              key: function establishElementsKey(key: TemplateStringsArray) {
                return makeElementFactory(namespaceShort, tag, key);
              },
            });
          },
        },
      );
    },
  },
) as {
  [ns in ElementNamespace]: {
    [tn in ElementTagNames<ns>]: ElementFactory<
      NamespaceToElementRepository[ns][tn],
      NamespaceToEventMap[ns]
    > & {
      key: (
        key: TemplateStringsArray,
      ) => ElementFactory<
        NamespaceToElementRepository[ns][tn],
        NamespaceToEventMap[ns]
      >;
    };
  };
};

type ElementFactory<ElementType, EventMap extends Record<string, any>> = (
  element?: ElementDescription<
    ElementType,
    Omit<ElementType, ImmutableProperties>,
    EventMap
  >,
  children?: StreamMaybe<ZBChildren>,
) => ZBElement;

export interface ElementDescription<
  REF extends any,
  PROPERTIES extends any,
  EVENTS extends Record<string, any>,
> {
  className?: StreamMaybe<string>;
  props?: {
    [id in keyof PROPERTIES]?: StreamMaybe<PROPERTIES[id]>;
  };
  style?: {
    [id in keyof CSSProperties]?: StreamMaybe<CSSProperties[id]>;
  };
  animate?: AnimationMessage | AnimationMessage[];
  on?: {
    [id in StringOnlyKeys<EVENTS>]?: ZBEventHandler<EVENTS[id]>;
  } & {
    [id in StringOnlyKeys<EVENTS> as `${id}:passive`]?: ZBEventHandler<
      EVENTS[id]
    >;
  } & {
    [id in StringOnlyKeys<EVENTS> as `${id}:passive:capture`]?: ZBEventHandler<
      EVENTS[id]
    >;
  } & {
    [id in StringOnlyKeys<EVENTS> as `${id}:passive:capture:once`]?: ZBEventHandler<
      EVENTS[id]
    >;
  } & {
    [id in StringOnlyKeys<EVENTS> as `${id}:capture`]?: ZBEventHandler<
      EVENTS[id]
    >;
  } & {
    [id in StringOnlyKeys<EVENTS> as `${id}:capture:once`]?: ZBEventHandler<
      EVENTS[id]
    >;
  } & {
    [id in StringOnlyKeys<EVENTS> as `${id}:once`]?: ZBEventHandler<EVENTS[id]>;
  };
  ref?: Observer<REF>;
}

type StringOnlyKeys<T> = Extract<keyof T, string>;

function makeElementFactory(
  namespaceShort: ElementNamespace,
  tag: string,
  key?: TemplateStringsArray,
): ElementFactory<any, Record<string, any>> {
  return createElementWithKey;

  function createElementWithKey(
    properties?: ElementDescription<any, any, Record<string, any>>,
    children?: StreamMaybe<ZBChildren>,
  ): ZBElement {
    return key
      ? ({
          namespace: namespaceShort,
          tag: tag.toUpperCase(),
          key: key.join(""),
          className: properties?.className,
          props: properties?.props,
          style: properties?.style as Record<string, StreamMaybe<string>>,
          animate: properties?.animate,
          on: properties?.on as Record<string, ZBEventHandler>,
          ref: properties?.ref,
          children,
        } satisfies ZBElement)
      : ({
          namespace: namespaceShort,
          tag: tag.toUpperCase(),
          className: properties?.className,
          props: properties?.props,
          style: properties?.style as Record<string, StreamMaybe<string>>,
          animate: properties?.animate,
          on: properties?.on as Record<string, ZBEventHandler>,
          ref: properties?.ref,
          children,
        } satisfies ZBElement);
  }
}

const { html, svg, math } = spaces;

export { html, math, svg };
