import { ReceivedReceit, State, Subscribable } from "@zapora/core";

export function applicator<VALUE>(
  element: any,
  source: VALUE | Subscribable<VALUE>,
  initialize: (element: any) => void,
  destroy: (element: any) => void,
  applyState: (element: any, value: VALUE) => void,
  applyValue?: (element: any, value: VALUE) => ReceivedReceit,
) {
  if (isSubscribable<VALUE>(source)) {
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
