import { StreamedComponentController } from "./ComponentController";

export class ClassNameComponentController<
  ELEMENT extends Element,
> extends StreamedComponentController<ELEMENT, string> {
  protected deinitialize(): void {
    this.element.className = "";
  }

  protected applyValue(value: string | undefined): void {
    this.element.className = value ?? "";
  }
}
