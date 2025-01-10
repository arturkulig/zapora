import { getQueueingObserver, Observer } from "@zapora/core";
import { ZBEventHandler } from "../public";
import { ComponentController } from "./ComponentController";

export class EventComponentController extends ComponentController<EventTarget, ZBEventHandler> {
  eventName: string;
  postedListener: (event: Event) => void;
  userListenerNext: Observer<Event> | undefined;

  constructor(element: EventTarget, complexEventName: string) {
    super(element);

    const [eventName, arg0, arg1, arg2] = complexEventName.split(":");
    this.eventName = eventName;

    this.postedListener = (event) => {
      if (
        this.userListenerNext &&
        this.userListenerNext.next &&
        !this.userListenerNext.closed
      ) {
        this.userListenerNext.next(event);
      }
    };

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

  protected deinitialize(): void {
    this.element.removeEventListener(this.eventName, this.postedListener);
    if (
      this.userListenerNext &&
      this.userListenerNext.complete &&
      !this.userListenerNext.closed
    ) {
      this.userListenerNext.complete();
    }
  }

  protected applyValue(value: ZBEventHandler | undefined): void {
    this.userListenerNext =
      typeof value === "function"
        ? { next: value }
        : typeof value === "object"
          ? getQueueingObserver(value)
          : undefined;
  }
}
