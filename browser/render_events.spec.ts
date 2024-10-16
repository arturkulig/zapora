import { beforeEach, describe, expect, it } from "@jest/globals";
import { render } from "./render";

describe("renders props", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("applied and removed", () => {
    let clicks: { x: number; y: number }[] = [];
    const destroy = render(
      {
        namespace: "html",
        tag: "base",
        props: { id: "testId" },
        on: {
          "click:passive": (event) => {
            clicks.push({ x: event.screenX, y: event.screenY });
          },
        },
      },
      root,
    );

    const rendered = root.children[0];
    expect(rendered.id).toBe("testId");

    rendered.dispatchEvent(
      new MouseEvent("click", {
        screenX: 69,
        screenY: 420,
      }),
    );

    expect(clicks).toEqual([{ x: 69, y: 420 }]);

    destroy();
    expect(rendered.id).toBe("");
  });
});
