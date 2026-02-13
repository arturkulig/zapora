import { describe, expect, it } from "@jest/globals";
import { ofIterable } from "./ofIterable";
import { toAsyncIterable } from "./toAsyncIterable";

describe("toAsyncIterable", () => {
  it("calls cleanup function once", async () => {
    const expected = [1, 2, 3];
    for await (const n of toAsyncIterable(ofIterable([1, 2, 3]))) {
      expect(n).toBe(expected.shift());
    }
    expect(expected.length).toBe(0);
  });
});
