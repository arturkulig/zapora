import { ReceivedReceit, State, Subscribable } from "@zapora/core";
import {
  ElementNamespace,
  ElementTagNames,
  NamespaceToElementRepository,
} from "./ElementNamespaces";
import { Mod } from "./Mod";

export function applicator<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
  VALUE,
>(
  source: VALUE | Subscribable<VALUE>,
  initialize: (element: NamespaceToElementRepository[NS][TN]) => void,
  destroy: (element: NamespaceToElementRepository[NS][TN]) => void,
  applyState: (
    element: NamespaceToElementRepository[NS][TN],
    value: VALUE,
  ) => void,
  applyValue?: (
    element: NamespaceToElementRepository[NS][TN],
    value: VALUE,
  ) => ReceivedReceit,
): Mod<NS, TN> {
  return isSubscribable<VALUE>(source)
    ? (element) => {
        initialize(element);
        let destroyed = false;

        if (source instanceof State) {
          applyState?.(element, source.value);
        }

        const sub = source.subscribe({
          get closed() {
            return destroyed;
          },
          next: (value) => (applyValue ?? applyState)?.(element, value),
        });

        return () => {
          if (destroyed) {
            return;
          }
          destroyed = true;
          if (!sub.closed) {
            sub.cancel();
          }
          destroy?.(element);
        };
      }
    : (element) => {
        initialize(element);
        applyState(element, source);
        return () => {
          destroy(element);
        };
      };
}

function isSubscribable<T>(
  input: T | Subscribable<T>,
): input is Subscribable<T> {
  return typeof input === "object" && input != null && "subscribe" in input;
}
