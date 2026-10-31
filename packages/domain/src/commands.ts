import { z } from "zod";

import { InviteSchema } from "./invite.js";
import { updateCameraLayout } from "./layout.js";
import type { Participant, SessionState } from "./session.js";

const baseCommand = { expectedRevision: z.number().int().nonnegative() };

export const SessionCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SET_DIRECTOR_ONLINE"), ...baseCommand, online: z.boolean() }).strict(),
  z
    .object({
      type: z.literal("REQUEST_PUBLICATION"),
      ...baseCommand,
      inviteId: z.string(),
      generation: z.number().int().positive(),
    })
    .strict(),
  z.object({ type: z.literal("APPROVE_PUBLICATION"), ...baseCommand, inviteId: z.string() }).strict(),
  z.object({ type: z.literal("MARK_PUBLICATION_CONNECTED"), ...baseCommand, inviteId: z.string() }).strict(),
  z.object({ type: z.literal("REVOKE_INVITE"), ...baseCommand, inviteId: z.string() }).strict(),
  z
    .object({
      type: z.literal("ROTATE_INVITE"),
      ...baseCommand,
      inviteId: z.string(),
      replacement: InviteSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("SET_VISIBILITY"),
      ...baseCommand,
      participantId: z.string(),
      visible: z.boolean(),
    })
    .strict(),
  z.object({ type: z.literal("REVOKE_OUTPUT_ACCESS"), ...baseCommand }).strict(),
  z.object({ type: z.literal("END_SESSION"), ...baseCommand }).strict(),
]);

export type SessionCommand = z.infer<typeof SessionCommandSchema>;
export type LayoutCommand = Extract<SessionCommand, { type: "SET_VISIBILITY" }>;
export type DomainErrorCode =
  | "STALE_STATE"
  | "SESSION_ENDED"
  | "DIRECTOR_OFFLINE"
  | "UNKNOWN_INVITE"
  | "UNKNOWN_PARTICIPANT"
  | "INVITE_REVOKED"
  | "INVITE_GENERATION_MISMATCH"
  | "APPROVAL_REQUIRED"
  | "INVALID_REPLACEMENT";

export type DomainEffect = { type: "REQUEST_VDO_DISCONNECT"; participantId: string };
export type ReduceResult =
  | { ok: true; state: SessionState; effects: DomainEffect[] }
  | { ok: false; state: SessionState; code: DomainErrorCode };

function fail(state: SessionState, code: DomainErrorCode): ReduceResult {
  return { ok: false, state, code };
}

function success(
  state: SessionState,
  patch: Partial<SessionState>,
  effects: DomainEffect[] = [],
): ReduceResult {
  return { ok: true, state: { ...state, ...patch, revision: state.revision + 1 }, effects };
}

function updateParticipant(
  state: SessionState,
  participantId: string,
  patch: Partial<Participant>,
): Record<string, Participant> | undefined {
  const participant = state.participants[participantId];
  if (participant === undefined) return undefined;
  return { ...state.participants, [participantId]: { ...participant, ...patch } };
}

