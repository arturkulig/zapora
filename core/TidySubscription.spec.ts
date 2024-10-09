import { describe, expect, it } from "@jest/globals";
import { TidySubscription } from "./TidySubscription";

describe("TidySubscription", () => {
  it("calls cleanup function once", () => {
    let called = 0;
    const sub = new TidySubscription(() => {
      called++;
    });

    expect(called).toBe(0);
    expect(sub.closed).toBe(false);
    sub.cancel();
    expect(called).toBe(1);
    expect(sub.closed).toBe(true);
    sub.cancel();
    expect(called).toBe(1);
    expect(sub.closed).toBe(true);
  });

  it("doesn't close upon clean up function throwing", () => {
    const sub = new TidySubscription(() => {
      throw new Error();
    });
    expect(sub.closed).toBe(false);
    expect(() => {
      sub.cancel();
    }).toThrow();
    expect(sub.closed).toBe(false);
  });
});
