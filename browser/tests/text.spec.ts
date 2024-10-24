import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom } from "@zapora/core";
import { html } from "../element";
import { render } from "../render";
import { ZBChildren } from "../ZBElement";

describe("renders text nodes", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("as children", () => {
    const destroy = render(
      html.div({
        children: [
          html.p({ children: ["123"] }),
          "456",
          html.a({ children: ["789"] }),
        ],
      }),
      root,
    );

    expect(root.childNodes[0].childNodes.length).toBe(3);
    expect(root.textContent).toBe("123456789");

    destroy();
  });

  it("recomputes text content", async () => {
    const children$ = new Atom<ZBChildren>([
      "n:",
      html.p({ children: ["123"] }),
      "456",
      html.a({ children: ["789"] }),
    ]);

    const destroy = render(
      html.div({
        children: children$,
      }),
      root,
    );

    await children$.next([
      "n:",
      html.p({ children: ["987"] }),
      "6",
      "5",
      "4",
      html.a({ children: ["321"] }),
    ]);

    expect(root.childNodes[0].childNodes.length).toBe(6);
    expect(root.textContent).toBe("n:987654321");

    destroy();
  });
});
