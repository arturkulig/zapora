import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom } from "@zapora/core";
import { html } from "../element";
import { ZBChildList } from "../publicTypes";
import { render } from "../render";

describe("renders children", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("identifies elements in variable structure", async () => {
    const children$ = new Atom<ZBChildList>([
      html.div({ props: { id: "e1" } }),
      html.div.key`A`({ props: { id: "e2" } }),
    ]);
    const destroy = render(
      html.div({
        props: { id: "app" },
        children: children$,
      }),
      root,
    );

    const [e1a, e2a] = Array.from(root.querySelector("#app")?.children ?? []);
    expect(e2a.id).toBe("e2");

    children$.next([
      html.div({ props: { id: "e1" } }),
      html.div({ props: { id: "e2" } }),
      html.div.key`A`({ props: { id: "e3" } }),
    ]);
    const [e1b, , e3b] = Array.from(root.querySelector("#app")?.children ?? []);
    expect(e2a).toBe(e3b);
    expect(e1a).toBe(e1b);

    destroy();
  });

  it("from null to filled, key is respected and null keyed item is rejected", async () => {
    const children$ = new Atom<ZBChildList>([
      html.div({ props: { id: "e1" } }),
    ]);
    const destroy = render(
      html.div({
        props: { id: "app" },
        children: children$,
      }),
      root,
    );

    const [e1a] = Array.from(root.querySelector("#app")?.children ?? []);
    expect(e1a.id).toBe("e1");

    children$.next([html.div.key`A`({ props: { id: "e1" } })]);
    const [e1b] = Array.from(root.querySelector("#app")?.children ?? []);
    expect(e1a).not.toBe(e1b);

    destroy();
  });

  it("from filled to null, key is respected and keyed item is rejected", async () => {
    const children$ = new Atom<ZBChildList>([
      html.div.key`A`({ props: { id: "e1" } }),
    ]);
    const destroy = render(
      html.div({
        props: { id: "app" },
        children: children$,
      }),
      root,
    );

    const [e1a] = Array.from(root.querySelector("#app")?.children ?? []);
    expect(e1a.id).toBe("e1");

    children$.next([html.div({ props: { id: "e1" } })]);
    const [e1b] = Array.from(root.querySelector("#app")?.children ?? []);
    expect(e1a).not.toBe(e1b);

    destroy();
  });
});
