import { describe, expect, it } from "vitest";

import { authorizeConnection } from "../src/auth.js";

const config = {
  panelCapability: "panel-secret-test-only",
  outputCapability: "output-secret-test-only",
  allowedOrigins: ["http://127.0.0.1:4173"],
};

describe("local authorization", () => {
  it("allows panel mutation only from loopback with exact origin and capability", () => {
    expect(
      authorizeConnection(
        {
          remoteAddress: "127.0.0.1",
          origin: "http://127.0.0.1:4173",
          role: "panel",
          capability: "panel-secret-test-only",
        },
        config,
      ),
    ).toEqual({ ok: true, canMutate: true });
  });

  it.each([
    ["external address", "192.168.1.4", "http://127.0.0.1:4173", "panel", "panel-secret-test-only"],
    ["external origin", "127.0.0.1", "https://evil.example", "panel", "panel-secret-test-only"],
    ["invalid capability", "127.0.0.1", "http://127.0.0.1:4173", "panel", "wrong"],
    ["guest role", "127.0.0.1", "http://127.0.0.1:4173", "guest", "panel-secret-test-only"],
  ])("rejects %s", (_label, remoteAddress, origin, role, capability) => {
    expect(
      authorizeConnection({ remoteAddress, origin, role, capability }, config),
    ).toEqual({ ok: false, code: "FORBIDDEN" });
  });

  it("allows output read access without granting mutation", () => {
    expect(
      authorizeConnection(
        {
          remoteAddress: "::1",
          origin: "http://127.0.0.1:4173",
          role: "output",
          capability: "output-secret-test-only",
        },
        config,
      ),
    ).toEqual({ ok: true, canMutate: false });
  });
});
