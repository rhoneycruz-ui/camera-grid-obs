import { timingSafeEqual } from "node:crypto";

export interface AuthConfig {
  panelCapability: string;
  outputCapability: string;
  allowedOrigins: string[];
}

export interface ConnectionAttempt {
  remoteAddress: string;
  origin: string;
  role: string;
  capability: string;
}

export type AuthorizationResult =
  | { ok: true; canMutate: boolean }
  | { ok: false; code: "FORBIDDEN" };

function safeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function isLoopback(address: string): boolean {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

export function authorizeConnection(
  attempt: ConnectionAttempt,
  config: AuthConfig,
): AuthorizationResult {
  if (!isLoopback(attempt.remoteAddress) || !config.allowedOrigins.includes(attempt.origin)) {
    return { ok: false, code: "FORBIDDEN" };
  }
  if (attempt.role === "panel" && safeEqual(attempt.capability, config.panelCapability)) {
    return { ok: true, canMutate: true };
  }
  if (attempt.role === "output" && safeEqual(attempt.capability, config.outputCapability)) {
    return { ok: true, canMutate: false };
  }
  return { ok: false, code: "FORBIDDEN" };
}
