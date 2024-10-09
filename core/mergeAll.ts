import { Observable } from "./Observable";
import { getQueueingObserver } from "./queueingObserver";
import { Subscribable } from "./Subscribable";
import { Subscription } from "./Subscription";
import { TidySubscription } from "./TidySubscription";

export function mergeAll<T>(
  source: Subscribable<Subscribable<T>>,
  concurrentSubscriptionsLimit?: number,
): Observable<T> {
  return new Observable<T>((originalObserver) => {
    const queueingObserver = getQueueingObserver(originalObserver);
    const { next, complete } = queueingObserver;

    let maxSubstreamsRelease: null | (() => void) = null;
    const emitedSubscriptionList = new Array<Subscription>();

    let sourceCompleteRelease: null | (() => void) = null;
    const substreamsLiveTokens = new Set<symbol>();

    const sourceSubscription = source.subscribe({
      get closed() {
        return sourceCompleteRelease != null || queueingObserver.closed;
      },
      next: (substream) => {
        const substreamLiveToken = Symbol("SubstreamLiveToken");
        substreamsLiveTokens.add(substreamLiveToken);
        emitedSubscriptionList.push(
          substream.subscribe({
            get closed() {
              return queueingObserver.closed;
            },
            ...(next
              ? {
                  next: next,
                }
              : undefined),
            complete: () => {
              substreamsLiveTokens.delete(substreamLiveToken);
              if (substreamsLiveTokens.size > 0 && maxSubstreamsRelease) {
                maxSubstreamsRelease();
              }
              if (substreamsLiveTokens.size === 0 && sourceCompleteRelease) {
                sourceCompleteRelease();
              }
            },
          }),
        );

        if (
          concurrentSubscriptionsLimit != null &&
          substreamsLiveTokens.size === concurrentSubscriptionsLimit
        ) {
          return new Promise<void>((resolve) => {
            maxSubstreamsRelease = resolve;
          });
        }

        return;
      },
      complete: () => {
        if (substreamsLiveTokens.size === 0) {
          if (complete) {
            return complete();
          }
        }

        return new Promise<void>((resolve) => {
          sourceCompleteRelease = resolve;
        }).then(() => {
          if (complete) {
            return complete();
          }
        });
      },
    });

    return new TidySubscription(() => {
      if (!sourceSubscription.closed) sourceSubscription.cancel();
      for (const emitedSubscription of emitedSubscriptionList.splice(0)) {
        if (!emitedSubscription.closed) {
          emitedSubscription.cancel();
        }
      }
    });
  });
}
