import type { EventHandler } from "../EventHandler";
import type { Uninstaller } from "./Uninstaller";

export function applyEventHandler(
  element: Element,
  name: string,
  handler: EventHandler<Event>,
): Uninstaller {
  const [eventName, arg0, arg1, arg2] = name.split(":");

  const passive = !!(
    arg0 === "passive" ||
    arg1 === "passive" ||
    arg2 === "passive"
  );
  const capture = !!(
    arg0 === "capture" ||
    arg1 === "capture" ||
    arg2 === "capture"
  );
  const once = !!(arg0 === "once" || arg1 === "once" || arg2 === "once");

  element.addEventListener(eventName, handler, {
    capture,
    passive,
    once,
  });

  return () => {
    element.removeEventListener(eventName, handler, {
      capture,
    });
  };
}
