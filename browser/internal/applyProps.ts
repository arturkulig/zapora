import { applicator } from "./applicator";
import { StreamMaybe } from "./StreamMaybe";

export function applyProps(
  element: any,
  name: string,
  source: StreamMaybe<any>,
) {
  let initial: any;
  return applicator(
    element,
    source,
    (element) => {
      initial = element[name];
    },
    (element) => {
      element[name] = initial;
    },
    (element, value) => {
      element[name] = value;
    },
  );
}
