import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom, Subject } from "@zapora/core";
import { html } from "../element";
import { render } from "../render";

describe("renders props", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("applied and removed", () => {
    const destroy = render(
      html.base({
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
    const ids = new Subject<string>();

    const destroy = render(
      html.base({
        props: { id: ids },
      }),
      root,
    );

    const rendered = root.children[0];

    expect(rendered.id).toBe("");
    await ids.next("lorem");
    expect(rendered.id).toBe("lorem");
    await ids.next("ipsum");
    expect(rendered.id).toBe("ipsum");

    destroy();
    expect(rendered.id).toBe("");
  });

  it("applied state", async () => {
    const ids = new Atom<string>("start");

    const destroy = render(
      html.base({
        props: { id: ids },
      }),
      root,
    );

    const rendered = root.children[0];

    expect(rendered.id).toBe("start");
    await ids.next("lorem");
    expect(rendered.id).toBe("lorem");
    await ids.next("ipsum");
    expect(rendered.id).toBe("ipsum");

    destroy();
    expect(rendered.id).toBe("");
  });
});