export function reduceSession(state: SessionState, rawCommand: SessionCommand): ReduceResult {
  const command = SessionCommandSchema.parse(rawCommand);
  if (command.expectedRevision !== state.revision) return fail(state, "STALE_STATE");
  if (state.status === "ENDED") return fail(state, "SESSION_ENDED");

  switch (command.type) {
    case "SET_DIRECTOR_ONLINE": {
      const participants = command.online
        ? state.participants
        : Object.fromEntries(
            Object.entries(state.participants).map(([id, participant]) => [
              id,
              participant.publicationStatus === "REVOKED"
                ? participant
                : { ...participant, publicationStatus: "PENDING_APPROVAL" as const },
            ]),
          );
      return success(state, { directorOnline: command.online, participants });
    }
    case "REQUEST_PUBLICATION": {
      const invite = state.invites[command.inviteId];
      if (invite === undefined) return fail(state, "UNKNOWN_INVITE");
      if (invite.status === "REVOKED") return fail(state, "INVITE_REVOKED");
      if (invite.generation !== command.generation) return fail(state, "INVITE_GENERATION_MISMATCH");
      if (!state.directorOnline) return fail(state, "DIRECTOR_OFFLINE");
      const participants = updateParticipant(state, invite.participantId, {
        publicationStatus: "PENDING_APPROVAL",
      });
      return participants === undefined
        ? fail(state, "UNKNOWN_PARTICIPANT")
        : success(state, { participants });
    }
    case "APPROVE_PUBLICATION": {
      if (!state.directorOnline) return fail(state, "DIRECTOR_OFFLINE");
      const invite = state.invites[command.inviteId];
      if (invite === undefined) return fail(state, "UNKNOWN_INVITE");
      if (invite.status === "REVOKED") return fail(state, "INVITE_REVOKED");
      const participant = state.participants[invite.participantId];
      if (participant?.publicationStatus !== "PENDING_APPROVAL") {
        return fail(state, "APPROVAL_REQUIRED");
      }
      const participants = updateParticipant(state, invite.participantId, {
        publicationStatus: "APPROVED",
      });
      return success(state, { participants: participants! });
    }
    case "MARK_PUBLICATION_CONNECTED": {
      const invite = state.invites[command.inviteId];
      if (invite === undefined) return fail(state, "UNKNOWN_INVITE");
      if (invite.status === "REVOKED") return fail(state, "INVITE_REVOKED");
      const participant = state.participants[invite.participantId];
      if (!state.directorOnline || participant?.publicationStatus !== "APPROVED") {
        return fail(state, state.directorOnline ? "APPROVAL_REQUIRED" : "DIRECTOR_OFFLINE");
      }
      return success(state, {
        participants: updateParticipant(state, invite.participantId, {
          publicationStatus: "CONNECTED",
        })!,
      });
    }
    case "REVOKE_INVITE": {
      const invite = state.invites[command.inviteId];
      if (invite === undefined) return fail(state, "UNKNOWN_INVITE");
      const participant = state.participants[invite.participantId];
      if (participant === undefined) return fail(state, "UNKNOWN_PARTICIPANT");
      const shouldDisconnect = ["APPROVED", "CONNECTED"].includes(participant.publicationStatus);
      return success(
        state,
        {
          invites: {
            ...state.invites,
            [invite.id]: { ...invite, status: "REVOKED" },
          },
          participants: {
            ...state.participants,
            [participant.id]: { ...participant, publicationStatus: "REVOKED", visible: false },
          },
          layout: updateCameraLayout(state.layout, participant.slot, { visible: false }),
        },
        shouldDisconnect
          ? [{ type: "REQUEST_VDO_DISCONNECT", participantId: participant.id }]
          : [],
      );
    }
    case "ROTATE_INVITE": {
      const previous = state.invites[command.inviteId];
      if (previous === undefined) return fail(state, "UNKNOWN_INVITE");
      const next = command.replacement;
      if (
        next.participantId !== previous.participantId ||
        next.streamId !== previous.streamId ||
        next.slot !== previous.slot ||
        next.generation !== previous.generation + 1 ||
        next.status !== "ACTIVE"
      ) {
        return fail(state, "INVALID_REPLACEMENT");
      }
      return success(state, {
        invites: {
          ...state.invites,
          [previous.id]: { ...previous, status: "REVOKED" },
          [next.id]: next,
        },
      });
    }
    case "SET_VISIBILITY": {
      const participant = state.participants[command.participantId];
      if (participant === undefined) return fail(state, "UNKNOWN_PARTICIPANT");
      return success(state, {
        participants: {
          ...state.participants,
          [participant.id]: { ...participant, visible: command.visible },
        },
        layout: updateCameraLayout(state.layout, participant.slot, { visible: command.visible }),
      });
    }
    case "REVOKE_OUTPUT_ACCESS":
      return success(state, { outputAccess: "REVOKED" });
    case "END_SESSION": {
      const effects: DomainEffect[] = Object.values(state.participants)
        .filter((participant) => ["APPROVED", "CONNECTED"].includes(participant.publicationStatus))
        .map((participant) => ({
          type: "REQUEST_VDO_DISCONNECT" as const,
          participantId: participant.id,
        }));
      return success(
        state,
        {
          status: "ENDED",
          directorOnline: false,
          outputAccess: "REVOKED",
          invites: Object.fromEntries(
            Object.entries(state.invites).map(([id, invite]) => [id, { ...invite, status: "REVOKED" as const }]),
          ),
          participants: Object.fromEntries(
            Object.entries(state.participants).map(([id, participant]) => [
              id,
              { ...participant, publicationStatus: "REVOKED" as const, visible: false },
            ]),
          ),
          layout: state.layout,
        },
        effects,
      );
    }
  }
}
