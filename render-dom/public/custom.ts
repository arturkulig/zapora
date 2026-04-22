import { ImmutableProperties } from "../internal/ImmutableProperties";
import { StreamMaybe } from "../internal/StreamMaybe";
import { ElementDescription } from "./element";
import { RefType, ZBChildren, ZBElement, ZBEventHandler } from "./types";

export function custom<CUSTOM>(tag: string) {
  return function customElement(
    properties?: ElementDescription<
      CUSTOM,
      Exclude<CUSTOM, ImmutableProperties>,
      HTMLElementEventMap
    >,
    children?: StreamMaybe<ZBChildren>,
  ): ZBElement {
    return {
      namespace: "html",
      tag,
      className: properties?.className,
      attrs: properties?.attrs,
      props: properties?.props,
      style: properties?.style as Record<string, StreamMaybe<string>>,
      animate: properties?.animate,
      on: properties?.on as Record<string, ZBEventHandler>,
      ref: properties?.ref as RefType | undefined,
      children,
    };
  };
}
