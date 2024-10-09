import { describe, it } from "@jest/globals";
import { delay } from "./delay";
import { timeout } from "./internal/timeout";
import { range } from "./range";
import { expectStream } from "./tests/expectStream";

describe("range", () => {
  it("emits consecutive numbers", async () => {
    await expectStream(
      range(1, 20),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    );
  });

  it("emits indefinitely", async () => {
    await expectStream(
      range(7).pipe((_) => delay(_, 100)),
      [7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      { full: false, partial: true },
      timeout(1050),
    );
  });

  it("emits indefinitely w/o range designated", async () => {
    await expectStream(
      range().pipe((_) => delay(_, 100)),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      { full: false, partial: true },
      timeout(1050),
    );
  });
});
