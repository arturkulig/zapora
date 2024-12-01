import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { getBidiOfWebSocket } from "./WebSocketBidi";
import { getFakeWebSocketClass } from "./WebSocketSimulacrum";

const JEST_TIMEOUT = 4000;

describe("WebSocket Duplex", () => {
  let WS = getFakeWebSocketClass();
  beforeEach(() => {
    WS = getFakeWebSocketClass();
  });
  afterEach(() => {
    WS.cleanup();
  });

  it("connects", () => {
    getBidiOfWebSocket({
      timeout: JEST_TIMEOUT,
      Constructor: WS,
      url: "localhost",
      protocols: "ws",
      binaryType: "arraybuffer"
    });
    expect(WS.instances.length).toBe(1);
  });

  it("receives messages", async () => {
    const received: string[] = [];

    const wsd = await getBidiOfWebSocket({
      timeout: JEST_TIMEOUT,
      Constructor: WS,
      url: "localhost",
      protocols: "ws",
      binaryType: "arraybuffer"
    });
    expect(WS.instances.length).toBe(1);

    const sub = wsd.subscribe({
      next: (message) => {
        if (typeof message === "string") {
          received.push(message);
        }
      },
      complete: () => {
        received.push("CLOSED");
      },
    });

    expect(received).toEqual([]);

    const [fakeWs] = WS.instances;

    await randomTime();
    fakeWs.simulateMessageReceiving("test A");
    expect(received).toEqual(["test A"]);

    await randomTime();
    fakeWs.simulateMessageReceiving("test B");
    expect(received).toEqual(["test A", "test B"]);

    fakeWs.simulateClosing();
    expect(received).toEqual(["test A", "test B", "CLOSED"]);

    sub.cancel();
  });

  it("sends messages to an empty buffer", async () => {
    const received: string[] = [];

    const wsd = await getBidiOfWebSocket({
      timeout: JEST_TIMEOUT,
      Constructor: WS,
      url: "localhost",
      protocols: "ws",
      binaryType: "arraybuffer"
    });
    expect(WS.instances.length).toBe(1);

    expect(received).toEqual([]);

    const [fakeWs] = WS.instances;

    await randomTime();
    expect(fakeWs.log).toEqual(["connecting", "connected"]);

    const confirmation = wsd.next("AAA");
    expect(fakeWs.bufferedAmount).toBeGreaterThan(0);
    await confirmation;
    expect(fakeWs.bufferedAmount).toBe(0);
  });
});

function randomTime() {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 10 + 10);
  });
}
