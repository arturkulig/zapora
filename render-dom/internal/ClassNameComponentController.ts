import { StreamedComponentController } from "./ComponentController";

export interface ElementWithClass {
  className: string;
}

export class ClassNameComponentController extends StreamedComponentController<
  Element,
  string | string[]
> {
  protected deinitialize(): void {
    this.element.className = "";
  }

  protected applyValue(value: string | string[] | undefined): void {
    this.element.className =
      value == null ? "" : Array.isArray(value) ? value.join(" ") : value;
  }
}
