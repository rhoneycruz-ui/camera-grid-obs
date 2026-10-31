import { z } from "zod";

const identifier = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, underscore, or hyphen");

const roomPassword = z
  .string()
  .min(1)
  .max(49)
  .regex(/^[A-Za-z0-9]+$/, "VDO.Ninja room passwords must be alphanumeric");

const httpsOrigin = z
  .string()
  .url()
  .transform((value, context) => {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      context.addIssue({
        code: "custom",
        message: "VDO origin must be a credential-free HTTPS origin",
      });
      return z.NEVER;
    }

    return url.origin;
  });

export const GuestUrlInputSchema = z
  .object({
    origin: httpsOrigin.optional(),
    streamId: identifier,
    roomId: identifier,
    roomPassword: roomPassword.optional(),
    profile: z.enum(["economy", "quality"]).optional(),
  })
  .strict();

export type GuestUrlInput = z.input<typeof GuestUrlInputSchema>;

export const ViewerUrlInputSchema = z
  .object({
    origin: httpsOrigin.optional(),
    streamId: identifier.optional(),
    roomId: identifier,
    roomPassword: roomPassword.optional(),
    scene: z.number().int().min(0).max(8).optional(),
    videoBitrateKbps: z.union([z.literal(600), z.literal(1200), z.literal(2500)]).optional(),
  })
  .strict()
  .refine((input) => Number(input.streamId !== undefined) + Number(input.scene !== undefined) === 1, {
    message: "Provide exactly one receiver target: streamId or scene",
  });

export type ViewerUrlInput = z.input<typeof ViewerUrlInputSchema>;

const connectionAction = z.enum([
  "joining-room",
  "guest-connected",
  "push-connection",
  "view-connection",
  "director-connected",
  "scene-connected",
  "slot-updated",
]);

/**
 * Minimal inbound iframe event envelope used by the technical spike.
 * Origin and source-window checks belong to the browser adapter, not this schema.
 */
export const VdoMessageSchema = z
  .object({
    action: connectionAction,
    streamID: identifier.optional(),
    value: z.unknown().optional(),
    cib: z.string().max(128).optional(),
  })
  .strict();

export type VdoMessage = z.infer<typeof VdoMessageSchema>;
