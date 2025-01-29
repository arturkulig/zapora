import { Subscribable } from "./Subscribable";
import { take } from "./take";

/**
 * Create a promise that resolves with a first message of the stream
 * or throws if the stream releases no messages
 */
export function toPromise<T>(source: Subscribable<T>) {
  return new Promise<T>((resolve, reject) => {
    let waiting = true;
    take(source, 1).subscribe({
      get closed() {
        return !waiting;
      },
      next: (value) => {
        if (!waiting) {
          return;
        }
        waiting = false;
        resolve(value);
      },
      complete: () => {
        if (!waiting) {
          return;
        }
        waiting = false;
        reject(new Error("Stream completed before releasing a message"));
      },
    });
  });
}
