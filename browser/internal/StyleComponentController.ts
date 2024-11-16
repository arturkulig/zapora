import { Properties as CSSProperties } from "csstype";
import { ComponentController } from "./ComponentController";
import { AnyElement } from "./ElementNamespaces";

export class StyleComponentController<
  ELEMENT extends AnyElement,
  PROP extends keyof CSSProperties,
> extends ComponentController<ELEMENT, CSSProperties[PROP]> {
  private initial: string;

  constructor(
    element: ELEMENT,
    private key: PROP,
  ) {
    super(element);
    this.initial = this.element.style[key as any];
  }

  deinitialize(): void {
    this.element.style[this.key as any] = this.initial;
  }

  applyValue(value: CSSProperties[PROP]): void {
    this.element.style[this.key as any] = String(value);
  }
}
