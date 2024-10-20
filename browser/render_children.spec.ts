import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom } from "@zapora/core";
import { html } from "./element";
import { render } from "./render";
import { ZBChildren } from "./ZBElement";

describe("renders children", () => {
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

  it("streaming  children causes not to replace the nodes", async () => {
    const children$ = new Atom<ZBChildren>([
      html.div({ props: { id: "1" } }),
      html.a(),
    ]);
    const destroy = render(
      html.base({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const rendered = root.children[0];

    // verify initial state
    expect(
      Array.from(rendered.children, (_) => _.tagName.toLowerCase()),
    ).toEqual(["div", "a"]);
    const [child1a, child1b] = Array.from(rendered.children);
    expect(child1a.id).toBe("1");

    // update children (added)
    await children$.next([
      html.div({ props: { id: "2" } }),
      html.p(),
      html.h1(),
    ]);
    expect(
      Array.from(rendered.children, (_) => _.tagName.toLowerCase()),
    ).toEqual(["div", "p", "h1"]);
    const [child2a, child2b, _child2c] = Array.from(rendered.children);
    expect(child1a).toBe(child2a);
    expect(child1b).not.toBe(child2b);
    expect(child2a.id).toBe("2");

    // update children (removed)
    await children$.next([html.p(), html.h1()]);
    expect(
      Array.from(rendered.children, (_) => _.tagName.toLowerCase()),
    ).toEqual(["p", "h1"]);
    const [child3b, _child3c] = Array.from(rendered.children);
    expect(child3b.id).not.toBe("2");

    // verify cleanup
    destroy();
    expect(rendered.id).toBe("");
    expect(rendered.children.length).toBe(0);
  });

  // it("setting massive amounts of nodes", async () => {
  //   const intendedLength = 2 ** 16 + 100;
  //   const children$ = new Atom<ZBChildren>(
  //     Array.from(new Array(intendedLength), () => html.div()),
  //   );
  //   const destroy = render(
  //     html.base({
  //       props: { id: "testId" },
  //       children: children$,
  //     }),
  //     root,
  //   );

  //   const rendered = root.children[0];

  //   // verify initial state
  //   expect(rendered.children.length).toBe(intendedLength);

  //   // update children (added)
  //   await children$.next(
  //     Array.from(new Array(intendedLength + 100), () => html.div()),
  //   );
  //   expect(rendered.children.length).toBe(intendedLength + 100);

  //   // update children (removed)
  //   await children$.next(
  //     Array.from(new Array(intendedLength), () => html.div()),
  //   );
  //   expect(rendered.children.length).toBe(intendedLength);

  //   // update children (cleared)
  //   await children$.next([]);
  //   expect(rendered.children.length).toBe(0);

  //   // verify cleanup
  //   destroy();
  //   expect(rendered.id).toBe("");
  //   expect(rendered.children.length).toBe(0);
  // });
});
