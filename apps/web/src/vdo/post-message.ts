import { VdoMessageSchema, type VdoMessage } from "@camera-grid/vdo";

export function validateVdoMessage(
  event: MessageEvent,
  frameWindow: Window,
  expectedOrigin: string,
): VdoMessage | undefined {
  if (event.origin !== new URL(expectedOrigin).origin || event.source !== frameWindow) return undefined;
  const parsed = VdoMessageSchema.safeParse(event.data);
  return parsed.success ? parsed.data : undefined;
}
