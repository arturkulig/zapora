import { describe, expect, it, jest } from "@jest/globals";
import { delay } from "./delay";
import { Observable } from "./Observable";
import { Observer } from "./Observer";
import { ofIterable } from "./ofIterable";

describe("delay operator", () => {
  jest.useFakeTimers();

  it("delays incoming messages", async () => {
    let remote = null as null | Observer<number>;

    const received = new Array<number>();

    const source = new Observable<number>((observer) => {
      remote = observer;
      return {
        get closed() {
          return remote === observer;
        },
        cancel() {
          if (remote === observer) {
            remote = null;
          }
        },
      };
    });

    const sub = source
      .pipe((_) => delay(_, 100))
      .subscribe({
        next: (value) => {
          received.push(value);
        },
        complete: () => {
          received.push(-1);
        },
      });

    void remote?.next?.(1);
    expect(received).toEqual([]);
    await jest.runOnlyPendingTimersAsync();
    expect(received).toEqual([1]);

    void remote?.next?.(2);
    expect(received).toEqual([1]);
    await jest.runOnlyPendingTimersAsync();
    expect(received).toEqual([1, 2]);

    void remote?.complete?.();
    expect(received).toEqual([1, 2]);
    await jest.runOnlyPendingTimersAsync();
    expect(received).toEqual([1, 2, -1]);

    sub.cancel();
  });

  it("delays nexts only", async () => {
    const received = new Array<number>();

    const sub = ofIterable([1, 2, 3])
      .pipe((_) =>
        delay(_, 100, { selectively: { next: true, complete: false } }),
      )
      .subscribe({
        next: (value) => {
          received.push(value);
        },
        complete: () => {
          received.push(-1);
        },
      });

    expect(received).toEqual([]);

    await jest.runOnlyPendingTimersAsync();
    expect(received).toEqual([1]);

    await jest.runOnlyPendingTimersAsync();
    expect(received).toEqual([1, 2]);

    await jest.runOnlyPendingTimersAsync();
    expect(received).toEqual([1, 2, 3, -1]);

    sub.cancel();
  });

  it("delays complete only", async () => {
    const received = new Array<number>();

    const sub = ofIterable([1, 2, 3])
      .pipe((_) =>
        delay(_, 100, { selectively: { next: false, complete: true } }),
      )
      .subscribe({
        next: (value) => {
          received.push(value);
        },
        complete: () => {
          received.push(-1);
        },
      });

    expect(received).toEqual([1, 2, 3]);

    await jest.runOnlyPendingTimersAsync();
    expect(received).toEqual([1, 2, 3, -1]);

    sub.cancel();
  });

  it("passes on observers and subscriptions closed state", () => {
    let remote = null as null | Observer<number>;

    const source = new Observable<number>((observer) => {
      remote = observer;
      return {
        get closed() {
          return remote !== observer;
        },
        cancel() {
          if (remote === observer) {
            remote = null;
          }
        },
      };
    });

    let expectedObserverClosed = false;

    const sub = source
      .pipe((_) => delay(_, 100))
      .subscribe({
        get closed() {
          return expectedObserverClosed;
        },
      });

    expect(remote?.closed).toBe(expectedObserverClosed);
    expectedObserverClosed = !expectedObserverClosed;
    expect(remote?.closed).toBe(expectedObserverClosed);

    expect(sub.closed).toBe(false);
    sub.cancel();
    expect(sub.closed).toBe(true);
  });
});
