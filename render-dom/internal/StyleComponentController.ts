import { StreamedComponentController } from "./ComponentController";

interface ElementWithStyle {
  style: any;
}

export class StyleComponentController extends StreamedComponentController<
  ElementWithStyle,
  string
> {
  private initial: string;

  constructor(
    element: ElementCSSInlineStyle,
    private key: string,
  ) {
    super(element);
    this.initial = this.element.style[key as any];
  }

  protected deinitialize(): void {
    this.element.style[this.key as any] = this.initial;
  }

  protected applyValue(value: string | undefined): void {
    this.element.style[this.key as any] = value ?? this.initial;
  }
}
