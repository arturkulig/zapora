import { describe, it } from "@jest/globals";
import { filter } from "./filter";
import { ofIterable } from "./ofIterable";
import { expectStream } from "./tests/expectStream";

describe("filter operator", () => {
  it("filters", async () => {
    const pushed = [1, 2, 3, 4, 5, 6];
    const predicate = (n: number) => n % 2 === 0;
    const expected = pushed.filter(predicate);

    await expectStream(
      ofIterable(pushed).pipe((_) => filter(_, predicate)),
      expected,
    );
  });
});
