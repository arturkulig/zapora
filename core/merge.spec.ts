import { describe, expect, it } from "@jest/globals";
import { Atom } from "./Atom";
import { timeout } from "./internal/timeout";
import { merge } from "./merge";
import { Observable } from "./Observable";
import { ofIterable } from "./ofIterable";
import { expectStream } from "./tests/expectStream";

describe("merge operator", () => {
  it("handles an Array of observable sources", async () => {
    const merged = merge([
      ofIterable(["A1", "A2", "A3"]), // A
      ofIterable(["B1", "B2", "B3"]), // B
      ofIterable(["C1", "C2", "C3"]), // C
    ]);

    await expectStream(merged, [
      "A1",
      "A2",
      "A3",
      "B1",
      "B2",
      "B3",
      "C1",
      "C2",
      "C3",
    ]);
  });

  it("handles a Set of observable sources", async () => {
    const merged = merge(
      new Set([
        ofIterable(["A1", "A2", "A3"]), // A
        ofIterable(["B1", "B2", "B3"]), // B
        ofIterable(["C1", "C2", "C3"]), // C
      ]),
    );

    await expectStream(merged, [
      "A1",
      "A2",
      "A3",
      "B1",
      "B2",
      "B3",
      "C1",
      "C2",
      "C3",
    ]);
  });

  it("queues messages from different sources together", async () => {
    await expectStream(
      new Observable<string>((observer) => {
        const { next, complete } = observer;

        return merge([
          ofIterable(["A1", "A2", "A3"]), // A
          ofIterable(["B1", "B2", "B3"]), // B
          ofIterable(["C1", "C2", "C3"]), // C
        ]).subscribe({
          get closed() {
            return observer.closed;
          },
          ...(next
            ? {
                next: (value) => {
                  if (value === "B1") {
                    return timeout(100).then(() => next.call(observer, value));
                  } else {
                    return next.call(observer, value);
                  }
                },
              }
            : undefined),

          complete: complete?.bind(observer),
        });
      }),
      ["A1", "A2", "A3", "B1", "C1", "B2", "C2", "C3", "B3"],
      //                              ^ Doesn't push C2 even though it's ready
      //                                because B1 still hasn't been confirmed to be digested
      //                                and so the observer is not ready to receive messages.
      //                                Pushes B2 first because it was queued earlier than C2.
      //
      //                                This is to prove that merge (really queueingObserver)
      //                                won't confirm digestion
      //                                if other sources are not processed yet
    );
  });

  it("becomes a State if at least one of the sources is a State", async () => {
    const merged = merge([
      ofIterable([1]),
      ofIterable([2, 3]),
      ofIterable([4]),
      new Atom(42),
    ]);

    expect(merged.value).toBe(42);

    await expectStream(merged, [1, 2, 3, 4], false, Promise.resolve());
  });

  it("completes immediately when no sources provided", async () => {
    const merged = merge([]);

    await expectStream(merged, []);
  });
});
