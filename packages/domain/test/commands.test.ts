import { describe, expect, it } from "vitest";

import { createSession, issueInvite, reduceSession } from "../src/index.js";

function state() {
  const { invite } = issueInvite({
    participantId: "participant-1",
    streamId: "stream-1",
    slot: 0,
  });
  return createSession({ sessionId: "session-1", invites: [invite] });
}

describe("session command concurrency", () => {
  it("rejects a stale revision without mutating state", () => {
    const before = state();
    const result = reduceSession(before, {
      type: "SET_VISIBILITY",
      expectedRevision: 99,
      participantId: "participant-1",
      visible: false,
    });

    expect(result).toMatchObject({ ok: false, code: "STALE_STATE" });
    expect(result.state).toBe(before);
  });

  it("ends the session without deleting the last layout", () => {
    const before = state();
    const result = reduceSession(before, {
      type: "END_SESSION",
      expectedRevision: 0,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe("ENDED");
    expect(result.state.layout).toBe(before.layout);
    expect(result.state.invites["participant-1:1"]?.status).toBe("REVOKED");

    const later = reduceSession(result.state, {
      type: "SET_VISIBILITY",
      expectedRevision: 1,
      participantId: "participant-1",
      visible: false,
    });
    expect(later).toMatchObject({ ok: false, code: "SESSION_ENDED" });
  });
});
