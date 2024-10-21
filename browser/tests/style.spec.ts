import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom, Subject } from "@zapora/core";
import { html } from "../element";
import { render } from "../render";

describe("renders styles", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("applied and removed", () => {
    const destroy = render(
      html.div({
        style: { display: "block" },
      }),
      root,
    );

    const rendered = root.children[0] as HTMLBaseElement;
    expect(rendered.style.display).toBe("block");

    destroy();
    expect(rendered.style.display).toBe("");
  });

  it("applied stream", async () => {
    const style$ = new Subject<string>();

    const destroy = render(
      html.div({
        style: { display: style$ },
      }),
      root,
    );

    const rendered = root.children[0] as HTMLBaseElement;

    expect(rendered.style.display).toBe("");
    await style$.next("block");
    expect(rendered.style.display).toBe("block");
    await style$.next("inline");
    expect(rendered.style.display).toBe("inline");

    destroy();
    expect(rendered.style.display).toBe("");
  });

  it("applied state", async () => {
    const style$ = new Atom<string>("flex");

    const destroy = render(
      html.div({
        style: { display: style$ },
      }),
      root,
    );

    const rendered = root.children[0] as HTMLBaseElement;

    expect(rendered.style.display).toBe("flex");
    await style$.next("block");
    expect(rendered.style.display).toBe("block");
    await style$.next("inline");
    expect(rendered.style.display).toBe("inline");

    destroy();
    expect(rendered.style.display).toBe("");
  });
});
