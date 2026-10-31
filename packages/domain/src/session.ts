import { z } from "zod";

import { InviteSchema, type Invite } from "./invite.js";
import { CameraLayoutSchema, createDefaultLayout, type CameraLayout } from "./layout.js";

export const PublicationStatusSchema = z.enum([
  "DISCONNECTED",
  "PENDING_APPROVAL",
  "APPROVED",
  "CONNECTED",
  "REVOKED",
]);

export type PublicationStatus = z.infer<typeof PublicationStatusSchema>;

export const ParticipantSchema = z
  .object({
    id: z.string().min(1).max(64),
    streamId: z.string().min(1).max(64),
    slot: z.number().int().min(0).max(8),
    visible: z.boolean(),
    publicationStatus: PublicationStatusSchema,
  })
  .strict();

export type Participant = z.infer<typeof ParticipantSchema>;

export const SessionStateSchema = z
  .object({
    sessionId: z.string().min(1).max(64),
    revision: z.number().int().nonnegative(),
    status: z.enum(["ACTIVE", "ENDED"]),
    directorOnline: z.boolean(),
    outputAccess: z.enum(["ACTIVE", "REVOKED"]),
    invites: z.record(z.string(), InviteSchema),
    participants: z.record(z.string(), ParticipantSchema),
    layout: CameraLayoutSchema,
  })
  .strict();

export type SessionState = z.infer<typeof SessionStateSchema>;

export interface CreateSessionInput {
  sessionId: string;
  invites: Invite[];
  layout?: CameraLayout;
}

export function createSession(input: CreateSessionInput): SessionState {
  const invites = Object.fromEntries(
    input.invites.map((invite) => {
      const parsed = InviteSchema.parse(invite);
      return [parsed.id, parsed];
    }),
  );
  const participants = Object.fromEntries(
    input.invites.map((invite) => [
      invite.participantId,
      ParticipantSchema.parse({
        id: invite.participantId,
        streamId: invite.streamId,
        slot: invite.slot,
        visible: true,
        publicationStatus: "DISCONNECTED",
      }),
    ]),
  );

  return SessionStateSchema.parse({
    sessionId: input.sessionId,
    revision: 0,
    status: "ACTIVE",
    directorOnline: false,
    outputAccess: "ACTIVE",
    invites,
    participants,
    layout: CameraLayoutSchema.parse(input.layout ?? createDefaultLayout()),
  });
}

export function restoreSession(state: SessionState): SessionState {
  return {
    ...state,
    revision: state.revision + 1,
    directorOnline: false,
    participants: Object.fromEntries(
      Object.entries(state.participants).map(([id, participant]) => [
        id,
        participant.publicationStatus === "REVOKED"
          ? participant
          : { ...participant, publicationStatus: "PENDING_APPROVAL" as const },
      ]),
    ),
  };
}
