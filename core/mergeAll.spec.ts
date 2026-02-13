import { describe, it } from "@jest/globals";
import { delay } from "./delay";
import { map } from "./map";
import { mergeAll } from "./mergeAll";
import { ofIterable } from "./ofIterable";
import { expectStream } from "./tests/expectStream";

describe("mergeAll operator", () => {
  it("merges w/o limit", async () => {
    const pushed = [23, 56, 21, 93, 40];
    await expectStream(
      ofIterable(pushed)
        .pipe((_a) =>
          map(_a, (value) =>
            // for every number `value` generate a stream with that number that emits after `value` miliseconds
            ofIterable([value]).pipe((_b) => delay(_b, value)),
          ),
        )
        .pipe((_) => mergeAll(_)),
      // since each value was delayed by its amount
      // it effectively makes it a stream of sorted values
      pushed.toSorted((a, b) => a - b),
    );
  });

  it("merges with limit", async () => {
    const pushed = [20, 30, 30, 1];
    await expectStream(
      ofIterable(pushed)
        .pipe((_a) =>
          map(_a, (value) =>
            ofIterable([value]).pipe((_b) => delay(_b, value)),
          ),
        )
        /*
        20 >---X          | first sent, first received
        30 >-----X        | second sent, second received
            30 >------X   | waited for first to be received, third sent, fourth received
               1 >X       | waited for second to be received, fourth sent, third received
        */
        .pipe((_) => mergeAll(_, 2)),
      [20, 30, 1, 30],
    );
  });

  it("closes only when all involved close", async () => {
    const pushed = [20, 30, 30, 1];
    await expectStream(
      ofIterable(pushed)
        .pipe((_a) =>
          map(_a, (value) =>
            ofIterable([value]).pipe((_b) => delay(_b, value)),
          ),
        )
        .pipe((_) =>
          delay(_, 100, { selectively: { next: false, complete: true } }),
        )
        .pipe((_) => mergeAll(_)),
      pushed.toSorted((a, b) => a - b),
    );
  });
});
