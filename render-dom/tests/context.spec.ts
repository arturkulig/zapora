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

  it("passes context directly", () => {
    const answer = new Context<string>();

    const paragraph = stateless((_props: void, context) => {
      return html.p({}, ["answer is ", context.get(answer)]);
    });

    const children$ = new Atom<ZBChildren>([answer.provide("42", paragraph())]);

    const destroy = render(
      html.div(
        {
          props: { id: "testId" },
        },
        children$,
      ),
      root,
    );

    const [app] = Array.from(root.children);

    expect(app.textContent).toBe("answer is 42");

    destroy();
  });

  it("passes context through a fragment", () => {
    const answer = new Context<string>();

    const paragraph = stateless((_props: void, context) => {
      return html.p(undefined, ["answer is ", context.get(answer)]);
    });

    const children$ = new Atom<ZBChildren>([
      answer.provide("42", fragment([paragraph()])),
    ]);

    const destroy = render(
      html.div(
        {
          props: { id: "testId" },
        },
        children$,
      ),
      root,
    );

    const [app] = Array.from(root.children);

    expect(app.textContent).toBe("answer is 42");

    destroy();
  });

  it("passes context through an element", () => {
    const answer = new Context<string>();

    const paragraph = stateless((_props: void, context) => {
      return html.p(undefined, ["answer is ", context.get(answer)]);
    });

    const children$ = new Atom<ZBChildren>([
      answer.provide("42", html.div({}, [paragraph()])),
    ]);

    const destroy = render(
      html.div(
        {
          props: { id: "testId" },
        },
        children$,
      ),
      root,
    );

    const [app] = Array.from(root.children);

    expect(app.textContent).toBe("answer is 42");

    destroy();
  });
});
