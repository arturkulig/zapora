import { describe, it } from "@jest/globals";
import { delay } from "./delay";
import { ofIterable } from "./ofIterable";
import { expectStream } from "./tests/expectStream";
import { zip } from "./zip";

describe("zip", () => {
  it("steps over sources with equal pace", async () => {
    await expectStream(
      zip([
        ofIterable([1, 2, 3, 4, 5, 6, 7]).pipe((_) => delay(_, 10)),
        ofIterable([1, 2, 3, 4, 5, 6]).pipe((_) => delay(_, 20)),
        ofIterable([1, 2, 3, 4, 5]).pipe((_) => delay(_, 30)),
      ]),
      [
        [1, 1, 1],
        [2, 2, 2],
        [3, 3, 3],
        [4, 4, 4],
        [5, 5, 5],
      ],
    );
  });
});
