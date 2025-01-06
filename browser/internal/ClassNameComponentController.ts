import { StreamedComponentController } from "./ComponentController";

export interface ElementWithClass {
  className: string
}

export class ClassNameComponentController extends StreamedComponentController<Element, string> {
  protected deinitialize(): void {
    this.element.className = "";
  }

  protected applyValue(value: string | undefined): void {
    this.element.className = value ?? "";
  }
}
