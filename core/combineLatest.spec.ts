import { describe, it } from "@jest/globals";
import { combineLatest } from "./combineLatest";
import { delay } from "./delay";
import { ofIterable } from "./ofIterable";
import { State } from "./State";
import { expectStream } from "./tests/expectStream";

describe("combineLatest", () => {
  it("combines", async () => {
    const stream = combineLatest<[number, string]>([
      ofIterable([1, 2, 3]).pipe((_) => delay(_, 10)),
      ofIterable("a,b,c".split(",")),
    ]);

    stream.subscribe({
      next: async (value) => {
        // type check
        await Promise.resolve<[number, string]>(value);
      },
    });

    // function check
    await expectStream(stream, [
      [1, "a"],
      [1, "b"],
      [1, "c"],
      [2, "c"],
      [3, "c"],
    ]);
  });

  it("includes state as last known message", async () => {
    const stream = combineLatest([
      new State<number>(
        (observer) =>
          ofIterable([1, 2, 3])
            .pipe((_) => delay(_, 10))
            .subscribe(observer),
        () => 0,
      ),
      ofIterable("a,b,c".split(",")),
    ]);

    await expectStream(stream, [
      [0, "a"],
      [0, "b"],
      [0, "c"],
      [1, "c"],
      [2, "c"],
      [3, "c"],
    ]);
  });
});
