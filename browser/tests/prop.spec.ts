import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom, Subject } from "@zapora/core";
import { html, render } from "../index";

describe("renders props", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("applied and removed", () => {
    const destroy = render(
      html.div({
        props: { id: "testId" },
      }),
      root,
    );

    const rendered = root.children[0];
    expect(rendered.id).toBe("testId");

    destroy();
    expect(rendered.id).toBe("");
  });

  it("applied stream", async () => {
    const id$ = new Subject<string>();

    const destroy = render(
      html.div({
        props: { id: id$ },
      }),
      root,
    );

    const rendered = root.children[0];

    expect(rendered.id).toBe("");
    await id$.next("lorem");
    expect(rendered.id).toBe("lorem");
    await id$.next("ipsum");
    expect(rendered.id).toBe("ipsum");

    destroy();
    expect(rendered.id).toBe("");
  });

  it("applied state", async () => {
    const id$ = new Atom<string>("start");

    const destroy = render(
      html.div({
        props: { id: id$ },
      }),
      root,
    );

    const rendered = root.children[0];

    expect(rendered.id).toBe("start");
    await id$.next("lorem");
    expect(rendered.id).toBe("lorem");
    await id$.next("ipsum");
    expect(rendered.id).toBe("ipsum");

    destroy();
    expect(rendered.id).toBe("");
  });

  it("stops applying after `complete` signal", async () => {
    const id$ = new Atom<string>("start");

    const destroy = render(
      html.div({
        props: { id: id$ },
      }),
      root,
    );

    const rendered = root.children[0];

    expect(rendered.id).toBe("start");

    await id$.next("lorem");
    expect(rendered.id).toBe("lorem");

    await id$.complete();
    expect(rendered.id).toBe("lorem");

    await id$.next("ipsum");
    expect(rendered.id).toBe("lorem");

    destroy();
  });
});
