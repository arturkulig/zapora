import { describe, expect, it } from "@jest/globals";
import { timeout } from "./internal/timeout";
import { map } from "./map";
import { ofIterable } from "./ofIterable";
import { State } from "./State";
import { expectStream } from "./tests/expectStream";

const multiply = (n: number) =>
  timeout(n * 10).then(() => Promise.resolve(n * 5));

describe("mapAsync operator", () => {
  it("maps over an Observable", async () => {
    const pushed = [1, 5, 32, 3];
    const intended = pushed.map(multiply);

    await expectStream(
      ofIterable(pushed).pipe((_) => map(_, multiply)),
      intended,
    );
  });

  it("maps over an State", async () => {
    const pushed = [1, 5, 32, 3];
    const intended = pushed.map(multiply);

    const initial = 33;
    const intendedInitial = multiply(initial);

    const pipedState = new State(
      (observer) => ofIterable(pushed).subscribe(observer),
      (): number => initial,
    ).pipe((_) => map(_, multiply));

    expect(pipedState.value).toBe(intendedInitial);

    await expectStream(pipedState, intended);
  });
});
