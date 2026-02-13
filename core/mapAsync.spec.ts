import { describe, it } from "@jest/globals";
import { timeout } from "./internal/timeout";
import { mapAsync } from "./mapAsync";
import { ofIterable } from "./ofIterable";
import { State } from "./State";
import { expectStream } from "./tests/expectStream";

const multiply = (n: number) => n * 5;
const multiplyLong = (n: number) =>
  timeout(n * 10).then(() => Promise.resolve(multiply(n)));

describe("mapAsync operator", () => {
  it("maps over an Observable", async () => {
    const pushed = [1, 5, 32, 3];
    const intended = pushed.map(multiply);

    await expectStream(
      ofIterable(pushed).pipe((_) => mapAsync(_, multiplyLong)),
      intended,
    );
  });

  it("maps over an State", async () => {
    const pushed = [1, 5, 32, 3];
    const intended = pushed.map(multiply);

    const initial = 33;

    const pipedState = new State(
      (observer) => ofIterable(pushed).subscribe(observer),
      (): number => initial,
    ).pipe((_) => mapAsync(_, multiplyLong));

    await expectStream(pipedState, intended);
  });
});
