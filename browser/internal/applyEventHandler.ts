import { getQueueingObserver } from "@zapora/core";
import { ZBEventHandler } from "../public";
import { Uninstaller } from "./applicator";

export function applyEventHandler(
  element: Element,
  name: string,
  userHandler: ZBEventHandler<Event>,
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

  const cautiousHandler =
    typeof userHandler === "function"
      ? userHandler
      : getQueueingObserver(userHandler);
  const next =
    typeof cautiousHandler === "function"
      ? cautiousHandler
      : cautiousHandler.next;
  const complete =
    typeof cautiousHandler === "function"
      ? undefined
      : cautiousHandler.complete;
  const context =
    typeof cautiousHandler === "function" ? undefined : cautiousHandler;

  const nextBound = next?.bind(context);
  const completeBound = complete?.bind(context);

  nextBound &&
    element.addEventListener(eventName, nextBound, {
      capture,
      passive,
      once,
    });

  return () => {
    nextBound &&
      element.removeEventListener(eventName, nextBound, {
        capture,
      });
    completeBound?.();
  };
}
