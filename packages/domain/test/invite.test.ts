import { describe, expect, it } from "vitest";

import {
  createSession,
  issueInvite,
  reduceSession,
  rotateInvite,
  restoreSession,
  type SessionState,
} from "../src/index.js";

function setup(): { state: SessionState; token: string } {
  const issued = issueInvite({
    participantId: "participant-1",
    streamId: "stream-1",
    slot: 4,
  });

  return {
    token: issued.token,
    state: createSession({ sessionId: "session-1", invites: [issued.invite] }),
  };
}

describe("invite identity", () => {
  it("issues a cryptographic token whose stored hash does not depend on a display name", () => {
    const issued = issueInvite({
      participantId: "participant-1",
      streamId: "stream-1",
      slot: 4,
    });

    expect(issued.token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(issued.invite.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(issued.invite.tokenHash).not.toContain(issued.token);
    expect(issued.invite.participantId).toBe("participant-1");
    expect(issued.invite.slot).toBe(4);
    expect(issued.invite).not.toHaveProperty("displayName");
  });

  it("keeps the same participant and slot on an authorized reconnect but requires approval again", () => {
    const { state } = setup();
    const online = reduceSession(state, {
      type: "SET_DIRECTOR_ONLINE",
      expectedRevision: 0,
      online: true,
    });
    expect(online.ok).toBe(true);
    if (!online.ok) return;

    const requested = reduceSession(online.state, {
      type: "REQUEST_PUBLICATION",
      expectedRevision: 1,
      inviteId: "participant-1:1",
      generation: 1,
    });

    expect(requested.ok).toBe(true);
    if (!requested.ok) return;
    expect(requested.state.participants["participant-1"]).toMatchObject({
      slot: 4,
      publicationStatus: "PENDING_APPROVAL",
    });

    const approved = reduceSession(requested.state, {
      type: "APPROVE_PUBLICATION",
      expectedRevision: 2,
      inviteId: "participant-1:1",
    });
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(approved.state.participants["participant-1"]?.publicationStatus).toBe("APPROVED");
  });

  it("rotates an invite generation without changing participant identity or slot", () => {
    const { state } = setup();
    const replacement = rotateInvite(state.invites["participant-1:1"]!);
    const rotated = reduceSession(state, {
      type: "ROTATE_INVITE",
      expectedRevision: 0,
      inviteId: "participant-1:1",
      replacement: replacement.invite,
    });

    expect(rotated.ok).toBe(true);
    if (!rotated.ok) return;
    expect(rotated.state.invites["participant-1:1"]?.status).toBe("REVOKED");
    expect(rotated.state.invites["participant-1:2"]).toMatchObject({
      status: "ACTIVE",
      generation: 2,
      participantId: "participant-1",
      slot: 4,
    });
    expect(rotated.state.participants["participant-1"]?.slot).toBe(4);
  });
});

describe("local publication revocation", () => {
  it("revokes a connected invite, removes it from layout, and emits a disconnect request", () => {
    const { state } = setup();
    const connected: SessionState = {
      ...state,
      directorOnline: true,
      participants: {
        ...state.participants,
        "participant-1": {
          ...state.participants["participant-1"]!,
          publicationStatus: "CONNECTED",
        },
      },
    };

    const result = reduceSession(connected, {
      type: "REVOKE_INVITE",
      expectedRevision: 0,
      inviteId: "participant-1:1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.invites["participant-1:1"]?.status).toBe("REVOKED");
    expect(result.state.participants["participant-1"]).toMatchObject({
      publicationStatus: "REVOKED",
      visible: false,
    });
    expect(result.effects).toEqual([
      { type: "REQUEST_VDO_DISCONNECT", participantId: "participant-1" },
    ]);
  });

  it("rejects reconnection and approval for a revoked generation", () => {
    const { state } = setup();
    const revoked = reduceSession(state, {
      type: "REVOKE_INVITE",
      expectedRevision: 0,
      inviteId: "participant-1:1",
    });
    expect(revoked.ok).toBe(true);
    if (!revoked.ok) return;

    const reconnect = reduceSession(revoked.state, {
      type: "REQUEST_PUBLICATION",
      expectedRevision: 1,
      inviteId: "participant-1:1",
      generation: 1,
    });

    expect(reconnect).toMatchObject({ ok: false, code: "INVITE_REVOKED" });
    expect(reconnect.state).toBe(revoked.state);
  });

  it("treats hiding as layout-only and leaves publication authorization active", () => {
    const { state } = setup();
    const hidden = reduceSession(state, {
      type: "SET_VISIBILITY",
      expectedRevision: 0,
      participantId: "participant-1",
      visible: false,
    });

    expect(hidden.ok).toBe(true);
    if (!hidden.ok) return;
    expect(hidden.state.participants["participant-1"]?.visible).toBe(false);
    expect(hidden.state.invites["participant-1:1"]?.status).toBe("ACTIVE");
    expect(hidden.state.outputAccess).toBe("ACTIVE");
  });

  it("blocks output viewing independently from publication and layout", () => {
    const { state } = setup();
    const blocked = reduceSession(state, {
      type: "REVOKE_OUTPUT_ACCESS",
      expectedRevision: 0,
    });

    expect(blocked.ok).toBe(true);
    if (!blocked.ok) return;
    expect(blocked.state.outputAccess).toBe("REVOKED");
    expect(blocked.state.invites["participant-1:1"]?.status).toBe("ACTIVE");
    expect(blocked.state.participants["participant-1"]?.visible).toBe(true);
  });
});

describe("fail-closed recovery", () => {
  it("requires an online director for every publication approval", () => {
    const { state } = setup();
    const request = reduceSession(state, {
      type: "REQUEST_PUBLICATION",
      expectedRevision: 0,
      inviteId: "participant-1:1",
      generation: 1,
    });

    expect(request).toMatchObject({ ok: false, code: "DIRECTOR_OFFLINE" });
  });

  it("restores with director offline and connected publications pending approval", () => {
    const { state } = setup();
    const persisted: SessionState = {
      ...state,
      revision: 8,
      directorOnline: true,
      participants: {
        ...state.participants,
        "participant-1": {
          ...state.participants["participant-1"]!,
          publicationStatus: "CONNECTED",
        },
      },
    };

    const restored = restoreSession(persisted);

    expect(restored.revision).toBe(9);
    expect(restored.directorOnline).toBe(false);
    expect(restored.participants["participant-1"]).toMatchObject({
      slot: 4,
      publicationStatus: "PENDING_APPROVAL",
    });
  });
});
