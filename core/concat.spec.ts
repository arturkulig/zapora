import { describe, expect, it } from "@jest/globals";
import { concat } from "./concat";
import { delay } from "./delay";
import { ofIterable } from "./ofIterable";
import { State } from "./State";
import { expectStream } from "./tests/expectStream";

describe("concat", () => {
  it("joins sync streams", async () => {
    await expectStream(
      concat([
        ofIterable([1, 2, 3]),
        ofIterable([4, 5, 6]),
        ofIterable([7, 8, 9]),
      ]),
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
  });

  it("joins sync streams from non-arrays", async () => {
    await expectStream(
      concat(
        new Set([
          ofIterable([1, 2, 3]),
          ofIterable([4, 5, 6]),
          ofIterable([7, 8, 9]),
        ]),
      ),
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
  });

  it("joins async streams", async () => {
    await expectStream(
      concat([
        ofIterable([1, 2, 3]).pipe((_) => delay(_, 25)),
        ofIterable([4, 5, 6]).pipe((_) => delay(_, 30)),
        ofIterable([7, 8, 9]).pipe((_) => delay(_, 35)),
      ]),
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
  });

  it("joining State results in State", async () => {
    const stateValue = 42;
    const concatenated = concat([
      ofIterable([1, 2, 3]),
      ofIterable([4, 5, 6]),
      new State(
        (observer) => ofIterable([7, 8, 9]).subscribe(observer),
        () => stateValue,
      ),
    ]);

    expect(concatenated.value).toBe(stateValue);
    await expectStream(concatenated, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("closes immediately when no observables are provided", async () => {
    await expectStream(concat([]), []);
  });
});
