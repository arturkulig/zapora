import { State, Subscribable } from "@zapora/core";
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
  getter: (element: NamespaceToElementRepository[NS][TN]) => VALUE,
  setter: (element: NamespaceToElementRepository[NS][TN], value: VALUE) => void,
  source: VALUE | Subscribable<VALUE>,
): Mod<NS, TN> {
  return isSubscribable<VALUE>(source)
    ? (element) => {
        const initial = getter(element);
        let destroyed = false;

        if (source instanceof State) {
          setter(element, source.value);
        }

        const sub = source.subscribe({
          get closed() {
            return destroyed;
          },
          next: (value) => {
            setter(element, value);
          },
        });

        return () => {
          if (destroyed) {
            return;
          }
          destroyed = true;
          if (!sub.closed) {
            sub.cancel();
          }
          setter(element, initial);
        };
      }
    : (element) => {
        const initial = getter(element);
        setter(element, source);
        return () => {
          setter(element, initial);
        };
      };
}

function isSubscribable<T>(
  input: T | Subscribable<T>,
): input is Subscribable<T> {
  return typeof input === "object" && input != null && "subscribe" in input;
}
