import { once } from "node:events";

import { createSession, issueInvite } from "@camera-grid/domain";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";

import { createServer } from "../src/app.js";

const sockets: WebSocket[] = [];

function initialState() {
  const { invite } = issueInvite({ participantId: "participant-1", streamId: "stream-1", slot: 0 });
  return createSession({ sessionId: "session-1", invites: [invite] });
}

async function connect(url: string, role: "panel" | "output", capability: string) {
  const socket = new WebSocket(url, { origin: "http://127.0.0.1:4173" });
  sockets.push(socket);
  const queued: Record<string, unknown>[] = [];
  const waiting: Array<(message: Record<string, unknown>) => void> = [];
  socket.on("message", (data) => {
    const message = JSON.parse(data.toString()) as Record<string, unknown>;
    const resolve = waiting.shift();
    if (resolve === undefined) queued.push(message);
    else resolve(message);
  });
  await once(socket, "open");
  socket.send(JSON.stringify({ version: 1, type: "hello", role, capability }));
  return {
    send(message: unknown) {
      socket.send(JSON.stringify(message));
    },
    next(): Promise<Record<string, unknown>> {
      const message = queued.shift();
      if (message !== undefined) return Promise.resolve(message);
      return new Promise((resolve) => waiting.push(resolve));
    },
  };
}

afterEach(() => {
  for (const socket of sockets.splice(0)) socket.terminate();
});

describe("WebSocket gateway", () => {
  it("syncs panel commands to output, rejects stale/output mutations, and snapshots reconnects", async () => {
    const app = await createServer({
      state: initialState(),
      auth: {
        panelCapability: "panel-secret-test-only",
        outputCapability: "output-secret-test-only",
        allowedOrigins: ["http://127.0.0.1:4173"],
      },
    });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    if (address === null || typeof address === "string") throw new Error("missing server address");
    const url = `ws://127.0.0.1:${address.port}/ws`;

    try {
      const panel = await connect(url, "panel", "panel-secret-test-only");
      const output = await connect(url, "output", "output-secret-test-only");
      expect(await panel.next()).toMatchObject({ type: "snapshot", state: { revision: 0 } });
      expect(await output.next()).toMatchObject({ type: "snapshot", state: { revision: 0 } });

      panel.send({
          version: 1,
          type: "command",
          requestId: "request-1",
          command: {
            type: "SET_VISIBILITY",
            expectedRevision: 0,
            participantId: "participant-1",
            visible: false,
          },
        });
      expect(await panel.next()).toMatchObject({ type: "commandResult", ok: true, revision: 1 });
      expect(await output.next()).toMatchObject({ type: "snapshot", state: { revision: 1 } });

      output.send({
          version: 1,
          type: "command",
          requestId: "output-write",
          command: {
            type: "SET_VISIBILITY",
            expectedRevision: 1,
            participantId: "participant-1",
            visible: true,
          },
        });
      expect(await output.next()).toMatchObject({ type: "commandResult", ok: false, code: "FORBIDDEN" });

      panel.send({
          version: 1,
          type: "command",
          requestId: "stale",
          command: {
            type: "SET_VISIBILITY",
            expectedRevision: 0,
            participantId: "participant-1",
            visible: true,
          },
        });
      expect(await panel.next()).toMatchObject({ type: "commandResult", ok: false, code: "STALE_STATE" });

      const reconnected = await connect(url, "output", "output-secret-test-only");
      expect(await reconnected.next()).toMatchObject({ type: "snapshot", state: { revision: 1 } });
    } finally {
      await app.close();
    }
  });
});
