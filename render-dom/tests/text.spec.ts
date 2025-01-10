import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom } from "@zapora/core";
import { ZBChildList, html, render } from "../index";

describe("renders text nodes", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("as children", () => {
    const destroy = render(
      html.div({}, [html.p({}, ["123"]), "456", html.a({}, ["789"])]),
      root,
    );

    expect(root.textContent).toBe("123456789");
    expect(root.childNodes[0].childNodes.length).toBe(3);

    destroy();
  });

  it("recomputes text content", async () => {
    const children$ = new Atom<ZBChildList>([
      "n:",
      html.p({}, ["123"]),
      "456",
      html.a({}, ["789"]),
    ]);

    const destroy = render(html.div({}, children$), root);

    await children$.next([
      "n:",
      html.p({}, ["987"]),
      "6",
      "5",
      "4",
      html.a({}, ["321"]),
    ]);

    expect(root.childNodes[0].childNodes.length).toBe(6);
    expect(root.textContent).toBe("n:987654321");

    destroy();
  });
});
