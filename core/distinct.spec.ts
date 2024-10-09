import { describe, it } from "@jest/globals";
import { distinct } from "./distinct";
import { ofIterable } from "./ofIterable";
import { expectStream } from "./tests/expectStream";

describe("distinct operator", () => {
  it("distincts with identity", async () => {
    await expectStream(
      ofIterable([1, 2, 3, 3, 4, 4, 5, 6]).pipe((_) => distinct(_)),
      [1, 2, 3, 4, 5, 6],
    );
  });

  it("distincts with an extractor", async () => {
    await expectStream(
      ofIterable([1, 2, 3, 3, 4, 4, 5, 6].map((num) => ({ num }))).pipe((_) =>
        distinct(_, ({ num }) => num),
      ),
      [1, 2, 3, 4, 5, 6].map((num) => ({ num })),
    );
  });
});
