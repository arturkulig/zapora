import { describe, it } from "@jest/globals";
import { delay } from "./delay";
import { ofIterable } from "./ofIterable";
import { State } from "./State";
import { expectStream } from "./tests/expectStream";
import { withLatestFrom } from "./withLatestFrom";

describe("withLatestFrom", () => {
  it("combines with the first source pace", async () => {
    const stream = withLatestFrom<[number, string]>([
      ofIterable([1, 2, 3]).pipe((_) => delay(_, 10)),
      ofIterable("a,b,c".split(",")),
    ]);

    stream.subscribe({
      next: async (value) => {
        // type check
        await Promise.resolve<[number, string]>(value);
      },
    });

    await expectStream(stream, [
      // source B pushes all messages immediately
      // so pacing with source A reveals only last B message
      [1, "c"],
      [2, "c"],
      [3, "c"],
    ]);
  });

  it("doesn't emit before receiving from all sources", async () => {
    const stream = withLatestFrom([
      ofIterable([1, 2, 3, 4, 5, 6]).pipe((_) => delay(_, 100)),
      ofIterable([1, 2, 3, 4, 5, 6]).pipe((_) => delay(_, 140)),
      //                         here's the difference ^^^
      ofIterable("a,b,c".split(",")),
    ]);

    // A: ---------1....---------2---------3---------4---------5---------6
    // B: -------------1-------------2-------------3-------------4--------
    // C: abc-------------------------------------------------------------
    //             ^ first snapshot sent, but B missing
    //                 ^ first complete snapshot sent
    //                       ^ snapshot sent
    //                                 ^ snapshot sent
    //                                           ^ snapshot sent
    //                                                     ^ last snapshot sent

    await expectStream(stream, [
      [1, 1, "c"],
      [2, 1, "c"],
      [3, 2, "c"],
      [4, 3, "c"],
      [5, 3, "c"],
      [6, 4, "c"],
    ]);
  });

  it("includes state as last known message", async () => {
    const stream = withLatestFrom([
      ofIterable([1, 2, 3, 4, 5]).pipe((_) => delay(_, 100)),
      new State<number>(
        (observer) =>
          ofIterable([1, 2, 3, 4, 5])
            .pipe((_) => delay(_, 140))
            .subscribe(observer),
        () => 0,
      ),
      ofIterable("a,b,c".split(",")),
    ]);

    // A: ---------1---------2---------3---------4---------5
    // B: 0(state)-----1-------------2-------------3--------
    // C: abc-----------------------------------------------
    //             ^ first snapshot sent
    //                       ^ snapshot sent
    //                                 ^ snapshot sent
    //                                           ^ snapshot sent
    //                                                     ^ last snapshot sent

    await expectStream(stream, [
      [1, 0, "c"],
      [2, 1, "c"],
      [3, 2, "c"],
      [4, 2, "c"],
      [5, 3, "c"],
    ]);
  });
});
