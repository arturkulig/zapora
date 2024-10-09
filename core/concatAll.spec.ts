import { describe, it } from "@jest/globals";
import { concatAll } from "./concatAll";
import { delay } from "./delay";
import { map } from "./map";
import { ofIterable } from "./ofIterable";
import { expectStream } from "./tests/expectStream";

describe("concatAll operator", () => {
  it("merges w/o limit", async () => {
    const pushed = [23, 56, 21, 93, 40];
    await expectStream(
      ofIterable(pushed)
        .pipe((_a) =>
          map(_a, (value) =>
            // for every number `value` generate a stream with that number that emits after `value` miliseconds
            ofIterable([value, value + 1]).pipe((_b) => delay(_b, value)),
          ),
        )
        .pipe((_) => concatAll(_)),
      // despite each substream releasing value with variable delay
      // the order of the messages doesn't get changed
      // as those substreams are consumed in the original order
      pushed.flatMap((n) => [n, n + 1]),
    );
  });
});
