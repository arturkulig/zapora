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

export async function getBidiOfWebSocket(
  options: BidiWsOptions,
): Promise<Bidirectional<WebSocketDuplexMessage, WebSocketDuplexMessage>> {
  const wsSocket = new (options.Constructor ?? WebSocket)(
    options.url,
    options.protocols,
  );
  wsSocket.binaryType = options.binaryType;
  const bidiSocket = await tryGetBidiOfWebSocket({
    socket: wsSocket,
    timeout: options.timeout,
  });
  return bidiSocket ?? getBidiOfWebSocket(options);
}

export function tryGetBidiOfWebSocket(options: BidiWsConnectionOptions) {
  const { socket } = options;

  const wsDone = new Promise<void>((resolve) => {
    function generalOnClose() {
      Promise.resolve().then(resolve);
    }
    socket.addEventListener("close", generalOnClose);
    socket.addEventListener("error", generalOnClose);
  });

  return new Promise<Bidirectional<
    WebSocketDuplexMessage,
    WebSocketDuplexMessage
  > | null>((returnBidirectional) => {
    const openingTimeoutToken: ReturnType<typeof setTimeout> = setTimeout(
      () => {
        socket.close();
        returnBidirectional(null);
        socket.removeEventListener("open", onOpen);
      },
      options.timeout,
    );

    socket.addEventListener("open", onOpen);

    function onOpen() {
      clearTimeout(openingTimeoutToken);

      returnBidirectional(
        new Bidirectional(
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
                return wsDone;
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
        ),
      );
    }
  });
}
