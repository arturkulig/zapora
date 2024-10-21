import { beforeEach, describe, expect, it } from "@jest/globals";
import { html, math, svg } from "../element";
import { render } from "../render";

describe("renders tag", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("of HTML", () => {
    const destroy = render(html.base(), root);

    expect(root.children.length).toBe(1);
    expect(root.children[0].tagName.toLowerCase()).toBe("base");

    expect(typeof destroy).toBe("function");
    destroy();
  });

  it("of SVG", () => {
    const destroy = render(svg.g(), root);

    expect(root.children.length).toBe(1);
    expect(root.children[0].tagName.toLowerCase()).toBe("g");

    destroy();
  });

  it("of MathML", () => {
    const destroy = render(math.msqrt(), root);

    expect(root.children.length).toBe(1);
    expect(root.children[0].tagName.toLowerCase()).toBe("msqrt");

    destroy();
  });
});
