import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom } from "@zapora/core";
import { ZBChildList, fragment, html, render } from "../index";

describe("renders fragments", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("transparent when structure is stable", async () => {
    const initial: ZBChildList = [
      html.div({ props: { id: "e1" } }),
      fragment.key`A`([html.div({ props: { id: "e2" } })]),
    ];
    const children$ = new Atom<ZBChildList>(initial);
    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const [app] = Array.from(root.children);
    const [e1a, e2a] = Array.from(app.children);
    expect(e2a).toBeInstanceOf(HTMLDivElement);
    if (!(e2a instanceof HTMLDivElement)) {
      return;
    }
    expect(e2a.id).toBe("e2");

    await children$.next(initial);

    const [e1b, e2b] = Array.from(app.children);
    expect(e2b).toBeDefined();
    expect(e2a).toBe(e2b);

    destroy();
  });

  it("going off fragment gets recognized as a change in structure", async () => {
    const children$ = new Atom<ZBChildList>([
      html.div({ props: { id: "e1" } }),
      fragment.key`A`([html.div({ props: { id: "e2" } })]),
    ]);
    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const [app] = Array.from(root.children);
    const [e1a, e2a] = Array.from(app.children);
    expect(e2a.id).toBe("e2");

    await children$.next([
      html.div({ props: { id: "e1" } }),
      html.div({ props: { id: "e2" } }),
    ]);

    const [e1b, e2b] = Array.from(app.children);
    expect(e2b).toBeDefined();
    expect(e2a).not.toBe(e2b);

    destroy();
  });

  it("nested fragments extend fragments behaviour", async () => {
    const children$ = new Atom<ZBChildList>([
      html.div({ props: { id: "e1" } }),
      fragment.key`outer`([
        fragment.key`innerA`([html.div({ props: { id: "e2" } })]),
        fragment.key`innerB`([html.div({ props: { id: "e3" } })]),
      ]),
    ]);
    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const [app] = Array.from(root.children);
    const [e1a, e2a, e3a] = Array.from(app.children);

    await children$.next([
      html.div({ props: { id: "e1" } }),
      fragment.key`outer`([
        fragment.key`innerA`([html.div({ props: { id: "e2" } })]),
        fragment([html.div({ props: { id: "e3" } })]),
      ]),
    ]);

    const [e1b, e2b, e3b] = Array.from(app.children);
    expect(e1a).toBe(e1b);
    expect(e2a).toBe(e2b);
    expect(e3a).not.toBe(e3b);

    destroy();
  });
});
