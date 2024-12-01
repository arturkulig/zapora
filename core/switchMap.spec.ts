import { describe, expect, it } from "@jest/globals";
import { Observable } from "./Observable";
import { SimpleSubscription } from "./SimpleSubscription";
import { delay } from "./delay";
import { ofIterable } from "./ofIterable";
import { switchMap } from "./switchMap";
import { expectStream } from "./tests/expectStream";
import { then } from "./then";

describe("switchMap operator", () => {
  it("switches between sources", async () => {
    const pushed = [10, 40, 100, -50];

    await expectStream(
      ofIterable(pushed)
        .pipe((_) => delay(_, 200))
        .pipe((_) => switchMap(_, echo)),
      [
        ...Array.from(new Array(10), () => 10),
        ...Array.from(new Array(4), () => 40),
        ...Array.from(new Array(1), () => 100),
        ...Array.from(new Array(1), () => -50),
      ],
    );
  });

  it("skips streams if necessary", async () => {
    const pushed = [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36];
    const signedUpTo: number[] = [];

    await expectStream(
      ofIterable(pushed)
        .pipe((_) => delay(_, 30))
        .pipe((_) =>
          switchMap(
            _,
            (n) =>
              new Observable<number>((observer) => {
                signedUpTo.push(n);

                const sub = new SimpleSubscription();

                // push n and close
                if (!sub.closed && !observer.closed) {
                  void then(void observer.next?.(n), () => {
                    if (!sub.closed && !observer.closed) {
                      void observer.complete?.();
                    }
                  });
                }

                return sub;
              }),
          ),
        )
        .pipe((_) => delay(_, 100)),
      [25, 28, 31, 34, 36],
    );

    expect(signedUpTo).toEqual(
      [25, 28, 31, 34, 36]
        // double signups as expectStream tests provided stream twice
        .flatMap((n) => [n, n]),
    );
  });

  /**
   * Creates a stream of a provided number
   * repeated as many times as the value itself
   * delayed by the amount that is again the value.
   *
   * The bigger the value,
   * the longer the stream,
   * the longer the delays between messages.
   */
  function echo(value: number) {
    const track = replicateBy(value, Math.max(1, value));
    const track$ = ofIterable(track);
    return track$.pipe((_) => delay(_, value));
  }

  /** replicate value in an array by an amount */
  function replicateBy<T>(value: T, amount: number): T[] {
    return Array.from(new Array(amount), () => value);
  }
});
