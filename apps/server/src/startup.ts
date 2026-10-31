import { randomBytes } from "node:crypto";

import { createSession, issueInvite, restoreSession, type SessionState } from "@camera-grid/domain";

export interface StartupStore {
  load(): Promise<SessionState | undefined>;
  save(state: SessionState): Promise<unknown>;
}

export function createStartupState(
  environment: Readonly<Record<string, string | undefined>>,
): SessionState {
  const participantId = environment["CAMERA_GRID_SPIKE_PARTICIPANT_ID"];
  const streamId = environment["CAMERA_GRID_SPIKE_STREAM_ID"];
  const invites =
    participantId !== undefined && streamId !== undefined
      ? [issueInvite({ participantId, streamId, slot: 0 }).invite]
      : [];
  return createSession({
    sessionId: environment["CAMERA_GRID_SESSION_ID"] ?? randomBytes(16).toString("hex"),
    invites,
  });
}

export async function loadStartupState(
  environment: Readonly<Record<string, string | undefined>>,
  store: StartupStore,
): Promise<SessionState> {
  const persisted = await store.load();
  const state = persisted === undefined ? createStartupState(environment) : restoreSession(persisted);
  await store.save(state);
  return state;
}
