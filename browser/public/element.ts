import {
  ElementNamespace,
  ElementTagNames,
  NamespaceToElementRepository,
  NamespaceToEventMap,
} from "../internal/ElementNamespaces";
import { StreamMaybe } from "../internal/StreamMaybe";
import {
  AnyEventMap,
  ZBChildren,
  ZBElement,
  ZBElementAllArguments,
  ZBElementDirectArguments,
} from "./types";

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

type ElementFactory<ElementType, EventMap extends AnyEventMap> = (
  ...args:
    | []
    | [properties: ZBElementAllArguments<ElementType, EventMap>]
    | [
        properties: ZBElementDirectArguments<ElementType, EventMap>,
        children: StreamMaybe<ZBChildren>,
      ]
) => ZBElement;

function makeElementFactory(
  namespaceShort: ElementNamespace,
  tag: string,
  key?: TemplateStringsArray,
): ElementFactory<any, AnyEventMap> {
  return createElementWithKey;

  function createElementWithKey(
    properties?: ZBElementAllArguments<any>,
  ): ZBElement;
  function createElementWithKey(
    properties?: ZBElementDirectArguments<any>,
    children?: StreamMaybe<ZBChildren>,
  ): ZBElement;
  function createElementWithKey(
    properties?: ZBElementAllArguments<any>,
    children?: StreamMaybe<ZBChildren>,
  ): ZBElement {
    return key
      ? {
          namespace: namespaceShort,
          tag: tag.toUpperCase(),
          key: key.join(""),
          ...properties,
          children: children ?? properties?.children,
        }
      : {
          namespace: namespaceShort,
          tag: tag.toUpperCase(),
          ...properties,
          children: children ?? properties?.children,
        };
  }
}

const { html, svg, math } = spaces;

export { html, math, svg };
