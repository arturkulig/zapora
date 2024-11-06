import {
  ElementNamespace,
  ElementTagNames,
  NamespaceToElementRepository,
} from "../internal/ElementNamespaces";
import { ZBElement, ZBElementArguments } from "./types";

const spaces = new Proxy(
  {},
  {
    get(_, namespaceShort: ElementNamespace) {
      return new Proxy(
        {},
        {
          get(_, tag: string) {
            return Object.assign(
              function createElement(
                properties?: ZBElementArguments<any>,
              ): ZBElement {
                return {
                  namespace: namespaceShort,
                  tag: tag.toUpperCase(),
                  ...properties,
                };
              },
              {
                key: function establishElementsKey(key: TemplateStringsArray) {
                  return function createElementWithKey(
                    properties?: ZBElementArguments<any>,
                  ): ZBElement {
                    return {
                      namespace: namespaceShort,
                      tag: tag.toUpperCase(),
                      key: key.join(""),
                      ...properties,
                    };
                  };
                },
              },
            );
          },
        },
      );
    },
  },
) as {
  [ns in ElementNamespace]: {
    [tn in ElementTagNames<ns>]: {
      (
        properties?: ZBElementArguments<NamespaceToElementRepository[ns][tn]>,
      ): ZBElement;
      key: (
        key: TemplateStringsArray,
      ) => (
        properties?: ZBElementArguments<NamespaceToElementRepository[ns][tn]>,
      ) => ZBElement;
    };
  };
};

const { html, svg, math } = spaces;

export { html, math, svg };
