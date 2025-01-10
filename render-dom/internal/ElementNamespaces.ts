export type ElementNamespace = Extract<
  keyof NamespaceToElementRepository,
  string
>;
export type ElementTagNames<NS extends ElementNamespace> = Extract<
  keyof NamespaceToElementRepository[NS],
  string
>;

export interface NamespaceToElementRepository {
  html: HTMLElementTagNameMap;
  svg: SVGElementTagNameMap;
  math: MathMLElementTagNameMap;
}

export interface NamespaceToEventMap {
  html: HTMLElementEventMap;
  svg: SVGElementEventMap;
  math: MathMLElementEventMap;
}

export const HTML_NS = "http://www.w3.org/1999/xhtml";
export const SVG_NS = "http://www.w3.org/2000/svg";
export const MATH_NS = "http://www.w3.org/1998/Math/MathML";

export const namespacesFull = {
  html: HTML_NS,
  svg: SVG_NS,
  math: MATH_NS,
};

export type AnyElement = HTMLElement | SVGElement | MathMLElement;
