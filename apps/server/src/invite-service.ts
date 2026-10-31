import { createSnapshot } from "@camera-grid/protocol";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { authorizeConnection, type AuthConfig } from "./auth.js";
import type { SessionService } from "./session-service.js";

function bearer(request: FastifyRequest): string {
  const header = request.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function authorized(
  request: FastifyRequest,
  role: "panel" | "output",
  auth: AuthConfig,
): boolean {
  return authorizeConnection(
    {
      remoteAddress: request.ip,
      origin: request.headers.origin ?? "",
      role,
      capability: bearer(request),
    },
    auth,
  ).ok;
}

export function registerLocalRoutes(
  app: FastifyInstance,
  service: SessionService,
  auth: AuthConfig,
): void {
  app.post<{ Params: { inviteId: string } }>("/api/invites/:inviteId/revoke", async (request, reply) => {
    if (!authorized(request, "panel", auth)) return reply.code(403).send({ code: "FORBIDDEN" });
    const result = await service.apply({
      type: "REVOKE_INVITE",
      expectedRevision: service.snapshot().revision,
      inviteId: request.params.inviteId,
    });
    return reply.code(result.ok ? 200 : 409).send({
      ok: result.ok,
      ...(!result.ok ? { code: result.code } : { effects: result.effects }),
      revision: result.state.revision,
    });
  });

  app.post<{ Params: { sessionId: string } }>("/api/sessions/:sessionId/end", async (request, reply) => {
    if (!authorized(request, "panel", auth)) return reply.code(403).send({ code: "FORBIDDEN" });
    if (request.params.sessionId !== service.snapshot().sessionId) {
      return reply.code(404).send({ code: "NOT_FOUND" });
    }
    const result = await service.apply({
      type: "END_SESSION",
      expectedRevision: service.snapshot().revision,
    });
    return reply.code(result.ok ? 200 : 409).send({
      ok: result.ok,
      ...(!result.ok ? { code: result.code } : { effects: result.effects }),
      revision: result.state.revision,
    });
  });

  app.get<{ Params: { sessionId: string } }>("/output/:sessionId", async (request, reply) => {
    if (!authorized(request, "output", auth)) return reply.code(403).send({ code: "FORBIDDEN" });
    if (service.snapshot().outputAccess === "REVOKED") {
      return reply.code(403).send({ code: "OUTPUT_ACCESS_REVOKED" });
    }
    if (request.params.sessionId !== service.snapshot().sessionId) {
      return reply.code(404).send({ code: "NOT_FOUND" });
    }
    return createSnapshot(service.snapshot());
  });

  app.post("/api/sessions", async (request, reply) => {
    if (!authorized(request, "panel", auth)) return reply.code(403).send({ code: "FORBIDDEN" });
    return reply.code(200).send(createSnapshot(service.snapshot()));
  });
}
