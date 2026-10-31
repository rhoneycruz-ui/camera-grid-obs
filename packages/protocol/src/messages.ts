import { SessionCommandSchema, SessionStateSchema, type SessionState } from "@camera-grid/domain";
import { z } from "zod";

const version = z.literal(1);

export const SessionSnapshotSchema = SessionStateSchema.omit({ invites: true });
export type SessionSnapshot = z.infer<typeof SessionSnapshotSchema>;

export function createSnapshot(state: SessionState): SessionSnapshot {
  const { invites: _privateInvites, ...snapshot } = state;
  return SessionSnapshotSchema.parse(snapshot);
}

export const ClientMessageSchema = z.discriminatedUnion("type", [
  z
    .object({
      version,
      type: z.literal("hello"),
      role: z.enum(["panel", "output"]),
      capability: z.string().min(1).max(256),
    })
    .strict(),
  z
    .object({
      version,
      type: z.literal("command"),
      requestId: z.string().min(1).max(128),
      command: SessionCommandSchema,
    })
    .strict(),
]);

export const ServerMessageSchema = z.discriminatedUnion("type", [
  z.object({ version, type: z.literal("snapshot"), state: SessionSnapshotSchema }).strict(),
  z
    .object({
      version,
      type: z.literal("commandResult"),
      requestId: z.string().min(1).max(128),
      ok: z.boolean(),
      code: z.string().max(64).optional(),
      revision: z.number().int().nonnegative(),
    })
    .strict(),
  z.object({ version, type: z.literal("presence"), directorOnline: z.boolean() }).strict(),
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
