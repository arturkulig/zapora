import { ReceivedReceit, then } from "@zapora/core";
import { applicator } from "./applicator";
import { StreamMaybe } from "./StreamMaybe";

export interface AnimationMessage {
  style: CSSStyleDeclaration;
  easing?: string;
  timing: number;
}

export function applyAnimation(
  element: any,
  source: StreamMaybe<AnimationMessage>,
) {
  let lastFrame: Keyframe | null = null;
  let lastFinished: ReceivedReceit = Promise.resolve();

  return applicator<AnimationMessage>(
    element,
    source,
    (element) => {
      if (
        typeof element === "object" &&
        element != null &&
        "getAnimations" in element &&
        typeof element.getAnimations === "function"
      ) {
        for (const animation of (element as any as Element).getAnimations()) {
          animation.cancel();
        }
      } else {
        throw new Error("Element is not animatable");
      }
    },
    (element) => {
      for (const animation of (element as Element).getAnimations()) {
        animation.finish();
      }
    },
    (element, value) => {
      const nextFrame: Keyframe = {
        ...(value.style as any as Keyframe),
        easing: value.easing ?? "linear",
        offset: 1,
      };

      let doesNextFrameDiffer = false;
      if (lastFrame == null) {
        doesNextFrameDiffer = true;
      } else {
        for (const propName of new Set([
          ...Object.keys(lastFrame),
          ...Object.keys(nextFrame),
        ])) {
          if (lastFrame[propName] !== nextFrame[propName]) {
            doesNextFrameDiffer = true;
            break;
          }
        }
      }

      if (doesNextFrameDiffer) {
        lastFrame = nextFrame;
        lastFinished = then(
          getAllActiveAnimations(element).length > 0 ? lastFinished : undefined,
          () =>
            (element as Element).animate([nextFrame], {
              fill: "forwards",
              duration: 0,
            }).finished,
        );
      }
    },
    (element, value) => {
      const nextFrame: Keyframe = {
        ...(value.style as any as Keyframe),
        easing: value.easing ?? "linear",
        offset: 1,
      };

      lastFinished = then(
        getAllActiveAnimations(element).length > 0 ? lastFinished : undefined,
        () =>
          (element as Element).animate([lastFrame ?? {}, nextFrame], {
            fill: "forwards",
            duration: value.timing,
          }).finished,
      );
    },
  );
}

function getAllActiveAnimations(element: Element) {
  return element.getAnimations().filter(isAnimationActive);
}

function isAnimationActive(animation: Animation) {
  return !animation.finished;
}
