import { createHash, randomBytes } from "node:crypto";

import { InviteSchema, type Invite } from "./invite.js";

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
  const generation = input.generation ?? 1;
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    invite: InviteSchema.parse({
      id: `${input.participantId}:${generation}`,
      participantId: input.participantId,
      streamId: input.streamId,
      slot: input.slot,
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
