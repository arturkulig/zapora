import { ElementDescription, ElementProperties } from "./ElementDescription";
import {
  ElementNamespace,
  ElementTagNames,
} from "./internal/ElementNamespaces";

const spaces = new Proxy(
  {},
  {
    get(_, namespace: ElementNamespace) {
      return new Proxy(
        {},
        {
          get(_, tag: ElementTagNames<ElementNamespace>) {
            return function (
              properties?: ElementProperties<
                ElementNamespace,
                ElementTagNames<ElementNamespace>
              >,
            ) {
              return {
                namespace,
                tag,
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
      properties?: ElementProperties<ns, tn>,
    ) => ElementDescription<ns, tn>;
  };
};

const { html, svg, math } = spaces;

export { html, math, svg };
