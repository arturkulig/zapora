import { describe, expect, it } from "@jest/globals";
import { BroadcastObserver } from "./BroadcastObserver";

describe("BroadcastObserver", () => {
  it("is open without subscriptions", () => {
    expect(new BroadcastObserver<void>().closed).toBe(false);
  });

  it("returns immediately if there are no listeners", () => {
    expect(new BroadcastObserver<void>().next()).toBeUndefined();
  });

  it("returns immediately if digestion was immediate", () => {
    const broadcast = new BroadcastObserver<void>();
    const subA = broadcast.add({ next: () => {} });
    const subB = broadcast.add({ next: () => {} });
    const subC = broadcast.add({ next: () => {} });

    expect(broadcast.next()).toBeUndefined();

    subA.cancel();
    subB.cancel();
    subC.cancel();
  });

  it("returns a Promise if digestion was async", async () => {
    const broadcast = new BroadcastObserver<void>();
    let release = null as null | (() => void);
    const subA = broadcast.add({ next: () => {} });
    const subB = broadcast.add({
      next: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    });
    const subC = broadcast.add({ next: () => {} });

    const receit = broadcast.next();

    expect(receit).toBeDefined();
    if (!receit) {
      return;
    }
    expect(release).toBeDefined();
    if (!release) {
      return;
    }

    let digested = false;
    const digestionConfirmed = receit.then(() => {
      digested = true;
    });

    await Promise.resolve();
    expect(digested).toBe(false);

    release();
    await digestionConfirmed;
    expect(digested).toBe(true);

    subA.cancel();
    subB.cancel();
    subC.cancel();
  });

  it("stops transmission after subscription was cancelled", async () => {
    const broadcast = new BroadcastObserver<number>();
    const received: number[] = [];
    const sub = broadcast.add({
      next: (value) => {
        received.push(value);
      },
    });
    await broadcast.next(1);
    await broadcast.next(2);
    sub.cancel();
    await broadcast.next(3);
    expect(received).toEqual([1, 2]);
  });

  it("sheds listeners after 'complete' signal", async () => {
    const broadcast = new BroadcastObserver<number>();
    const received: number[] = [];
    const sub = broadcast.add({
      next: (value) => {
        received.push(value);
      },
      complete: () => {
        received.push(-1);
      },
    });

    await broadcast.next(1);
    await broadcast.next(2);
    await broadcast.complete();
    await broadcast.next(2);
    expect(received).toEqual([1, 2, -1]);

    sub.cancel();
  });
});
