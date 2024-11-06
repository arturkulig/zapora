import { beforeEach, describe, expect, it } from "@jest/globals";
import { Subject } from "@zapora/core";
import { html, render } from "../index";

describe("renders props", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("applied and removed", () => {
    const clicks: { x: number; y: number }[] = [];
    const destroy = render(
      html.base({
        props: { id: "testId" },
        on: {
          "click:passive": (event) => {
            clicks.push({ x: event.screenX, y: event.screenY });
          },
        },
      }),
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
  });

  it("with an observer", () => {
    const click$ = new Subject<MouseEvent>();
    const clicks: { x: number; y: number }[] = [];
    let clickDone = false;
    click$.subscribe({
      next: (point) => {
        clicks.push({ x: point.screenX, y: point.screenY });
      },
      complete: () => {
        clickDone = true;
      },
    });

    const destroy = render(
      html.base({
        props: { id: "testId" },
        on: {
          "click:passive": click$,
        },
      }),
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
    expect(clickDone).toBe(false);

    destroy();
    expect(clickDone).toBe(true);
  });
});
