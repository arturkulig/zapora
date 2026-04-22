import type { Properties as CSSProperties } from "csstype";
import { AnimationMessage } from "../internal/AnimationComponentController";
import {
  ElementNamespace,
  ElementTagNames,
  NamespaceToElementRepository,
  NamespaceToEventMap,
} from "../internal/ElementNamespaces";
import { ImmutableProperties } from "../internal/ImmutableProperties";
import { StreamMaybe } from "../internal/StreamMaybe";
import { RefType, ZBChildren, ZBElement, ZBEventHandler } from "./types";

const spaces = new Proxy(
  {},
  {
    get(_target1, namespaceShort: ElementNamespace) {
      return new Proxy(
        {},
        {
          get(_target2, tag: string) {
            return Object.assign(makeElementFactory(namespaceShort, tag), {
              key: function establishElementsKey(
                templateTag: TemplateStringsArray,
                ...templateTagValues: string[]
              ) {
                return makeElementFactory(
                  namespaceShort,
                  tag,
                  templateTag,
                  templateTagValues,
                );
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
        ...values: string[]
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
  REF,
  PROPERTIES,
  EVENTS extends Record<string, any>,
> {
  className?: StreamMaybe<string | string[]>;
  attrs?: Partial<Record<string, StreamMaybe<string | null>>>;
  props?: {
    [id in keyof PROPERTIES]?: StreamMaybe<PROPERTIES[id]>;
  };
  style?: {
    [id in keyof CSSProperties]?: StreamMaybe<CSSProperties[id]>;
  } & {
    [id in `--${string}`]?: StreamMaybe<string>;
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
  ref?: RefType<REF>;
}

type StringOnlyKeys<T> = Extract<keyof T, string>;

function makeElementFactory(
  namespaceShort: ElementNamespace,
  tag: string,
  templateTag?: TemplateStringsArray,
  templateTagValues?: string[],
): ElementFactory<any, Record<string, any>> {
  return createElementWithKey;

  function createElementWithKey(
    properties?: ElementDescription<any, any, Record<string, any>>,
    children?: StreamMaybe<ZBChildren>,
  ): ZBElement {
    return templateTag
      ? ({
          namespace: namespaceShort,
          tag: tag,
          key: templateTag
            .map((word, index) => `${word}${templateTagValues?.[index] ?? ""}`)
            .join(""),
          className: properties?.className,
          attrs: properties?.attrs,
          props: properties?.props,
          style: properties?.style as Record<string, StreamMaybe<string>>,
          animate: properties?.animate,
          on: properties?.on as Record<string, ZBEventHandler>,
          ref: properties?.ref,
          children,
        } satisfies ZBElement)
      : ({
          namespace: namespaceShort,
          tag: tag,
          className: properties?.className,
          attrs: properties?.attrs,
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
