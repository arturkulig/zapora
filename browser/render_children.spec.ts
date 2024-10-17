import { beforeEach, describe, expect, it } from "@jest/globals";
import { html } from "./element";
import { render } from "./render";

describe("renders props", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("applied and removed", () => {
    const destroy = render(
      html.base({
        props: { id: "testId" },
        children: [html.div()],
      }),
      root,
    );

    const rendered = root.children[0];
    expect(rendered.id).toBe("testId");
    expect(rendered.children.length).toBe(1);

    destroy();
    expect(rendered.id).toBe("");
    expect(rendered.children.length).toBe(0);
  });
});
