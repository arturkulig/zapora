import { Properties as CSSProperties } from "csstype";
import { StreamedComponentController } from "./ComponentController";
import { AnyElement } from "./ElementNamespaces";

export class StyleComponentController<
  ELEMENT extends AnyElement,
  PROP extends keyof CSSProperties,
> extends StreamedComponentController<ELEMENT, CSSProperties[PROP]> {
  private initial: string;

  constructor(
    element: ELEMENT,
    private key: PROP,
  ) {
    super(element);
    this.initial = this.element.style[key as any];
  }

  protected deinitialize(): void {
    this.element.style[this.key as any] = this.initial;
  }

  protected applyValue(value: CSSProperties[PROP] | undefined): void {
    this.element.style[this.key as any] = (value ?? this.initial).toString();
  }
}
