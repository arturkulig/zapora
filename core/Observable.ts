import { Producer } from "./Producer";
import { Subscribable } from "./Subscribable";

/**
 * Represents a lazy stream of values that can be observed by observers.
 *
 * An `Observable` wraps a {@link Producer} function, which is invoked each
 * time `subscribe` is called. The producer is responsible for emitting
 * values to the observer and returns a `Subscription` that can be used to
 * cancel the stream.
 *
 * The observer's `next` and `complete` handlers are optional and may be
 * asynchronous: they may return a promise, which producers can await before
 * continuing. Producers should check `subscription.closed` before calling
 * either handler and stop emitting as soon as it is `true`.
 *
 * @typeParam T - The type of values emitted by this observable.
 *
 * @example
 * ```ts
 * const numbers = new Observable<number>((observer) => {
 *   const subscription = {
 *     closed: false,
 *     cancel: () => {
 *       subscription.closed = true;
 *     },
 *   };
 *
 *   (async () => {
 *     if (subscription.closed) return;
 *     await observer.next?.(1);
 *
 *     if (subscription.closed) return;
 *     await observer.next?.(2);
 *
 *     if (subscription.closed) return;
 *     await observer.complete?.();
 *   })();
 *
 *   return subscription;
 * });
 * ```
 */
export class Observable<T> implements Subscribable<T> {
  /**
   * Creates a new `Observable`.
   *
   * @param subscribe - The producer function that defines how values are
   * emitted to an observer and returns a `Subscription` for cancelling the
   * stream. It is exposed publicly as the `subscribe` method of the
   * observable.
   */
  constructor(public subscribe: Producer<T>) {}

  /**
   * Passes this observable through a transform function and returns the result.
   *
   * This enables fluent, functional-style composition of operators. The
   * transform may return a new `Observable` or any other type.
   *
   * @typeParam R - The type of the value returned by the transform.
   * @param transform - A function that receives this observable and returns
   * a result of type `R`.
   * @returns The value produced by applying `transform` to this observable.
   *
   * @example
   * ```ts
   * const doubled = numbers.pipe(map((n) => n * 2));
   * ```
   */
  pipe<R>(transform: PipeTransform<typeof this, R>): R {
    return transform(this);
  }
}

/**
 * A function that takes a source value and transforms it into a result.
 *
 * Commonly used to define operators for {@link Observable.pipe}. The
 * `this: void` annotation ensures the function does not depend on a
 * `this` context when invoked.
 *
 * @typeParam T - The type of the source value passed to the transform.
 * @typeParam R - The type of the value returned by the transform.
 *
 * @param source - The value to be transformed (typically an `Observable`).
 * @returns The transformed result.
 */
export interface PipeTransform<T, R> {
  (this: void, source: T): R;
}
