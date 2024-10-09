import { describe, expect, it } from "@jest/globals";
import { Observable } from "./Observable";
import { ofIterable } from "./ofIterable";
import { SimpleSubscription } from "./SimpleSubscription";
import { startWith } from "./startWith";
import { Subject } from "./Subject";
import { take } from "./take";
import { expectStream } from "./tests/expectStream";
import { Valve } from "./tests/Valve";

describe("startWith operator", () => {
  it("start with first value before subscribing to source", async () => {
    const initial = 0;
    const received: number[] = [];
    const valve = new Valve();

    const subject = new Subject<number>();

    const sub = subject
      .pipe((_) => startWith(_, initial))
      .subscribe({
        next: (value) => {
          received.push(value);
          return valve.getNewPromise();
        },
      });

    await subject.next(1);
    expect(received).toEqual([initial]); // value pushed through subject is ignored, subject is not subscribed to yet

    valve.releaseForever(); // confirm first value digestion, subject subscription starts
    await Promise.resolve();

    await subject.next(1);
    expect(received).toEqual([initial, 1]); // value pushed through subject is no longer ignored

    sub.cancel();
  });

  it("never subscribes to the source if subscription is cancelled before 1st value digestion", async () => {
    const initial = 42;
    let sourceSubscribed = false;

    await expectStream(
      new Observable(() => {
        sourceSubscribed = true;
        return new SimpleSubscription();
      })
        .pipe((_) => startWith(_, initial))
        .pipe((_) => take(_, 1)),
      [42],
    );

    expect(sourceSubscribed).toBe(false);
  });

  it("initial value goes else before synchronous sources", async () => {
    await expectStream(
      ofIterable([1, 2, 3]).pipe((_) => startWith(_, 0)),
      [0, 1, 2, 3],
    );
  });
});
