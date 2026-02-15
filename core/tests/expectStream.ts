import { expect, jest } from "@jest/globals";
import { Observable } from "../Observable";

jest.useFakeTimers();

export async function expectStream<T>(
  stream: Observable<T>,
  expectedReceivedValues: T[],
  completionExpected: boolean | { full: boolean; partial: boolean } = true,
  testCompleteRelease?: Promise<void>,
) {
  let tick = true;

  try {
    const completeResult = {
      received: new Array<T>(),
      completed: false,
    };
    type TestResult = typeof completeResult;
    const partialResult: TestResult = {
      received: new Array<T>(),
      completed: false,
    };

    const completeObserver = {
      get closed() {
        return completeResult.completed;
      },
      observerContext: "right",
      next(value: T) {
        expect(this.observerContext).toBe("right");
        if (completeResult.completed) {
          throw new Error("Should have not receive messages after 'completed'");
        }
        completeResult.received.push(value);
      },
      complete() {
        expect(this.observerContext).toBe("right");
        if (completeResult.completed) {
          throw new Error("Should have not receive messages after 'completed'");
        }
        completeResult.completed = true;
      },
    };

    const subComplete = stream.subscribe(completeObserver);

    const subJustNext = stream.subscribe({
      next: (value) => {
        partialResult.received.push(value);
      },
    });

    const subJustCompleted = stream.subscribe({
      get closed() {
        return partialResult.completed;
      },
      complete: () => {
        partialResult.completed = true;
      },
    });

    const subNull = stream.subscribe({});

    const observerClosedNext = jest.fn<(value: T) => void>();
    const observerClosedComplete = jest.fn<() => void>();
    const subObserverClosed = stream.subscribe({
      get closed() {
        return true;
      },
      next: observerClosedNext,
      complete: observerClosedComplete,
    });

    let forceCompletion = false;
    const forceCompletionMarkingToken = setTimeout(() => {
      forceCompletion = true;
    }, 4000);

    void (async () => {
      while (tick) {
        await (jest.getTimerCount()
          ? jest.advanceTimersByTimeAsync(1)
          : Promise.resolve());
      }
    })();

    if (testCompleteRelease) {
      await testCompleteRelease;
    } else {
      while (
        !forceCompletion &&
        (!completeResult.completed ||
          !partialResult.completed ||
          completeResult.received.length !== partialResult.received.length)
      ) {
        await new Promise((r) => setTimeout(r, 10));
      }
      await new Promise((r) => setTimeout(r, 10));
    }

    clearTimeout(forceCompletionMarkingToken);
    if (forceCompletion) {
      console.warn("Forced completion");
    }

    expect(completeResult).toEqual({
      received: expectedReceivedValues,
      completed:
        typeof completionExpected === "boolean"
          ? completionExpected
          : completionExpected.full,
    } satisfies TestResult);

    expect(partialResult).toEqual({
      received: expectedReceivedValues,
      completed:
        typeof completionExpected === "boolean"
          ? completionExpected
          : completionExpected.partial,
    } satisfies TestResult);

    expect(observerClosedNext).not.toBeCalled();
    expect(observerClosedComplete).not.toBeCalled();

    expect(subComplete.closed).toBe(false);
    expect(subJustNext.closed).toBe(false);
    expect(subJustCompleted.closed).toBe(false);
    expect(subNull.closed).toBe(false);
    expect(subObserverClosed.closed).toBe(false);

    subComplete.cancel();
    subJustNext.cancel();
    subJustCompleted.cancel();
    subNull.cancel();
    subObserverClosed.cancel();

    expect(subComplete.closed).toBe(true);
    expect(subJustNext.closed).toBe(true);
    expect(subJustCompleted.closed).toBe(true);
    expect(subNull.closed).toBe(true);
    expect(subObserverClosed.closed).toBe(true);

    expect(() => {
      subComplete.cancel();
    }).not.toThrow();
    expect(() => {
      subJustNext.cancel();
    }).not.toThrow();
    expect(() => {
      subJustCompleted.cancel();
    }).not.toThrow();
    expect(() => {
      subNull.cancel();
    }).not.toThrow();
    expect(() => {
      subObserverClosed.cancel();
    }).not.toThrow();

    expect(forceCompletion).toBe(false);
  } finally {
    tick = false;
  }
}
