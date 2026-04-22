import { StreamedComponentController } from "./ComponentController";

export class AttrsComponentController extends StreamedComponentController<
  Element,
  string | null
> {
  private initial: string | null;

  constructor(
    element: Element,
    private attribute: string,
  ) {
    super(element);
    this.initial = this.element.getAttribute(attribute);
  }

  protected deinitialize(): void {
    if (this.initial != null && this.initial !== "") {
      this.element.setAttribute(this.attribute, this.initial);
    } else {
      this.element.removeAttribute(this.attribute);
    }
  }

  protected applyValue(value: string | null | undefined): void {
    const next = value === undefined ? this.initial : value;
    if (next != null && next !== "") {
      this.element.setAttribute(this.attribute, next);
    } else {
      this.element.removeAttribute(this.attribute);
    }
  }
}
