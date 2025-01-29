import { describe, expect, it } from "@jest/globals";
import { Observer } from "./Observer";
import { SimpleSubscription } from "./SimpleSubscription";
import { State } from "./State";
import { expectStream } from "./tests/expectStream";

describe("State", () => {
  it("recomputes current state value", () => {
    let value = 0;
    const factor = 2;

    const state = new State(
      () => {
        return new SimpleSubscription();
      },
      () => value * factor,
    );
    expect(state.value).toBe(value * factor);

    value = 4;
    expect(state.value).toBe(value * factor);

    value = 9;
    expect(state.value).toBe(value * factor);
  });

  it("passes on values and completes", async () => {
    const result = new Array<string>();

    let remote = null as Observer<number> | null;
    new State(
      (observer) => {
        remote = observer;
        return new SimpleSubscription();
      },
      () => 0,
    ).subscribe({
      next: (value) => {
        result.push(`next${value}`);
      },
      complete: () => {
        result.push("complete");
      },
    });

    expect(remote).toBeDefined();
    if (!remote) {
      return;
    }

    await remote.next?.(4);
    expect(result).toEqual(["next4"]);

    await remote.next?.(5);
    expect(result).toEqual(["next4", "next5"]);

    await remote.complete?.();
    expect(result).toEqual(["next4", "next5", "complete"]);
  });

  it("exposes only provided observer callbacks", () => {
    let remote = null as Observer<number> | null;
    const state = new State(
      (observer) => {
        remote = observer;
        return new SimpleSubscription();
      },
      () => 0,
    );

    const subA = state.subscribe({
      next: () => {},
    });
    expect(remote?.next).toBeDefined();
    expect(remote?.complete).toBeUndefined();
    subA.cancel();

    const subB = state.subscribe({
      complete: () => {},
    });
    expect(remote?.next).toBeUndefined();
    expect(remote?.complete).toBeDefined();
    subB.cancel();
  });

  describe("when observed as a plain observable", () => {
    it("pushes value as first message", async () => {
      const state = new State(
        (observer) => {
          const sub = new SimpleSubscription();
          void (async function () {
            await (!sub.closed && !observer.closed && observer.next?.(1));
            await (!sub.closed && !observer.closed && observer.complete?.());
          })();
          return sub;
        },
        () => 42,
      );

      await expectStream(state.toObservable(), [42, 1]);
    });
  });
});
