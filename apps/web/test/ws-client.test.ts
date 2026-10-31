import { createDefaultLayout } from "@camera-grid/domain";
import type { SessionSnapshot } from "@camera-grid/protocol";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { connectSession } from "../src/ws/client.js";

class FakeWebSocket extends EventTarget {
  static readonly OPEN = 1;
  static instances: FakeWebSocket[] = [];
  readyState = 0;
  sent: string[] = [];

  constructor(readonly url: string) {
    super();
    FakeWebSocket.instances.push(this);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.dispatchEvent(new Event("open"));
  }

  send(data: string) {
    this.sent.push(data);
  }

  message(data: string) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }

  close(code = 1000) {
    this.readyState = 3;
    this.dispatchEvent(new CloseEvent("close", { code }));
  }
}

const snapshot: SessionSnapshot = {
  sessionId: "session-1",
  revision: 1,
  status: "ACTIVE",
  directorOnline: false,
  outputAccess: "ACTIVE",
  participants: {},
  layout: createDefaultLayout(),
};

beforeEach(() => {
  vi.useFakeTimers();
  FakeWebSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeWebSocket);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("connectSession", () => {
  it("reconnects with a fresh hello and never replays an unconfirmed command", () => {
    const onSnapshot = vi.fn();
    const client = connectSession({
      role: "panel",
      capability: "panel-test-only",
      onSnapshot,
      onStatus: vi.fn(),
    });
    const first = FakeWebSocket.instances[0]!;
    first.open();
    expect(client.send({ type: "END_SESSION", expectedRevision: 0 })).toBe(true);
    expect(client.send({ type: "END_SESSION", expectedRevision: 0 })).toBe(false);

    first.close(1006);
    vi.advanceTimersByTime(250);
    const second = FakeWebSocket.instances[1]!;
    second.open();

    second.close(1006);
    vi.advanceTimersByTime(499);
    expect(FakeWebSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    const third = FakeWebSocket.instances[2]!;
    third.open();

    expect(third.sent).toHaveLength(1);
    expect(JSON.parse(third.sent[0]!)).toMatchObject({ type: "hello", role: "panel" });
    third.message(JSON.stringify({ version: 1, type: "snapshot", state: snapshot }));
    expect(onSnapshot).toHaveBeenCalledWith(snapshot);
    client.close();
  });

  it("reports malformed server data without throwing or logging its payload", () => {
    const onStatus = vi.fn();
    const client = connectSession({
      role: "output",
      capability: "output-test-only",
      onSnapshot: vi.fn(),
      onStatus,
    });
    const socket = FakeWebSocket.instances[0]!;
    socket.open();

    expect(() => socket.message("{not-json")).not.toThrow();
    expect(onStatus).toHaveBeenCalledWith("protocol-error");
    client.close();
  });
});
