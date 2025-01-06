import { StreamedComponentController } from "./ComponentController";

export class PropsComponentController<
  PROP extends string = string,
  VALUE = unknown,
> extends StreamedComponentController<Record<PROP, VALUE>, VALUE> {
  private initial: VALUE;

  constructor(
    element: Record<PROP, VALUE>,
    private key: PROP,
  ) {
    super(element);
    this.initial = this.element[key];
  }

  protected deinitialize(): void {
    this.element[this.key] = this.initial;
  }

  protected applyValue(value: VALUE | undefined): void {
    this.element[this.key] = value === undefined ? this.initial : value;
  }
}
