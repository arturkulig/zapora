import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom, Subject } from "@zapora/core";
import { custom, html, render } from "../index";

describe("renders attributes", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("applied and removed", () => {
    const destroy = render(
      html.div({
        attrs: { title: "testId" },
      }),
      root,
    );

    const rendered = root.children[0];
    expect(rendered.getAttribute("title")).toBe("testId");

    destroy();
    expect(rendered.getAttribute("title")).toBe(null);
  });

  it("applied and removed (custom)", () => {
    const destroy = render(
      custom<{ title: string }>("test-element")({
        attrs: { title: "testId" },
      }),
      root,
    );

    const rendered = root.children[0];
    expect(rendered.tagName).toBe("TEST-ELEMENT");
    expect(rendered.getAttribute("title")).toBe("testId");

    destroy();
    expect(rendered.getAttribute("title")).toBe(null);
  });

  it("applied stream", async () => {
    const id$ = new Subject<string>();

    const destroy = render(
      html.div({
        attrs: { title: id$ },
      }),
      root,
    );

    const rendered = root.children[0];

    expect(rendered.getAttribute("title")).toBe(null);
    await id$.next("lorem");
    expect(rendered.getAttribute("title")).toBe("lorem");
    await id$.next("ipsum");
    expect(rendered.getAttribute("title")).toBe("ipsum");

    destroy();
    expect(rendered.getAttribute("title")).toBe(null);
  });

  it("applied state", async () => {
    const id$ = new Atom<string>("start");

    const destroy = render(
      html.div({
        attrs: { title: id$ },
      }),
      root,
    );

    const rendered = root.children[0];

    expect(rendered.getAttribute("title")).toBe("start");
    await id$.next("lorem");
    expect(rendered.getAttribute("title")).toBe("lorem");
    await id$.next("ipsum");
    expect(rendered.getAttribute("title")).toBe("ipsum");

    destroy();
    expect(rendered.getAttribute("title")).toBe(null);
  });

  it("stops applying after `complete` signal", async () => {
    const id$ = new Atom<string>("start");

    const destroy = render(
      html.div({
        attrs: { title: id$ },
      }),
      root,
    );

    const rendered = root.children[0];

    expect(rendered.getAttribute("title")).toBe("start");

    await id$.next("lorem");
    expect(rendered.getAttribute("title")).toBe("lorem");

    await id$.complete();
    expect(rendered.getAttribute("title")).toBe("lorem");

    await id$.next("ipsum");
    expect(rendered.getAttribute("title")).toBe("lorem");

    destroy();
  });
});
