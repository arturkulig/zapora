import { ReceivedReceit, State, Subscribable } from "@zapora/core";

export type Uninstaller = () => void;

export function applicator<VALUE>(
  element: any,
  source: VALUE | Subscribable<VALUE>,
  initialize: (element: any) => void,
  destroy: (element: any) => void,
  applyState: (element: any, value: VALUE) => void,
  applyValue?: (element: any, value: VALUE) => ReceivedReceit,
): Uninstaller {
  if (isSubscribable<VALUE>(source)) {
    initialize(element);
    let destroyed = false;
    let completed = false;

    if (source instanceof State) {
      applyState?.(element, source.value);
    }

    const sub = source.subscribe({
      get closed() {
        return destroyed || completed;
      },
      next: (value) => (applyValue ?? applyState)?.(element, value),
      complete: () => {
        if (!completed) {
          completed = true;
          if (!destroyed) {
            destroyed = true;
            destroy?.(element);
          }
        }
      },
    });

    return () => {
      if (destroyed) {
        return;
      }
      if (!destroyed) {
        destroyed = true;
        destroy?.(element);
      }
      if (!sub.closed) {
        sub.cancel();
      }
    };
  }

  initialize(element);
  applyState(element, source);
  return () => {
    destroy(element);
  };
}

function isSubscribable<T>(
  input: T | Subscribable<T>,
): input is Subscribable<T> {
  return typeof input === "object" && input != null && "subscribe" in input;
}
