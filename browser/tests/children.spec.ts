import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom } from "@zapora/core";
import { html } from "../element";
import { CONFIG } from "../internal/config";
import { render } from "../render";
import { ZBChildren } from "../ZBElement";

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
      html.div({
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

  it("keys make items unique", async () => {
    const children$ = new Atom<ZBChildren>([
      html.div({ props: { id: "1" } }),
      html.a(),
    ]);
    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const rendered = root.children[0];

    // verify initial state
    const [child1] = Array.from(rendered.children);
    expect(child1.id).toBe("1");

    // update children KEY CHANGE - STRING
    await children$.next([
      html.div({ key: "2", props: { id: "2" } }),
      html.a(),
    ]);
    const [child2] = Array.from(rendered.children);
    expect(child2).not.toBe(child1);
    expect(child2.id).toBe("2");

    // update children KEY CHANGE - NUMBER
    await children$.next([html.div({ key: 3, props: { id: "2" } }), html.a()]);
    const [child3] = Array.from(rendered.children);
    expect(child3).not.toBe(child2);
    expect(child3.id).toBe("2");

    // update children KEY CHANGE - NONE
    await children$.next([html.div({ props: { id: "4" } }), html.a()]);
    const [child4] = Array.from(rendered.children);
    expect(child4).not.toBe(child3);
    expect(child4.id).toBe("4");

    // update children KEY NOT CHANGED
    await children$.next([html.div({ props: { id: "5" } }), html.a()]);
    const [child5] = Array.from(rendered.children);
    expect(child5).toBe(child4);
    expect(child5.id).toBe("5");

    destroy();
  });

  describe("massive amounts of nodes", () => {
    CONFIG.ARG_MAX_LEN = 8;

    it("setting massive amounts of nodes", async () => {
      const intendedLength = CONFIG.ARG_MAX_LEN + 1;

      const children$ = new Atom<ZBChildren>(
        Array.from(new Array(intendedLength), () => html.div()),
      );
      const destroy = render(
        html.base({
          props: { id: "testId" },
          children: children$,
        }),
        root,
      );

      const rendered = root.children[0];

      // verify initial state
      expect(rendered.children.length).toBe(intendedLength);

      // update children (added)
      await children$.next(
        Array.from(new Array(intendedLength), () => html.div()),
      );
      expect(rendered.children.length).toBe(intendedLength);

      // update children (cleared)
      await children$.next([]);
      expect(rendered.children.length).toBe(0);

      // update children (added back again)
      await children$.next(
        Array.from(new Array(intendedLength), () => html.div()),
      );
      expect(rendered.children.length).toBe(intendedLength);

      // update children (added 10)
      await children$.next(
        Array.from(new Array(intendedLength + 10), () => html.div()),
      );
      expect(rendered.children.length).toBe(intendedLength + 10);

      // update children (added p)
      await children$.next([
        ...Array.from(new Array(intendedLength), () => html.p()),
        ...Array.from(new Array(intendedLength), () => html.div()),
      ]);
      expect(rendered.children.length).toBe(intendedLength * 2);

      // update children (removed)
      await children$.next(
        Array.from(new Array(intendedLength), () => html.div()),
      );
      expect(rendered.children.length).toBe(intendedLength);

      // update children (cleared)
      await children$.next([]);
      expect(rendered.children.length).toBe(0);

      // verify cleanup
      destroy();
      expect(rendered.id).toBe("");
      expect(rendered.children.length).toBe(0);
    });
  });
});
