import { applicator } from "./applicator";
import { StreamMaybe } from "./StreamMaybe";

export interface AnimationMessage {
  style: CSSStyleDeclaration;
  easing?: string;
  timing: number;
}

export function animate(element: any, source: StreamMaybe<AnimationMessage>) {
  let lastFrame: Keyframe = {};

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
      (element as Element).animate([nextFrame], {
        fill: "forwards",
        duration: 0,
      });
      lastFrame = nextFrame;
    },
    (element, value) => {
      const nextFrame: Keyframe = {
        ...(value.style as any as Keyframe),
        easing: value.easing ?? "linear",
        offset: 1,
      };
      const animation = (element as Element).animate([lastFrame, nextFrame], {
        fill: "forwards",
        duration: value.timing,
      });
      return animation.finished.then(noop);
    },
  );
}

function noop() {}
