import { StreamedComponentController } from "./ComponentController";
import { ImmutableProperties } from "./ImmutableProperties";

export class PropsComponentController<
  ELEMENT extends Element,
  PROP extends Exclude<keyof ELEMENT, ImmutableProperties>,
> extends StreamedComponentController<ELEMENT, ELEMENT[PROP]> {
  private initial: ELEMENT[PROP];

  constructor(
    element: ELEMENT,
    private key: PROP,
  ) {
    super(element);
    this.initial = this.element[key];
  }

  protected deinitialize(): void {
    this.element[this.key] = this.initial;
  }

  protected applyValue(value: ELEMENT[PROP] | undefined): void {
    this.element[this.key] = value ?? this.initial;
  }
}
