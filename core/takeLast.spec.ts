import { describe, it } from "@jest/globals";
import { ofIterable } from "./ofIterable";
import { takeLast } from "./takeLast";
import { expectStream } from "./tests/expectStream";

describe("takeLast operator", () => {
  it("takes none and completes", async () => {
    await expectStream(
      ofIterable([1, 2, 3]).pipe((_) => takeLast(_, 0)),
      [],
    );
  });

  it("takes none when amount is less than 0 and completes", async () => {
    await expectStream(
      ofIterable([1, 2, 3]).pipe((_) => takeLast(_, -100)),
      [],
    );
  });

  it("takes 2 and completes", async () => {
    await expectStream(
      ofIterable([1, 2, 3]).pipe((_) => takeLast(_, 2)),
      [2, 3],
    );
  });

  it("takes less when source completes", async () => {
    await expectStream(
      ofIterable([1, 2, 3]).pipe((_) => takeLast(_, 100)),
      [1, 2, 3],
    );
  });
});
