import { describe, expect, it } from "@jest/globals";
import { ofIterable } from "./ofIterable";
import { scan } from "./scan";
import { State } from "./State";
import { expectStream } from "./tests/expectStream";

const start = 0;
const pushed = [1, 5, 32, 3];
const sum = (a: number, b: number) => (b === undefined ? a : a + b);
const intended = pushed.map((_, i) =>
  pushed.slice(0, i + 1).reduce(sum, start),
);

describe("scan operator", () => {
  it("scans over an Observable", async () => {
    await expectStream(
      ofIterable(pushed).pipe((_) => scan(_, sum, start)),
      intended,
    );
  });

  it("scans over an State", async () => {
    const initial = 33;

    const pipedState = new State(
      (observer) => ofIterable(pushed).subscribe(observer),
      (): number => initial,
    ).pipe((_) => scan(_, sum, start));

    expect(pipedState.value).toBe(sum(initial, start));

    await expectStream(pipedState, intended);
  });
});
