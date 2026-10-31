import { createSession, issueInvite } from "@camera-grid/domain";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "../src/app.js";

const applications: Array<Awaited<ReturnType<typeof createServer>>> = [];

async function app() {
  const { invite } = issueInvite({ participantId: "participant-1", streamId: "stream-1", slot: 0 });
  const instance = await createServer({
    state: createSession({ sessionId: "session-1", invites: [invite] }),
    auth: {
      panelCapability: "panel-secret-test-only",
      outputCapability: "output-secret-test-only",
      allowedOrigins: ["http://127.0.0.1:4173"],
    },
  });
  applications.push(instance);
  return instance;
}

afterEach(async () => {
  await Promise.all(applications.splice(0).map((instance) => instance.close()));
});

describe("local HTTP access", () => {
  it("lets the panel revoke publication and lets output read only the public snapshot", async () => {
    const server = await app();
    const revoked = await server.inject({
      method: "POST",
      url: "/api/invites/participant-1%3A1/revoke",
      headers: {
        origin: "http://127.0.0.1:4173",
        authorization: "Bearer panel-secret-test-only",
      },
    });
    expect(revoked.statusCode).toBe(200);
    expect(revoked.json()).toMatchObject({ ok: true, revision: 1 });

    const output = await server.inject({
      method: "GET",
      url: "/output/session-1",
      headers: {
        origin: "http://127.0.0.1:4173",
        authorization: "Bearer output-secret-test-only",
      },
    });
    expect(output.statusCode).toBe(200);
    expect(output.json()).toMatchObject({
      revision: 1,
      participants: { "participant-1": { publicationStatus: "REVOKED", visible: false } },
    });
    expect(output.body).not.toContain("tokenHash");
  });

  it("does not let the output capability mutate or an external origin read", async () => {
    const server = await app();
    const outputWrite = await server.inject({
      method: "POST",
      url: "/api/sessions/session-1/end",
      headers: {
        origin: "http://127.0.0.1:4173",
        authorization: "Bearer output-secret-test-only",
      },
    });
    expect(outputWrite.statusCode).toBe(403);

    const externalRead = await server.inject({
      method: "GET",
      url: "/output/session-1",
      headers: {
        origin: "https://evil.example",
        authorization: "Bearer output-secret-test-only",
      },
    });
    expect(externalRead.statusCode).toBe(403);
  });
});
