import { ComponentController } from "./ComponentController";

export class ClassNameComponentController<
  ELEMENT extends Element,
> extends ComponentController<ELEMENT, string> {
  deinitialize(): void {
    this.element.className = "";
  }
  applyValue(value: string): void {
    this.element.className = value;
  }
}
