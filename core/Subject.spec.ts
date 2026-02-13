import { describe, expect, it } from "@jest/globals";
import { Observer } from "./Observer";
import { Subject } from "./Subject";

describe("subject operator", () => {
  it("broadcasts messages to all subscriptions", async () => {
    const result = new Array<number>();
    const topic = new Subject<number>();
    const observer: Observer<number> = {
      next: (value) => {
        result.push(value);
      },
      complete: () => {
        result.push(-1);
      },
    };

    // no subs
    await topic.next(6);
    expect(result).toEqual([]);

    const subA = topic.subscribe(observer);
    expect(result).toEqual([]);

    // one sub
    await topic.next(6);
    expect(result).toEqual([6]);

    const subB = topic.subscribe(observer);
    expect(result).toEqual([6]);

    // two subs
    await topic.next(3);
    expect(result).toEqual([6, 3, 3]);

    subA.cancel();
    await topic.complete();
    expect(result).toEqual([6, 3, 3, -1]);

    // no subs
    subB.cancel();
    await topic.next(3);
    await topic.complete();
    expect(result).toEqual([6, 3, 3, -1]);
  });

  it("as an observer is always open", () => {
    const subject = new Subject<number>();
    expect(subject.closed).toBe(false);
  });

  it("reports active subscription", () => {
    const topic = new Subject<number>();
    const observer: Observer<number> = {};

    const subA = topic.subscribe(observer);
    expect(subA.closed).toBe(false);
    subA.cancel();
    expect(subA.closed).toBe(true);
  });

  for (const mode of ["next", "complete"] as const) {
    it(`reports ${mode} digestion if observers are async`, async () => {
      let isReleased = false;
      let release: (() => void) | null = null;
      const topic = new Subject<number>();

      const nullObserver: Observer<number> = {};
      const synchronousObserver: Observer<number> = { next: () => {} };
      const asynchronousObserver: Observer<number> = {
        [mode]: () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      };

      topic.subscribe(nullObserver);
      topic.subscribe(synchronousObserver);
      topic.subscribe(asynchronousObserver);

      const confirmed = {
        next: () => topic.next(6),
        complete: () => topic.complete(),
      }[mode]();
      expect(release).toBeDefined();
      expect(isReleased).toBe(false);
      void confirmed?.then(() => {
        isReleased = true;
      });
      setTimeout(() => release?.(), 0);
      await confirmed;
      expect(isReleased).toBe(true);
    });
  }
});
