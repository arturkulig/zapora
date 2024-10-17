import { applicator } from "./applicator";
import { Children } from "./Children";
import { Material } from "./Material";
import { StreamMaybe } from "./StreamMaybe";

export function applyChildren(element: any, source: StreamMaybe<Children>) {
  let materials: Material<any, any>[] = [];

  return applicator(
    element,
    source,
    // init
    (element: Element) => {
      while (element.children.length > 0) {
        element.removeChild(element.children[0]);
      }
    },
    // destroy
    (element: Element) => {
      for (const material of materials.splice(0)) {
        material.destroy(element);
      }
      while (element.children.length > 0) {
        element.removeChild(element.children[0]);
      }
    },
    // apply state
    (element: Element, childrenDescriptions) => {
      for (const childDescription of childrenDescriptions) {
        const material = new Material(childDescription);
        materials.push(material);
        element.appendChild(material.element);
      }
    },
  );
}
