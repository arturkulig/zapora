import { beforeEach, describe, expect, it } from "@jest/globals";
import { Atom } from "@zapora/core";
import {
  ZBChildList,
  ZBChildren,
  html,
  render,
  stateful,
  stateless,
} from "../index";

describe("renders components", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    root = document.createElement("div");
  });

  it("passing props", async () => {
    const par = stateless((props: { text: string }) =>
      html.p({ children: [props.text] }),
    );
    const children$ = new Atom<ZBChildList>([
      par({ text: "Hello" }),
      par({ text: " " }),
      par({ text: "world" }),
    ]);
    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const [app] = Array.from(root.children);
    expect(app.textContent).toBe("Hello world");

    const song = "Oompa Loompa do ba dee doo";
    await children$.next(
      song
        .split(" ")
        .flatMap((word, index) =>
          index === 0
            ? [par({ text: word })]
            : [par({ text: " " }), par({ text: word })],
        ),
    );

    expect(app.textContent).toBe(song);

    destroy();
  });

  it("resolves deeply nested uses including self-refering components", async () => {
    const par = stateless(
      (props: { countdown: number }): ZBChildren =>
        props.countdown > 0
          ? par({ countdown: props.countdown - 1 })
          : html.p({ children: ["A"] }),
    );

    const children$ = new Atom<ZBChildList>([
      par({ countdown: 100 }),
      par({ countdown: 2 }),
      par({ countdown: 34 }),
    ]);

    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const [app] = Array.from(root.children);
    expect(app.textContent).toBe("AAA");

    destroy();
  });

  it("maintain state of unmoving component", async () => {
    let hello$ = null as Atom<string> | null;

    const custom = stateful({
      hello: "im ellen",
    })((props: {}, { hello }) => {
      hello$ = hello;

      return html.input({
        props: { value: hello },
      });
    });

    const children$ = new Atom<ZBChildren>([custom({})]);

    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const [app] = Array.from(root.children);

    const [input1] = Array.from(app.children);
    expect((input1 as HTMLInputElement).value).toBe("im ellen");

    await hello$?.next("world");
    const [input2] = Array.from(app.children);
    expect((input2 as HTMLInputElement).value).toBe("world");

    // at this point the local state of `custom` component is non-default
    // lets change the structure to see if it got persisted

    await children$.next([custom({}), html.p()]);
    const [input3] = Array.from(app.children);
    expect((input3 as HTMLInputElement).value).toBe("world");

    // lets change the structure so that
    // `custom` component changes its place
    // and looses the state

    await children$.next([html.p(), custom({}), html.p()]);
    const [, input4] = Array.from(app.children);
    expect((input4 as HTMLInputElement).value).toBe("im ellen");

    destroy();
  });

  it("maintain state assign to keyed components that move", async () => {
    const customInput = stateful((props: { initial: string }) => ({
      value: props.initial,
    }))((props, { value }) => {
      return html.input({
        props: { value, initialValue: props.initial } as any,
      });
    });

    const children$ = new Atom<ZBChildren>([
      customInput.key`A`({ initial: "A" }),
      html.p(),
      customInput({ initial: "C" }),
      customInput.key`D`({ initial: "D" }),
    ]);

    const destroy = render(
      html.div({
        props: { id: "testId" },
        children: children$,
      }),
      root,
    );

    const [app] = Array.from(root.children);

    const [input1a, _1, input1c, input1d] = Array.from(app.children);
    expect((input1a as any).initialValue).toBe("A");
    expect((input1c as any).initialValue).toBe("C");
    expect((input1d as any).initialValue).toBe("D");
    expect((input1a as HTMLInputElement).value).toBe("A");
    expect((input1c as HTMLInputElement).value).toBe("C");
    expect((input1d as HTMLInputElement).value).toBe("D");

    await children$.next([
      customInput.key`D`({ initial: "changedD" }),
      html.p(),
      customInput({ initial: "unchangedC" }),
      customInput.key`A`({ initial: "changedA" }),
    ]);
    const [input2a, _2, input2c, input2d] = Array.from(app.children);
    expect((input2a as any).initialValue).toBe("changedD");
    expect((input2c as any).initialValue).toBe("unchangedC");
    expect((input2d as any).initialValue).toBe("changedA");
    expect((input2a as HTMLInputElement).value).toBe("D");
    expect((input2c as HTMLInputElement).value).toBe("C");
    expect((input2d as HTMLInputElement).value).toBe("A");

    destroy();
  });
});
