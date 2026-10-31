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
