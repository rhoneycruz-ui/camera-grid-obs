import websocket from "@fastify/websocket";
import Fastify, { type FastifyInstance } from "fastify";

import type { SessionState } from "@camera-grid/domain";

import type { AuthConfig } from "./auth.js";
import { registerLocalRoutes } from "./invite-service.js";
import { SessionService } from "./session-service.js";
import { registerWebSocketGateway } from "./ws-gateway.js";

export interface ServerConfig {
  state: SessionState;
  auth: AuthConfig;
}

export async function createServer(config: ServerConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, bodyLimit: 64 * 1024 });
  const service = new SessionService(config.state);

  await app.register(websocket, { options: { maxPayload: 64 * 1024 } });
  registerWebSocketGateway(app, service, config.auth);
  registerLocalRoutes(app, service, config.auth);
  app.get("/health", async () => ({ ok: true }));

  return app;
}
