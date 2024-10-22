import { beforeEach, describe, expect, it } from "@jest/globals";
import { html } from "../element";
import { render } from "../render";

describe("renders text nodes", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("as children", () => {
    const destroy = render(
      html.div({
        children: [
          html.p({ children: ["123"] }),
          "456",
          html.a({ children: ["789"] }),
        ],
      }),
      root,
    );

    expect(root.childNodes[0].childNodes.length).toBe(3);
    expect(root.textContent).toBe("123456789");

    destroy();
  });
});
