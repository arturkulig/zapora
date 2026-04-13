import { StreamedComponentController } from "./ComponentController";

interface ElementWithStyle {
  style: {
    setProperty(property: string, value: string): void;
    getPropertyValue(property: string): string;
  };
}

export class StyleComponentController extends StreamedComponentController<
  ElementWithStyle,
  string
> {
  private initial: string;

  constructor(
    element: ElementWithStyle,
    private key: string,
  ) {
    super(element);
    this.initial = this.element.style.getPropertyValue(this.key);
  }

  protected deinitialize(): void {
    this.element.style.setProperty(this.key, this.initial);
  }

  protected applyValue(value: string | undefined): void {
    this.element.style.setProperty(this.key, value ?? this.initial);
  }
}
