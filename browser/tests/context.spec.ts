import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom } from "@zapora/core";
import {
  Context,
  ZBChildren,
  fragment,
  html,
  render,
  stateless,
} from "../index";

describe("renders with context", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("passes context directly", async () => {
    const answer = new Context<string>();

    const paragraph = stateless((props: void, context) => {
      return html.p({
        children: ["answer is ", context.get(answer)],
      });
    });

    const children$ = new Atom<ZBChildren>([answer.provide("42", paragraph())]);

    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const [app] = Array.from(root.children);

    expect(app.textContent).toBe("answer is 42");

    destroy();
  });

  it("passes context through a fragment", async () => {
    const answer = new Context<string>();

    const paragraph = stateless((props: void, context) => {
      return html.p({
        children: ["answer is ", context.get(answer)],
      });
    });

    const children$ = new Atom<ZBChildren>([
      answer.provide("42", fragment([paragraph()])),
    ]);

    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const [app] = Array.from(root.children);

    expect(app.textContent).toBe("answer is 42");

    destroy();
  });

  it("passes context through an element", async () => {
    const answer = new Context<string>();

    const paragraph = stateless((props: void, context) => {
      return html.p({
        children: ["answer is ", context.get(answer)],
      });
    });

    const children$ = new Atom<ZBChildren>([
      answer.provide("42", html.div({ children: [paragraph()] })),
    ]);

    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const [app] = Array.from(root.children);

    expect(app.textContent).toBe("answer is 42");

    destroy();
  });
});
