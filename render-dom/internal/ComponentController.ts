import { Observable, State, Subscription } from "@zapora/core";
import { Stream, StreamMaybe } from "./StreamMaybe";

export abstract class ComponentController<ELEMENT, VALUE> {
  constructor(protected element: ELEMENT) {}

  protected abstract deinitialize(): void;
  protected abstract applyValue(value: VALUE | undefined): void;

  private currentValue: { applied: VALUE } | undefined = undefined;

  applyUnit(source: VALUE | undefined): void {
    if (source == null) {
      this.currentValue = undefined;
      this.applyValue(undefined);
    } else if (!this.currentValue) {
      this.currentValue = { applied: source };
      this.applyValue(source);
    } else if (this.currentValue.applied !== source) {
      this.currentValue.applied = source;
      this.applyValue(source);
    }
  }

  destroy(): void {
    this.deinitialize();
  }
}

export abstract class StreamedComponentController<
  ELEMENT,
  VALUE,
> extends ComponentController<ELEMENT, VALUE> {
  private currentSource: StreamMaybe<VALUE> | undefined = undefined;
  private currentSourceSubscription: Subscription | undefined = undefined;

  applySource(source: StreamMaybe<VALUE> | undefined): void {
    // console.log("SOURCE", source);
    if (source === this.currentSource) {
      return;
    }

    this.unsubscribeFromSource();

    this.currentSource = source;

    if (source != null && isStream<VALUE>(source)) {
      this.applyStream(source);
    } else {
      this.applyUnit(source);
    }
  }

  destroy(): void {
    this.unsubscribeFromSource();
    super.destroy();
  }

  private unsubscribeFromSource(): void {
    const { currentSourceSubscription } = this;
    this.currentSource = undefined;
    this.currentSourceSubscription = undefined;
    if (currentSourceSubscription && !currentSourceSubscription.closed) {
      currentSourceSubscription.cancel();
    }
  }

  private applyStream(source: Stream<VALUE>) {
    let completed = false;

    if (isState(source)) {
      this.applyUnit(source.value);
    }

    this.currentSourceSubscription = source.subscribe({
      get closed() {
        return completed;
      },
      next: (value) => this.applyUnit(value),
      complete: () => {
        completed = true;
      },
    });
  }
}

function isStream<T>(input: StreamMaybe<T>): input is Stream<T> {
  return input instanceof Observable;
}

function isState<T>(input: StreamMaybe<T>): input is State<T> {
  return input instanceof State;
}
