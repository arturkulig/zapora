import { describe, expect, it } from "@jest/globals";
import { Observable } from "./Observable";
import { Observer } from "./Observer";
import { SimpleSubscription } from "./SimpleSubscription";

describe("Observable", () => {
  describe("subscriptions", () => {
    it("are possible", () => {
      let result = 0;
      const sub = new Observable<number>((observer) => {
        void observer.next?.(1);
        return new SimpleSubscription();
      }).subscribe({
        next(value) {
          result = value;
        },
      });

      expect(result).toBe(1);

      sub.cancel();
    });

    it("can report digestion asynchronously", async () => {
      let result = 0;
      let remote = null as Observer<number> | null;

      const sub = new Observable<number>((observer) => {
        remote = observer;
        return new SimpleSubscription();
      }).subscribe({
        async next(value) {
          await Promise.resolve();
          result = value;
        },
      });

      const confirmation = remote?.next?.(1);
      expect(result).toBe(0);
      await confirmation;
      expect(result).toBe(1);

      sub.cancel();
    });

    it("are independent", async () => {
      let result = 0;
      const submittedList = new Set<{ observer: Observer<number> }>();

      const topic = new Observable<number>((observer) => {
        const submission = { observer };
        submittedList.add(submission);
        return {
          get closed() {
            return !submittedList.has(submission);
          },
          cancel() {
            submittedList.delete(submission);
          },
        };
      });

      const reporter: Observer<number> = {
        next: (value) => {
          result += value;
        },
      };

      const subA = topic.subscribe(reporter);
      const subB = topic.subscribe(reporter);

      async function pushEverywhere(value: number) {
        await Promise.allSettled(
          [...submittedList].map((submitted) =>
            submitted.observer.next?.(value),
          ),
        );
      }

      await pushEverywhere(1);
      expect(result).toBe(2);

      subB.cancel();
      expect(subB.closed).toBe(true);

      await pushEverywhere(2);
      expect(result).toBe(4);

      subA.cancel();
      expect(subA.closed).toBe(true);

      await pushEverywhere(3);
      expect(result).toBe(4);
    });
  });

  it("can be piped", () => {
    let result = 0;
    const pushedValue = 1;
    const intendedIncrement = 2;

    const increaseValueMappingOperator = (
      observable: Observable<number>,
      increment: number,
    ) =>
      new Observable<number>((observer) =>
        observable.subscribe({
          next: (value) => observer.next?.(value + increment),
        }),
      );

    const derivative = new Observable<number>((observer) => {
      void observer.next?.(pushedValue);
      return new SimpleSubscription();
    }).pipe((_) => increaseValueMappingOperator(_, intendedIncrement));

    expect(result).toBe(0);
    const sub = derivative.subscribe({
      next: (value) => {
        result = value;
      },
    });
    expect(result).toBe(pushedValue + intendedIncrement);

    sub.cancel();
  });
});
