import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

const idSchema = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);

export const InviteSchema = z
  .object({
    id: z.string().min(1).max(140),
    participantId: idSchema,
    streamId: idSchema,
    slot: z.number().int().min(0).max(8),
    generation: z.number().int().positive(),
    tokenHash: z.string().regex(/^[a-f0-9]{64}$/),
    status: z.enum(["ACTIVE", "REVOKED"]),
  })
  .strict();

export type Invite = z.infer<typeof InviteSchema>;

export interface IssueInviteInput {
  participantId: string;
  streamId: string;
  slot: number;
  generation?: number;
}

export interface IssuedInvite {
  invite: Invite;
  token: string;
}

export function issueInvite(input: IssueInviteInput): IssuedInvite {
  const participantId = idSchema.parse(input.participantId);
  const streamId = idSchema.parse(input.streamId);
  const slot = z.number().int().min(0).max(8).parse(input.slot);
  const generation = z.number().int().positive().parse(input.generation ?? 1);
  const token = randomBytes(32).toString("base64url");

  return {
    token,
    invite: InviteSchema.parse({
      id: `${participantId}:${generation}`,
      participantId,
      streamId,
      slot,
      generation,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      status: "ACTIVE",
    }),
  };
}

export function rotateInvite(invite: Invite): IssuedInvite {
  return issueInvite({
    participantId: invite.participantId,
    streamId: invite.streamId,
    slot: invite.slot,
    generation: invite.generation + 1,
  });
}
