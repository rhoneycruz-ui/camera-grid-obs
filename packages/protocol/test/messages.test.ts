import { describe, expect, it } from "vitest";

import { createSession, issueInvite } from "@camera-grid/domain";

import { ClientMessageSchema, ServerMessageSchema, createSnapshot } from "../src/index.js";

describe("protocol v1", () => {
  it("accepts versioned hello and command messages", () => {
    expect(
      ClientMessageSchema.parse({
        version: 1,
        type: "hello",
        role: "panel",
        capability: "test-capability",
      }),
    ).toMatchObject({ version: 1, type: "hello", role: "panel" });

    expect(
      ClientMessageSchema.parse({
        version: 1,
        type: "command",
        requestId: "request-1",
        command: {
          type: "SET_VISIBILITY",
          expectedRevision: 0,
          participantId: "participant-1",
          visible: false,
        },
      }),
    ).toMatchObject({ type: "command", requestId: "request-1" });
  });

  it("rejects unknown versions, roles, and free-form fields", () => {
    expect(() =>
      ClientMessageSchema.parse({ version: 2, type: "hello", role: "guest", capability: "x" }),
    ).toThrow();
    expect(() =>
      ClientMessageSchema.parse({
        version: 1,
        type: "hello",
        role: "output",
        capability: "x",
        admin: true,
      }),
    ).toThrow();
  });

  it("validates snapshots, command results, and presence without exposing tokens", () => {
    const result = ServerMessageSchema.parse({
      version: 1,
      type: "commandResult",
      requestId: "request-1",
      ok: false,
      code: "STALE_STATE",
      revision: 3,
    });
    expect(result).toMatchObject({ type: "commandResult", ok: false, revision: 3 });

    expect(() =>
      ServerMessageSchema.parse({
        version: 1,
        type: "presence",
        directorOnline: true,
        inviteToken: "must-not-cross-protocol",
      }),
    ).toThrow();
  });

  it("removes invite records and token hashes from every public snapshot", () => {
    const { invite } = issueInvite({
      participantId: "participant-1",
      streamId: "stream-1",
      slot: 0,
    });
    const snapshot = createSnapshot(
      createSession({ sessionId: "session-1", invites: [invite] }),
    );

    expect(snapshot).not.toHaveProperty("invites");
    expect(JSON.stringify(snapshot)).not.toContain(invite.tokenHash);
    expect(() =>
      ServerMessageSchema.parse({ version: 1, type: "snapshot", state: snapshot }),
    ).not.toThrow();
  });
});
