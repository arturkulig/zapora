import { beforeEach, describe, expect, it } from "@jest/globals";
import { render } from "./render";

describe("renders mods", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("applied and removed", () => {
    const destroy = render(
      {
        namespace: "html",
        tag: "base",
        mods: [
          (element) => {
            element.classList.add("test");
            return () => {
              element.classList.remove("test");
            };
          },
        ],
      },
      root,
    );

    const rendered = root.children[0];
    expect(rendered.className).toBe("test");

    destroy();
    expect(rendered.className).toBe("");
  });
});
