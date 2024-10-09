import { describe, expect, it } from "@jest/globals";
import { Atom } from "./Atom";

describe("Atom", () => {
  it("remembers last value pushed", async () => {
    let check = 0;
    const atom = new Atom(0);

    expect(atom.value).toBe(0);

    const sub = atom.subscribe({
      next: (value) => {
        check = value;
      },
    });
    expect(atom.value).toBe(0);

    await atom.next(1);

    expect(check).toBe(1);
    expect(atom.value).toBe(1);

    sub.cancel();
  });

  it("as an observer indicates open subscriptions", () => {
    const state = new Atom(0);

    expect(state.closed).toBe(true);

    let intendedClosed = false;

    state.subscribe({
      get closed() {
        return intendedClosed;
      },
      next: () => {},
    });

    expect(state.closed).toBe(intendedClosed);
    intendedClosed = !intendedClosed;
    expect(state.closed).toBe(intendedClosed);
  });

  it("passes on values and completes", async () => {
    const result = new Array<string>();

    const atom = new Atom(0);
    const sub = atom.subscribe({
      next: (value) => {
        result.push(`next${value}`);
      },
      complete: () => {
        result.push("complete");
      },
    });

    await atom.next(4);
    expect(result).toEqual(["next4"]);

    await atom.next(5);
    expect(result).toEqual(["next4", "next5"]);

    await atom.complete();
    expect(result).toEqual(["next4", "next5", "complete"]);

    sub.cancel();
  });

  it("skips updates when observer holds up", async () => {
    const result = new Array<string>();
    const releases = new Array<() => void>();

    const atom = new Atom(0);
    const sub = atom.subscribe({
      next: (value) => {
        result.push(`next${value}`);
        return new Promise((resolve) => {
          releases.push(resolve);
        });
      },
      complete: () => {
        result.push("complete");
        return new Promise((resolve) => {
          releases.push(resolve);
        });
      },
    });

    const confirmation1 = atom.next(1);
    const confirmation2 = atom.next(2);
    const confirmation3 = atom.next(3);

    expect(confirmation1).toBeDefined();
    expect(confirmation2).toBeDefined();
    expect(confirmation3).toBeDefined();

    expect(result).toEqual(["next1"]);

    releases.forEach((release) => release());
    await Promise.resolve();

    expect(result).toEqual(["next1", "next3"]);

    sub.cancel();
  });
});
