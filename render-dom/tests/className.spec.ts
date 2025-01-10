import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom } from "@zapora/core";
import { html, render } from "../index";

describe("renders styles", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("applied and removed", () => {
    const destroy = render(
      html.div({
        className: "test",
      }),
      root,
    );

    const rendered = root.children[0] as HTMLDivElement;
    expect(rendered.className).toBe("test");

    destroy();
    expect(rendered.className).toBe("");
  });

  it("follows a stream", async () => {
    const className$ = new Atom<string>("test");
    const destroy = render(
      html.div({
        className: className$,
      }),
      root,
    );

    const rendered = root.children[0] as HTMLDivElement;
    expect(rendered.className).toBe("test");

    await className$.next("test2");
    expect(rendered.className).toBe("test2");

    destroy();
    expect(rendered.className).toBe("");
  });
});
