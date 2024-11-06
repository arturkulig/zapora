import { Observer, ReceivedReceit } from "./Observer";
import { then } from "./then";

type ValueMessage<T> = { done: false; value: T };
type CompleteMessage = { done: true };
type Message<T> = ValueMessage<T> | CompleteMessage;
type ValueEnvelope<T> = ValueMessage<T> & { ack: () => void };
type CompleteEnvelope = CompleteMessage & { ack: () => void };
type Envelope<T> = ValueEnvelope<T> | CompleteEnvelope;

export interface QueueOptions {
  trim?: { reject: "oldest" | "newest"; maxLength: number };
}

export function getQueueingObserver<T>(
  target: Observer<T>,
  options?: QueueOptions,
): Observer<T> {
  const { next, complete } = target;

  const envelopes = new Array<Envelope<T>>();
  let valves = new Array<() => void>();

  return {
    get closed() {
      return target.closed;
    },
    ...(next
      ? {
          next: (value) => considerSending({ done: false, value }),
        }
      : undefined),
    ...(complete
      ? { complete: () => considerSending({ done: true }) }
      : undefined),
  };

  function considerSending(message: Message<T>) {
    if (valves.length) {
      return new Promise<void>((resolve) => {
        envelopes.push(
          message.done
            ? ({ done: true, ack: resolve } as const)
            : ({ done: false, value: message.value, ack: resolve } as const),
        );
        if (
          options &&
          options.trim &&
          envelopes.length > options.trim.maxLength
        ) {
          switch (options.trim.reject) {
            case "oldest":
              valves = valves.concat(
                envelopes
                  .splice(0, envelopes.length - options.trim.maxLength)
                  .map((envelope) => envelope.ack),
              );
              break;

            case "newest":
              valves = valves.concat(
                envelopes
                  .splice(options.trim.maxLength)
                  .map((envelope) => envelope.ack),
              );
              break;
          }
        }
      });
    }

    return serviceSent(
      message.done ? complete?.call(target) : next?.call(target, message.value),
    );
  }

  function serviceSent(receit: ReceivedReceit) {
    if (receit === undefined && valves.length === 0 && envelopes.length === 0) {
      return;
    }
    return new Promise<void>((resolve) => {
      valves.push(resolve);
      void then(receit, release);
    });
  }

  function release() {
    const nextMessage = envelopes.shift();

    if (nextMessage) {
      return sendNext(nextMessage);
    }

    const valve = valves.shift();
    if (valve === undefined) {
      return;
    }
    queueMicrotask(release);
    valve();
  }

  function sendNext(message: Envelope<T>) {
    const receit = message.done
      ? complete?.call(target)
      : next?.call(target, message.value);

    valves.push(message.ack);

    void then(receit, release);
  }
}
