import { ComponentController } from "./ComponentController";
import { ImmutableProperties } from "./ImmutableProperties";

export class PropsController<
  ELEMENT extends Element,
  PROP extends Exclude<keyof ELEMENT, ImmutableProperties>,
> extends ComponentController<ELEMENT, ELEMENT[PROP]> {
  private initial: ELEMENT[PROP];

  constructor(
    element: ELEMENT,
    private key: PROP,
  ) {
    super(element);
    this.initial = this.element[key];
  }

  deinitialize(): void {
    this.element[this.key] = this.initial;
  }

  applyValue(value: ELEMENT[PROP]): void {
    this.element[this.key] = value;
  }
}
