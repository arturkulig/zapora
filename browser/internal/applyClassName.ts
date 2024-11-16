import { applicator } from "./applicator";
import { StreamMaybe } from "./StreamMaybe";

export function applyClassName(element: any, source: StreamMaybe<string>) {
  return applicator<string>(
    element,
    source,
    noop,
    (element) => {
      element.className = "";
    },
    (element, value) => {
      element.className = value;
    },
  );
}

function noop() {}
