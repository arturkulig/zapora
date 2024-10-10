import { Subscribable } from "@zapora/core";
import { applicator } from "./internal/applicator";
import {
  ElementNamespace,
  ElementTagNames,
} from "./internal/ElementNamespaces";
import { Mod } from "./internal/Mod";

export interface AnimationMessage {
  style: CSSStyleDeclaration;
  easing?: string;
  timing: number;
}

export function animate<
  NS extends ElementNamespace,
  TN extends ElementTagNames<NS>,
>(source: AnimationMessage | Subscribable<AnimationMessage>): Mod<NS, TN> {
  let lastFrame: Keyframe = {};

  return applicator<NS, TN, AnimationMessage>(
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
