import { describe, expect, it } from "@jest/globals";
import { map } from "./map";
import { ofIterable } from "./ofIterable";
import { State } from "./State";
import { expectStream } from "./tests/expectStream";

const multiply = (n: number) => n * 5;

describe("map operator", () => {
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
