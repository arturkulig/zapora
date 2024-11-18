import { ReceivedReceit, Subscribable, Subscription, then } from "@zapora/core";
import { Properties as CSSProperties } from "csstype";
import { ComponentController } from "./ComponentController";

export interface AnimationMessage {
  style: CSSProperties;
  easing?: string;
  timing: number;
}

export type AnimationComponentControllerSource =
  | Subscribable<AnimationMessage>
  | Subscribable<AnimationMessage>[];

interface SourceState {
  source: Subscribable<AnimationMessage>;
  sub: Subscription;
}

interface AnimationState {
  frame: AnimationMessage | undefined;
  finished: ReceivedReceit;
}

export class AnimationComponentController<
  ELEMENT extends Element,
> extends ComponentController<ELEMENT, AnimationComponentControllerSource> {
  subscriptions = new Array<SourceState>();
  animations = new Array<AnimationState>();

  protected deinitialize(): void {
    for (const { sub } of this.subscriptions) {
      if (!sub.closed) {
        sub.cancel();
      }
    }
    for (const animation of this.element.getAnimations()) {
      if (!animation.finished) {
        animation.cancel();
      }
    }
  }

  protected applyValue(
    value: AnimationComponentControllerSource | undefined,
  ): void {
    const newSources: Subscribable<AnimationMessage>[] =
      value == null ? [] : Array.isArray(value) ? value : [value];

    this.subscriptions = Array.from(
      new Array(Math.max(this.subscriptions.length, newSources.length)),
      (_, i): SourceState => {
        const existing = this.subscriptions.at(i);

        if (existing) {
          if (existing.source === newSources.at(i)) {
            return existing;
          }
          if (!existing.sub.closed) {
            existing.sub.cancel();
          }
        }
        return {
          source: newSources[i],
          sub: newSources[i].subscribe({
            next: (frame) => this.playFrame(frame, i),
          }),
        };
      },
    );
  }

  private playFrame(frame: AnimationMessage, frameStreamIndex: number) {
    const nextFrame: Keyframe = {
      ...(frame.style as any as Keyframe),
      easing: frame.easing ?? "linear",
      offset: 1,
    };

    const animationState =
      this.animations[frameStreamIndex] ||
      (this.animations[frameStreamIndex] = {
        finished: undefined,
        frame: undefined,
      });

    animationState.finished = then(
      animationState.finished,
      () =>
        this.element.animate(
          [
            {
              ...animationState.frame?.style,
              offset: 0,
            },
            nextFrame,
          ],
          {
            fill: "forwards",
            duration: frame.timing,
          },
        ).finished,
    );
    animationState.frame = frame;
  }
}
