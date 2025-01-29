import {
  BidirectionalObservable,
  Observable,
  Subject,
  TidySubscription,
} from "@zapora/core";

export interface BidiWsOptions {
  Constructor?: WebSocketEligibleConstructor;
  url: string | URL;
  protocols?: string | string[];
  timeout: number;
}

export interface WebSocketEligibleConstructor {
  new (
    url: string | URL,
    protocols?: string | string[],
  ): WebSocketEligibleInstance;
}

export interface BidiWsConnectionOptions {
  socket: WebSocketEligibleInstance;
  timeout: number;
}

export type WebSocketEligibleInstance = Pick<
  WebSocket,
  | "binaryType"
  | "bufferedAmount"
  | "readyState"
  | "send"
  | "close"
  | "addEventListener"
  | "removeEventListener"
>;

export type WebSocketDuplexMessage = string | ArrayBufferLike;

export class PersistentWebSocketClient extends BidirectionalObservable<
  WebSocketDuplexMessage,
  WebSocketDuplexMessage
> {
  constructor(options: BidiWsOptions) {
    let closedOnDemand = false;
    const intoSubject = new Subject<WebSocketDuplexMessage>();
    let wsClient = getNewClient();

    function getNewClient() {
      const newClient = new WebSocketClient(options);
      newClient.subscribe({
        get closed() {
          return intoSubject.closed;
        },
        next: (value) => {
          if (!intoSubject.closed) {
            return intoSubject.next(value);
          }
        },
        complete: () => {
          if (closedOnDemand) {
            return;
          }
          wsClient = getNewClient();
        },
      });
      return newClient;
    }

    super(
      new Observable<WebSocketDuplexMessage>((observer) => {
        const innerSub = intoSubject.subscribe({
          get closed() {
            return observer.closed;
          },
          next: (value) => observer.next?.(value),
        });
        return new TidySubscription(() => {
          if (!innerSub.closed) {
            innerSub.cancel();
          }
        });
      }),

      {
        get closed() {
          return false;
        },
        next: (value) => wsClient.next(value),
        complete: () => {
          closedOnDemand = true;
          return wsClient.complete();
        },
      },
    );
  }
}

export class WebSocketClient extends BidirectionalObservable<
  WebSocketDuplexMessage,
  WebSocketDuplexMessage
> {
  #closing: undefined | CloseEvent = undefined;

  get closeReason() {
    return this.#closing;
  }

  constructor(options: BidiWsOptions) {
    // socket
    const socket = new (options.Constructor ?? WebSocket)(
      options.url,
      options.protocols,
    );
    socket.binaryType = "arraybuffer";

    // interface
    super(
      new Observable<WebSocketDuplexMessage>((observer) => {
        const incomingMessages = new Subject<WebSocketDuplexMessage>();
        const sub = incomingMessages.subscribe(observer);

        function forIncomingOnMessage(event: MessageEvent) {
          return incomingMessages.next(event.data as WebSocketDuplexMessage);
        }
        function forIncomingOnClose() {
          return incomingMessages.complete();
        }
        socket.addEventListener("message", forIncomingOnMessage);
        socket.addEventListener("close", forIncomingOnClose);
        socket.addEventListener("error", forIncomingOnClose);

        return new TidySubscription(() => {
          if (!sub.closed) {
            sub.cancel();
          }
          socket.removeEventListener("message", forIncomingOnMessage);
          socket.removeEventListener("close", forIncomingOnClose);
          socket.removeEventListener("error", forIncomingOnClose);
        });
      }),

      {
        get closed() {
          return (
            socket.readyState === WebSocket.CLOSING ||
            socket.readyState === WebSocket.CLOSED
          );
        },

        next: async (value) => {
          if (socket.readyState === WebSocket.CONNECTING) {
            await new Promise((resolve) => {
              socket.addEventListener("open", resolve, { once: true });
            });
          }
          await waitForSocketDrain(socket);
          if (socket.readyState !== WebSocket.OPEN) {
            return;
          }
          socket.send(value);
          await waitForSocketDrain(socket);
        },

        complete: () => {
          if (socket.readyState !== WebSocket.CLOSED) {
            socket.close();
          }
        },
      },
    );

    // timeout
    const openingTimeoutToken: ReturnType<typeof setTimeout> = setTimeout(
      () => {
        socket.close();
        socket.removeEventListener("open", onOpen);
      },
      options.timeout,
    );

    socket.addEventListener("open", onOpen);

    function onOpen() {
      clearTimeout(openingTimeoutToken);
    }

    socket.addEventListener("close", (event) => {
      this.#closing = event;
    });
  }
}

async function waitForSocketDrain(socket: WebSocketEligibleInstance) {
  while (socket.bufferedAmount > 0 && socket.readyState === WebSocket.OPEN) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
