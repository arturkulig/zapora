import { WebSocketEligibleInstance } from "./WebSocketBidi";

export function getFakeWebSocketClass() {
  return class WebSocketSimulacrum implements WebSocketEligibleInstance {
    static cleanup() {
      WebSocketSimulacrum.instances.forEach((instance) => {
        instance.dispose();
      });
    }
    // DEBUG FIELDS
    static instances: WebSocketSimulacrum[] = [];
    log: string[] = [];

    // INTERNAL
    #proceedings: Promise<unknown>;
    #drainToken: ReturnType<typeof setTimeout> | null;

    //
    binaryType: BinaryType;
    bufferedAmount: number;
    readyState: number;

    constructor(_url: string | URL, _protocols: string | string[] = ["ws"]) {
      WebSocketSimulacrum.instances.push(this);

      this.binaryType = "arraybuffer";
      this.bufferedAmount = 0;

      this.log.push(`connecting`);
      this.readyState = WebSocket.CONNECTING;

      this.#proceedings = Promise.resolve();

      setTimeout(
        () => {
          this.simulateConnectionOpen();
        },
        Math.random() * 100 + 100,
      );

      this.#drainToken = null;
      this.#setupDrain();
    }

    #setupDrain() {
      this.#drainToken = setTimeout(
        () => {
          if (this.readyState === WebSocket.OPEN) {
            this.bufferedAmount = Math.max(0, this.bufferedAmount - 1);
          }
          if (
            this.readyState === WebSocket.OPEN ||
            this.readyState === WebSocket.CONNECTING
          ) {
            this.#setupDrain();
          }
        },
        Math.random() * 10 + 10,
      );
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      if (this.readyState === WebSocket.OPEN) {
        this.log.push(`sent ${data}`);
        if (typeof data === "string") {
          this.bufferedAmount += data.length;
        } else if (
          ArrayBuffer.isView(data) ||
          data instanceof ArrayBuffer ||
          data instanceof SharedArrayBuffer
        ) {
          this.bufferedAmount += data.byteLength;
        } else {
          this.bufferedAmount += data.size;
        }
      }
    }

    close(code?: number, reason?: string): void {
      this.log.push(`client closing ${code} ${reason ?? ""}`.trim());
      this.readyState = WebSocket.CLOSING;

      this.#proceedings = this.#proceedings.then(async () => {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 10 + 10),
        );
        this.log.push(`closed ${code} ${reason ?? ""}`.trim());
        this.readyState = WebSocket.CLOSED;
      });

      this.dispose();
    }

    #events: Record<string, Array<EventListenerOrEventListenerObject>> = {};

    addEventListener(
      type: string,
      callback: EventListenerOrEventListenerObject | null,
      options?: AddEventListenerOptions | boolean,
    ): void {
      this.#events[type] = this.#events[type] ?? [];
      if (callback) {
        this.log.push();
        this.#events[type].push(callback);
      }
    }

    removeEventListener(
      type: string,
      callback: EventListenerOrEventListenerObject | null,
      options?: EventListenerOptions | boolean,
    ): void {
      this.#events[type] = this.#events[type] ?? [];
      if (callback && this.#events[type].includes(callback)) {
        this.#events[type].splice(this.#events[type].indexOf(callback), 1);
      }
    }

    simulateConnectionOpen() {
      return (this.#proceedings = this.#proceedings.then(() => {
        if (this.readyState === WebSocket.CONNECTING) {
          this.log.push(`connected`);
          this.readyState = WebSocket.OPEN;
          this.dispatchEventOfName("open", {});
        }
      }));
    }
    simulateMessageReceiving(
      message: string | ArrayBufferLike | Blob | ArrayBufferView,
    ) {
      if (this.readyState !== WebSocket.OPEN) {
        throw new Error(
          "Cannot simulate retrieving a message on non-open connection",
        );
      }
      this.dispatchEventOfName("message", {
        data: message,
      });
    }
    simulateClosing() {
      if (this.readyState !== WebSocket.OPEN) {
        throw new Error(
          "Cannot simulate retrieving a message on non-open connection",
        );
      }
      this.log.push(`server closing`);
      this.dispose();
      this.readyState = WebSocket.CLOSING;
      this.dispatchEventOfName("close", {});
      return (this.#proceedings = this.#proceedings.then(() => {
        this.readyState = WebSocket.CLOSED;
      }));
    }
    dispatchEventOfName(name: string, event: any) {
      this.#events[name]?.forEach((cb) => {
        if (typeof cb === "function") {
          cb(event);
        } else {
          cb.handleEvent(event);
        }
      });
    }
    dispose() {
      if (this.#drainToken !== null) {
        clearTimeout(this.#drainToken);
        this.#drainToken = null;
      }
    }
  };
}
