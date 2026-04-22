import { StreamedComponentController } from "./ComponentController";
import { namespacesFull } from "./ElementNamespaces";

export interface ElementWithClass {
  className: string;
}

export class ClassNameComponentController extends StreamedComponentController<
  Element,
  string | string[]
> {
  protected deinitialize(): void {
    this.element.classList.remove(...this.element.classList.values());
  }

  protected applyValue(value: string | string[] | undefined): void {
    if (this.element.namespaceURI === namespacesFull.html) {
      this.element.className =
        value == null ? "" : Array.isArray(value) ? value.join(" ") : value;
      return;
    }

    const classes = (
      value == null ? "" : Array.isArray(value) ? value.join(" ") : value
    ).split(" ");
    for (const c of classes) {
      this.element.classList.add(c);
    }
    for (const c of this.element.classList.values()) {
      if (!classes.includes(c)) {
        this.element.classList.remove(c);
      }
    }
  }
}
