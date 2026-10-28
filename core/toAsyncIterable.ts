import { Subscribable } from "./Subscribable";
import { scheduleImmediately } from "./internal/scheduleImmediately";

export function toAsyncIterable<T>(source: Subscribable<T>): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<T, void, void> {
      let liveRequest: ((value: IteratorResult<T, void>) => void) | null = null;
      const queue: { result: IteratorResult<T, void>; ack: () => void }[] = [];

      let subDMZAvailable = false;
      let sourceCompleted = false;
      let targetFinished = false;
      const sub = source.subscribe({
        get closed() {
          return sourceCompleted || targetFinished;
        },

        next: (value) => {
          if (sourceCompleted) {
            return;
          }

          if (liveRequest) {
            const currentRequest = liveRequest;
            liveRequest = null;
            currentRequest({ done: false, value });
            return;
          }

          return new Promise((r) => {
            queue.push({ result: { done: false, value }, ack: r });
          });
        },

        complete: () => {
          if (sourceCompleted) {
            return;
          }

          if (subDMZAvailable) {
            if (!sub.closed) {
              sub.cancel();
            }
          }
          sourceCompleted = true;

          if (liveRequest) {
            const currentRequest = liveRequest;
            liveRequest = null;
            currentRequest({ done: true, value: undefined });
            return;
          }

          return new Promise((r) => {
            queue.push({ result: { done: true, value: undefined }, ack: r });
          });
        },
      });

      if (sourceCompleted) {
        if (!sub.closed) {
          sub.cancel();
        }
      }

      subDMZAvailable = true;

      return {
        next: function (
          ...[_value]: [] | [void]
        ): Promise<IteratorResult<T, void>> {
          if (queue.length) {
            const item = queue.shift()!;
            const result = Promise.resolve(item.result);
            scheduleImmediately(item.ack);
            return result;
          }
          return new Promise((r) => {
            liveRequest = r;
          });
        },
        throw: subCleanup,
        return: subCleanup,
      };

      function subCleanup(this: void): Promise<IteratorResult<T, void>> {
        targetFinished = true;

        if (!sub.closed) {
          sub.cancel();
        }

        for (const item of queue.splice(0)) {
          void item.ack();
        }

        return Promise.resolve({ done: true, value: undefined });
      }
    },
  };
}
