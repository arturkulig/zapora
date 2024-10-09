import { describe, expect, it } from "@jest/globals";
import { getQueueingObserver } from "./queueingObserver";

describe("queueingObserver", () => {
  it("resolves only when messages are digested", async () => {
    const received = new Array<number>();
    const receivalRequest = new Array<{ value: number; ack: () => void }>();
    const observer = getQueueingObserver<{
      num: number;
      shouldHoldOff: boolean;
    }>({
      next: (value) => {
        received.push(value.num);
        if (!value.shouldHoldOff) {
          return;
        }
        return new Promise((resolve) => {
          receivalRequest.push({ value: value.num, ack: resolve });
        });
      },
      complete: () => {
        const value = -1;
        received.push(value);
        return new Promise((resolve) => {
          receivalRequest.push({ value, ack: resolve });
        });
      },
    });

    const valueA = { num: 1, shouldHoldOff: true };
    let valueAReceivingConfirmed = false;
    void observer.next?.(valueA)?.then(() => (valueAReceivingConfirmed = true));
    expect(valueAReceivingConfirmed).toBe(false);

    const valueB = { num: 2, shouldHoldOff: true };
    let valueBReceivingConfirmed = false;
    void observer.next?.(valueB)?.then(() => (valueBReceivingConfirmed = true));
    expect(valueBReceivingConfirmed).toBe(false);

    const valueC = { num: 3, shouldHoldOff: false };
    //                                      ^^^^^ value C does not hold digestion back
    let valueCReceivingConfirmed = false;
    void observer.next?.(valueC)?.then(() => (valueCReceivingConfirmed = true));
    expect(valueCReceivingConfirmed).toBe(false);

    const valueD = { num: 4, shouldHoldOff: true };
    let valueDReceivingConfirmed = false;
    void observer.next?.(valueD)?.then(() => (valueDReceivingConfirmed = true));
    expect(valueDReceivingConfirmed).toBe(false);

    let finalReceivingConfirmed = false;
    void observer.complete?.()?.then(() => (finalReceivingConfirmed = true));
    expect(finalReceivingConfirmed).toBe(false);

    expect(received).toEqual([valueA.num]);
    const requestA = receivalRequest.shift();
    expect(requestA?.value).toBe(valueA.num);
    requestA?.ack();
    await Promise.resolve();
    expect(valueAReceivingConfirmed).toBe(false);
    expect(valueBReceivingConfirmed).toBe(false);
    expect(valueCReceivingConfirmed).toBe(false);
    expect(valueDReceivingConfirmed).toBe(false);
    expect(finalReceivingConfirmed).toBe(false);

    expect(received).toEqual([valueA.num, valueB.num]);
    const requestB = receivalRequest.shift();
    expect(requestB?.value).toBe(valueB.num);
    requestB?.ack();
    await Promise.resolve();
    expect(valueAReceivingConfirmed).toBe(false);
    expect(valueBReceivingConfirmed).toBe(false);
    expect(valueCReceivingConfirmed).toBe(false);
    expect(valueDReceivingConfirmed).toBe(false);
    expect(finalReceivingConfirmed).toBe(false);

    expect(received).toEqual([valueA.num, valueB.num, valueC.num, valueD.num]);
    const requestD = receivalRequest.shift();
    expect(requestD?.value).toBe(valueD.num);
    requestD?.ack();
    await Promise.resolve();
    expect(valueAReceivingConfirmed).toBe(false);
    expect(valueBReceivingConfirmed).toBe(false);
    expect(valueCReceivingConfirmed).toBe(false);
    expect(valueDReceivingConfirmed).toBe(false);
    expect(finalReceivingConfirmed).toBe(false);

    expect(received).toEqual([
      valueA.num,
      valueB.num,
      valueC.num,
      valueD.num,
      -1,
    ]);
    const requestFinal = receivalRequest.shift();
    expect(requestFinal?.value).toBe(-1);
    requestFinal?.ack();

    let stop = false;
    const stopToken = setTimeout(() => {
      stop = true;
    }, 4000);

    while (!stop && valueAReceivingConfirmed === false) {
      await Promise.resolve();
    }
    expect(valueAReceivingConfirmed).toBe(true);
    expect(valueBReceivingConfirmed).toBe(false);
    expect(valueCReceivingConfirmed).toBe(false);
    expect(valueDReceivingConfirmed).toBe(false);
    expect(finalReceivingConfirmed).toBe(false);

    while (!stop && valueBReceivingConfirmed === false) {
      await Promise.resolve();
    }
    expect(valueBReceivingConfirmed).toBe(true);
    expect(valueCReceivingConfirmed).toBe(false);
    expect(valueDReceivingConfirmed).toBe(false);
    expect(finalReceivingConfirmed).toBe(false);

    while (!stop && valueCReceivingConfirmed === false) {
      await Promise.resolve();
    }
    expect(valueCReceivingConfirmed).toBe(true);
    expect(valueDReceivingConfirmed).toBe(false);
    expect(finalReceivingConfirmed).toBe(false);

    while (!stop && valueDReceivingConfirmed === false) {
      await Promise.resolve();
    }
    expect(valueDReceivingConfirmed).toBe(true);
    expect(finalReceivingConfirmed).toBe(false);

    expect(received).toEqual([
      valueA.num,
      valueB.num,
      valueC.num,
      valueD.num,
      -1,
    ]);
    while (!stop && finalReceivingConfirmed === false) {
      await Promise.resolve();
    }
    expect(finalReceivingConfirmed).toBe(true);

    clearTimeout(stopToken);
  });

  it("queues completions properly after messages", async () => {
    const received = new Array<number>();
    let completed = false;

    const observer = getQueueingObserver<number>({
      next: (value) => {
        received.push(value);
        return new Promise((resolve) => {
          setTimeout(resolve, Math.random() * 10 + 10);
        });
      },
      complete: () => {
        completed = true;
        expect(received).toEqual([1, 2, 3, 4, 5]);
        return new Promise((resolve) => {
          setTimeout(resolve, Math.random() * 10 + 10);
        });
      },
    });

    await observer.next?.(1);
    await observer.next?.(2);
    await observer.next?.(3);
    await observer.next?.(4);
    await observer.next?.(5);
    await observer.complete?.();

    expect(received).toEqual([1, 2, 3, 4, 5]);
    expect(completed).toBe(true);
  });

  it("queues completions properly w/o messages", async () => {
    let completed = false;

    const observer = getQueueingObserver<number>({
      complete: () => {
        completed = true;
        return new Promise((resolve) => {
          setTimeout(resolve, Math.random() * 10 + 10);
        });
      },
    });
    await observer.complete?.();

    expect(completed).toBe(true);
  });

  it("bypasses closed state", () => {
    let expectedClosed = false;
    const observer = getQueueingObserver({
      get closed() {
        return expectedClosed;
      },
    });
    expect(observer.closed).toBe(expectedClosed);
    expectedClosed = !expectedClosed;
    expect(observer.closed).toBe(expectedClosed);
  });

  it("trims to defined window (reject:newest)", async () => {
    const received = new Array<number>();
    const observer = getQueueingObserver<number>(
      {
        next: (value) => {
          received.push(value);
          return new Promise((resolve) => {
            setTimeout(resolve, Math.random() * 100 + 100);
          });
        },
      },
      {
        trim: {
          maxLength: 3,
          reject: "newest",
        },
      },
    );
    const allDone = Promise.all([
      Promise.resolve(observer.next?.(1)),
      Promise.resolve(observer.next?.(2)),
      Promise.resolve(observer.next?.(3)),
      Promise.resolve(observer.next?.(4)),
      Promise.resolve(observer.next?.(5)),
    ]);

    await allDone;

    expect(received).toEqual([1, 2, 3, 4]);
    //                        ^ immediately pushed
    //                           ^  ^  ^ buffered
  });

  it("trims to defined window (reject:oldest)", async () => {
    const received = new Array<number>();
    const observer = getQueueingObserver<number>(
      {
        next: (value) => {
          received.push(value);
          return new Promise((resolve) => {
            setTimeout(resolve, Math.random() * 100 + 100);
          });
        },
      },
      {
        trim: {
          maxLength: 3,
          reject: "oldest",
        },
      },
    );

    const valuePushConfirmed = new Array<number>();
    const allDone = Promise.all([
      Promise.resolve(observer.next?.(1)).then(() => {
        valuePushConfirmed.push(1);
      }),
      Promise.resolve(observer.next?.(2)).then(() => {
        valuePushConfirmed.push(2);
      }),
      Promise.resolve(observer.next?.(3)).then(() => {
        valuePushConfirmed.push(3);
      }),
      Promise.resolve(observer.next?.(4)).then(() => {
        valuePushConfirmed.push(4);
      }),
      Promise.resolve(observer.next?.(5)).then(() => {
        valuePushConfirmed.push(5);
      }),
    ]);

    await new Promise((resolve) => setTimeout(resolve, 0));
    /*
    even rejected value digestion doesnt get confirmed
    until all queued messages are digested
    when the observer is actually ready to receive more 
    */
    expect(valuePushConfirmed).toEqual([]);

    await allDone;

    expect(received).toEqual([1, 3, 4, 5]);
    //                        ^ immediately pushed
    //                           ^  ^  ^ buffered
  });

  it("despite queueing on, doesn't queue if it doesn't need to", () => {
    const received = new Array<number>();
    const observer = getQueueingObserver<number>(
      {
        next: (value) => {
          received.push(value);
        },
      },
      {
        trim: {
          maxLength: 3,
          reject: "oldest",
        },
      },
    );
    expect(observer.next?.(1)).toBeUndefined();
    expect(observer.next?.(2)).toBeUndefined();
    expect(observer.next?.(3)).toBeUndefined();
    expect(observer.next?.(4)).toBeUndefined();
    expect(observer.next?.(5)).toBeUndefined();

    expect(received).toEqual([1, 2, 3, 4, 5]);
  });
});
