import { describe, expect, it, vi } from "vitest";

import { createStartupState, loadStartupState } from "../src/startup.js";

describe("technical spike startup", () => {
  it("creates one stable slot from disposable environment identifiers without storing a raw token", () => {
    const state = createStartupState({
      CAMERA_GRID_SESSION_ID: "session-test",
      CAMERA_GRID_SPIKE_PARTICIPANT_ID: "participant-test",
      CAMERA_GRID_SPIKE_STREAM_ID: "stream-test",
    });

    expect(state.participants["participant-test"]).toMatchObject({ slot: 0, streamId: "stream-test" });
    expect(JSON.stringify(state)).not.toContain('"token":');
    expect(Object.values(state.invites)[0]?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("starts empty when spike identifiers are absent", () => {
    expect(Object.keys(createStartupState({ CAMERA_GRID_SESSION_ID: "session-test" }).participants)).toHaveLength(0);
  });

  it("restores a revoked invite fail-closed instead of recreating it as active", async () => {
    const revoked = createStartupState({
      CAMERA_GRID_SESSION_ID: "session-test",
      CAMERA_GRID_SPIKE_PARTICIPANT_ID: "participant-test",
      CAMERA_GRID_SPIKE_STREAM_ID: "stream-test",
    });
    revoked.invites["participant-test:1"]!.status = "REVOKED";
    revoked.participants["participant-test"]!.publicationStatus = "REVOKED";

    const save = vi.fn();
    const restored = await loadStartupState(
      {
        CAMERA_GRID_SESSION_ID: "session-test",
        CAMERA_GRID_SPIKE_PARTICIPANT_ID: "participant-test",
        CAMERA_GRID_SPIKE_STREAM_ID: "stream-test",
      },
      { load: async () => revoked, save },
    );

    expect(restored.invites["participant-test:1"]?.status).toBe("REVOKED");
    expect(restored.participants["participant-test"]?.publicationStatus).toBe("REVOKED");
    expect(restored.revision).toBe(1);
    expect(save).toHaveBeenCalledWith(restored);
  });
});
