import {
  Bidirectional,
  Observable,
  Subject,
  TidySubscription,
} from "@zapora/core";

export interface BidiWsOptions {
  Constructor?: WebSocketEligibleConstructor;
  url: string | URL;
  binaryType: BinaryType;
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

export async function getWebSocketClient(
  options: BidiWsOptions,
): Promise<Bidirectional<WebSocketDuplexMessage, WebSocketDuplexMessage>> {
  return (await tryGetWebSocketClient(options)) ?? getWebSocketClient(options);
}

export function tryGetWebSocketClient(options: BidiWsOptions) {
  const wsSocket = new (options.Constructor ?? WebSocket)(
    options.url,
    options.protocols,
  );
  wsSocket.binaryType = options.binaryType;
  return openWebSocketClient({
    socket: wsSocket,
    timeout: options.timeout,
  });
}

function openWebSocketClient(options: BidiWsConnectionOptions) {
  const { socket } = options;

  return new Promise<WebSocketClient | null>((resolve) => {
    const openingTimeoutToken: ReturnType<typeof setTimeout> = setTimeout(
      () => {
        socket.close();
        resolve(null);
        socket.removeEventListener("open", onOpen);
      },
      options.timeout,
    );

    socket.addEventListener("open", onOpen);

    function onOpen() {
      clearTimeout(openingTimeoutToken);

      resolve(new WebSocketClient(socket));
    }
  });
}

class WebSocketClient extends Bidirectional<
  WebSocketDuplexMessage,
  WebSocketDuplexMessage
> {
  constructor(socket: WebSocketEligibleInstance) {
    super(
      new Observable<WebSocketDuplexMessage>((observer) => {
        const incomingMessages = new Subject<WebSocketDuplexMessage>();
        const sub = incomingMessages.subscribe(observer);

        function forIncomingOnMessage(event: MessageEvent) {
          incomingMessages.next(event.data);
        }
        function forIncomingOnClose() {
          incomingMessages.complete();
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
          if (socket.readyState !== WebSocket.OPEN) {
            return;
          }
          socket.send(value);
          while (
            socket.bufferedAmount > 0 &&
            socket.readyState === WebSocket.OPEN
          ) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        },
        complete: () => {
          if (socket.readyState !== WebSocket.CLOSED) {
            socket.close();
          }
        },
      },
    );
  }
}
