import { State, Subscribable, Subscription } from "@zapora/core";
import { StreamMaybe } from "./StreamMaybe";

export abstract class ComponentController<ELEMENT, VALUE> {
  constructor(protected element: ELEMENT) {}

  protected abstract deinitialize(): void;
  protected abstract applyValue(value: VALUE): void;

  private currentValue: { applied: VALUE } | undefined = undefined;
  private currentSource: StreamMaybe<VALUE> | undefined = undefined;
  private currentSourceSubscription: Subscription | undefined = undefined;

  applySource(source: StreamMaybe<VALUE> | undefined): void {
    if (source === this.currentSource) {
      return;
    }

    this.currentSource = source;

    if (source == null) {
      this.unsubscribeFromSource();
      return;
    }

    if (isSubscribable<VALUE>(source)) {
      this.applyStream(source);
    } else {
      this.applyUnit(source);
    }
  }

  destroy(): void {
    this.unsubscribeFromSource();
    this.deinitialize();
  }

  private unsubscribeFromSource(): void {
    const { currentSourceSubscription } = this;
    this.currentSource = undefined;
    this.currentSourceSubscription = undefined;
    if (currentSourceSubscription && !currentSourceSubscription.closed) {
      currentSourceSubscription.cancel();
    }
  }

  private applyUnit(source: VALUE): void {
    this.considerValue(source);
  }

  private applyStream(source: Subscribable<VALUE>) {
    let destroyed = false;
    let completed = false;

    if (source instanceof State) {
      this.considerValue(source.value);
    }

    this.currentSourceSubscription = source.subscribe({
      get closed() {
        return destroyed || completed;
      },
      next: (value) => this.considerValue(value),
      complete: () => {
        if (!completed) {
          completed = true;
        }
      },
    });
  }

  private considerValue(value: VALUE) {
    if (!this.currentValue) {
      this.currentValue = { applied: value };
      this.applyValue(value);
    } else if (this.currentValue !== value) {
      this.currentValue.applied = value;
      this.applyValue(value);
    }
  }
}

function isSubscribable<T>(
  input: T | Subscribable<T>,
): input is Subscribable<T> {
  return typeof input === "object" && input != null && "subscribe" in input;
}
