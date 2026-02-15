import { describe, expect, it } from "@jest/globals";
import { timeout } from "./internal/timeout";
import { Observer } from "./Observer";
import { ofAsyncIterable } from "./ofAsyncIterable";
import { exhaustTimers } from "./tests/exhaustTimers";
import { expectStream } from "./tests/expectStream";
import { Valve } from "./tests/Valve";

async function* spread(source: Iterable<number>) {
  for (const n of source) {
    await timeout(n * 10);
    yield n;
  }
}

function regenerator<T, ARGS extends any[]>(
  source: (...args: ARGS) => AsyncGenerator<T>,
  ...args: ARGS
): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      return source(...args)[Symbol.asyncIterator]();
    },
  };
}

describe("ofAsyncIterable", () => {
  it("can source AsyncIterables", async () => {
    const intended = [1, 2, 3, 4];

    await expectStream(
      ofAsyncIterable<number, any, any>(regenerator(spread, intended)),
      intended,
      true,
    );
  });

  it("closes iteration on partial consumption (subscription closed)", async () => {
    const intended = [1, 2, 3, 4];
    const received = new Array<number>();

    let iteratorReturnCalled = false;
    const valve = new Valve();

    const sub = ofAsyncIterable<number>({
      [Symbol.asyncIterator]() {
        const iterator = intended[Symbol.iterator]();
        return {
          next: () => Promise.resolve(iterator.next()),
          return: () => {
            iteratorReturnCalled = true;
            iterator.return?.();
            return Promise.resolve({ done: true, value: undefined });
          },
        };
      },
    }).subscribe({
      next: (value) => {
        received.push(value);
        switch (value) {
          case 1:
            // next event loop iteration so that `sub` can be assigned
            // this is also the only way that ofAsyncIterable consumption
            // may be interrupted by cancelling the subscription
            return Promise.resolve();
          case 2:
            return valve.getNewPromise();
          default:
            return;
        }
      },
    });

    await exhaustTimers();

    expect(received).toEqual([1, 2]);
    expect(sub.closed).toBe(false);
    sub.cancel();

    // confirm digestion of "2"
    valve.releasePending();
    await exhaustTimers();

    expect(received).toEqual([1, 2]);
    expect(iteratorReturnCalled).toBe(true);
    expect(sub.closed).toBe(true);

    sub.cancel();
  });

  it("closes iteration on partial consumption (observer closed)", async () => {
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

    const intended = [1, 2, 3, 4];
    const sub = ofAsyncIterable(regenerator(spread, intended)).subscribe(
      observer,
    );

    await exhaustTimers();

    expect(completed).toBe(false);
    expect(observer.closed).toBe(true);
    expect(sub.closed).toBe(false);
    expect(received).toEqual([1, 2]);

    sub.cancel();
  });
});
