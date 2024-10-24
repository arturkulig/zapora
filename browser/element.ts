import { ZBElement, ZBElementArguments } from "./ZBElement";
import {
  ElementNamespace,
  ElementTagNames,
  NamespaceToElementRepository,
} from "./internal/ElementNamespaces";

const spaces = new Proxy(
  {},
  {
    get(_, namespaceShort: ElementNamespace) {
      return new Proxy(
        {},
        {
          get(_, tag: string) {
            return function (properties?: ZBElementArguments<any>) {
              return {
                namespace: namespaceShort,
                tag: tag.toUpperCase(),
                ...properties,
              };
            };
          },
        },
      );
    },
  },
) as {
  [ns in ElementNamespace]: {
    [tn in ElementTagNames<ns>]: (
      properties?: ZBElementArguments<NamespaceToElementRepository[ns][tn]>,
    ) => ZBElement;
  };
};

const { html, svg, math } = spaces;

export { html, math, svg };
