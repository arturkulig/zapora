import { timeout } from "./internal/timeout";
import { Observable } from "./Observable";
import { Subscribable } from "./Subscribable";
import { TidySubscription } from "./TidySubscription";

interface DelayOptions {
  selectively?: {
    next?: boolean;
    complete?: boolean;
  };
}
const noOptions: DelayOptions = {};

export function delay<T>(
  source: Subscribable<T>,
  periodMs: number,
  options?: DelayOptions,
): Observable<T> {
  return new Observable<T>((observer) => {
    const { next, complete } = observer;
    const nextBound = next?.bind(observer);
    const completeBound = complete?.bind(observer);

    const { selectively = { next: true, complete: true } } =
      options ?? noOptions;

    let cancelled = false;

    const sourceSub = source.subscribe({
      get closed() {
        return observer.closed;
      },
      ...(nextBound
        ? {
            next: selectively.next
              ? (value) =>
                  timeout(Math.max(0, periodMs)).then(() => {
                    if (!cancelled && !observer.closed) {
                      return nextBound(value);
                    }
                  })
              : nextBound,
          }
        : undefined),
      ...(completeBound
        ? {
            complete: selectively.complete
              ? () =>
                  timeout(Math.max(0, periodMs)).then(() => {
                    if (!cancelled && !observer.closed) {
                      return completeBound();
                    }
                  })
              : completeBound,
          }
        : undefined),
    });

    return new TidySubscription(() => {
      cancelled = true;
      if (!sourceSub.closed) {
        sourceSub.cancel();
      }
    });
  });
}
