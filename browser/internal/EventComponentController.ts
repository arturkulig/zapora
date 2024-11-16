import { getQueueingObserver, ReceivedReceit } from "@zapora/core";
import { ZBEventHandler } from "../public";
import { ComponentController } from "./ComponentController";

export class EventComponentController<
  ELEMENT extends Element,
> extends ComponentController<ELEMENT, ZBEventHandler> {
  eventName: string;
  postedListener: (event: Event) => void;
  userListenerNext: ((event: Event) => ReceivedReceit) | undefined;
  userListenerComplete: ((event: Event) => ReceivedReceit) | undefined;

  constructor(element: ELEMENT, complexEventName: string) {
    super(element);

    this.postedListener = (event) => {
      this.userListenerNext?.(event);
    };

    const [eventName, arg0, arg1, arg2] = complexEventName.split(":");
    this.eventName = eventName;

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

    this.element.addEventListener(eventName, this.postedListener, {
      capture,
      passive,
      once,
    });
  }

  deinitialize(): void {
    this.element.removeEventListener(this.eventName, this.postedListener);
  }

  applyValue(value: ZBEventHandler): void {
    if (typeof value === "function") {
      this.userListenerNext = value;
      this.userListenerComplete = undefined;
    } else {
      const cautiousHandler = getQueueingObserver(value);
      this.userListenerNext = cautiousHandler.next?.bind(cautiousHandler);
      this.userListenerComplete =
        cautiousHandler.complete?.bind(cautiousHandler);
    }
  }
}
