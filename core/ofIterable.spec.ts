import { describe, expect, it } from "@jest/globals";
import { timeout } from "./internal/timeout";
import { Observer } from "./Observer";
import { ofIterable } from "./ofIterable";
import { Valve } from "./tests/Valve";

describe("ofIterable", () => {
  it("can use Arrays", () => {
    const intended = [1, 2, 3, 4];
    const received = new Array<number>();
    let completed = false;
    const sub = ofIterable(intended).subscribe({
      next: (value) => {
        received.push(value);
      },
      complete: () => {
        completed = true;
      },
    });

    expect(received).toEqual(intended);
    expect(completed).toBe(true);

    sub.cancel();
  });

  it("can use Sets", () => {
    const intended = new Set([1, 4, 2, 3]);
    const received = new Set<number>();
    let completed = false;
    const sub = ofIterable(intended).subscribe({
      next: (value) => {
        received.add(value);
      },
      complete: () => {
        completed = true;
      },
    });

    expect(received).toEqual(intended);
    expect(completed).toBe(true);

    sub.cancel();
  });

  it("closes iteration on partial consumption (subscription closed)", async () => {
    const intended = [1, 2, 3, 4];
    const received = new Array<number>();

    let iteratorReturnCalled = false;
    const valve = new Valve();

    const sub = ofIterable<number>({
      [Symbol.iterator]() {
        const iterator = intended[Symbol.iterator]();
        return {
          next: () => iterator.next(),
          return: () => {
            iteratorReturnCalled = true;
            iterator.return?.();
            return { done: true, value: undefined };
          },
        };
      },
    }).subscribe({
      next: (value) => {
        received.push(value);
        switch (value) {
          case 1:
            // next event loop iteration so that `sub` can be assigned
            // this is also the only way that ofIterable consumption
            // may be interrupted by cancelling the subscription
            return Promise.resolve();
          case 2:
            return valve.getNewPromise();
          default:
            return;
        }
      },
    });

    await timeout();

    expect(received).toEqual([1, 2]);
    expect(sub.closed).toBe(false);
    sub.cancel();

    // confirm digestion of "2"
    valve.releasePending();
    await timeout();

    expect(received).toEqual([1, 2]);
    expect(iteratorReturnCalled).toBe(true);
    expect(sub.closed).toBe(true);

    sub.cancel();
  });

  it("closes iteration on partial consumption (observer closed)", () => {
    let completed = false;
    const received = new Array<number>();

    const observer: Observer<number> = {
      closed: false,
      next: (value) => {
        received.push(value);
        if (value === 2) {
          observer.closed = true;
        }
      },
      complete: () => {
        completed = true;
      },
    };

    const sub = ofIterable([1, 2, 3, 4]).subscribe(observer);

    expect(completed).toBe(false);
    expect(observer.closed).toBe(true);
    expect(sub.closed).toBe(false);
    expect(received).toEqual([1, 2]);

    sub.cancel();
  });
});
