import { ZBElement, ZBElementArguments } from "./ZBElement";
import {
  ElementNamespace,
  ElementTagNames,
} from "./internal/ElementNamespaces";

const spaces = new Proxy(
  {},
  {
    get(_, namespaceShort: ElementNamespace) {
      return new Proxy(
        {},
        {
          get(_, tag: string) {
            return function (properties?: ZBElementArguments<any, any>) {
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
      properties?: ZBElementArguments<ns, tn>,
    ) => ZBElement<ns, tn>;
  };
};

const { html, svg, math } = spaces;

export { html, math, svg };
