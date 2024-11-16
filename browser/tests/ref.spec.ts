import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom } from "@zapora/core";
import { ZBChildList, html, render } from "../index";

describe("informs of references as render occurs", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("setting children causes not to replace the nodes", async () => {
    let nextCalled = false;
    let completeCalled = false;
    let inspected: Element;
    const destroy = render(
      html.div(
        {
          props: { id: "testId" },
        },
        [
          html.div({
            ref: {
              next: (element) => {
                inspected = element;
                nextCalled = true;
                expect(element.parentNode).not.toBeNull();
              },
              complete: () => {
                completeCalled = true;
                expect(inspected.parentNode).toBeNull();
              },
            },
          }),
        ],
      ),
      root,
    );

    expect(nextCalled).toBe(true);
    expect(completeCalled).toBe(false);

    destroy();

    expect(nextCalled).toBe(true);
    expect(completeCalled).toBe(true);
  });

  it("streaming  children causes not to replace the nodes", async () => {
    let nextCalled = 0;
    let completeCalled = 0;
    let inspected: Element;

    const ref = {
      next: (element: Element) => {
        inspected = element;
        nextCalled++;
        expect(element.parentNode).not.toBeNull();
      },
      complete: () => {
        completeCalled++;
        expect(inspected.parentNode).toBeNull();
      },
    };

    const children$ = new Atom<ZBChildList>([
      html.div({
        ref,
      }),
    ]);

    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    expect(nextCalled).toBe(1);
    expect(completeCalled).toBe(0);

    await children$.next([
      html.div({
        props: { id: "1" },
        ref,
      }),
    ]);

    // same element, not informing
    expect(nextCalled).toBe(1);
    expect(completeCalled).toBe(0);

    await children$.next([
      html.div.key`susan`({
        ref,
      }),
    ]);

    // new element, informing
    expect(nextCalled).toBe(2);
    expect(completeCalled).toBe(1);

    destroy();

    expect(nextCalled).toBe(2);
    expect(completeCalled).toBe(2);
  });
});
