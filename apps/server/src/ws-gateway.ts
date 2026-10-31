import type { FastifyInstance } from "fastify";
import type WebSocket from "ws";

import { ClientMessageSchema, createSnapshot, type ServerMessage } from "@camera-grid/protocol";

import { authorizeConnection, type AuthConfig } from "./auth.js";
import type { SessionService } from "./session-service.js";

interface ClientContext {
  authenticated: boolean;
  canMutate: boolean;
}

function send(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

export function registerWebSocketGateway(
  app: FastifyInstance,
  service: SessionService,
  auth: AuthConfig,
): void {
  const clients = new Map<WebSocket, ClientContext>();

  app.get("/ws", { websocket: true }, (socket, request) => {
    clients.set(socket, { authenticated: false, canMutate: false });

    socket.on("close", () => clients.delete(socket));
    socket.on("message", (raw) => {
      let parsed: ReturnType<typeof ClientMessageSchema.safeParse>;
      try {
        parsed = ClientMessageSchema.safeParse(JSON.parse(raw.toString()));
      } catch {
        socket.close(1008, "INVALID_MESSAGE");
        return;
      }
      if (!parsed.success) {
        socket.close(1008, "INVALID_MESSAGE");
        return;
      }

      const context = clients.get(socket)!;
      const message = parsed.data;
      if (!context.authenticated) {
        if (message.type !== "hello") {
          socket.close(1008, "HELLO_REQUIRED");
          return;
        }
        const result = authorizeConnection(
          {
            remoteAddress: request.socket.remoteAddress ?? "",
            origin: request.headers.origin ?? "",
            role: message.role,
            capability: message.capability,
          },
          auth,
        );
        if (!result.ok) {
          socket.close(1008, "FORBIDDEN");
          return;
        }
        context.authenticated = true;
        context.canMutate = result.canMutate;
        send(socket, { version: 1, type: "snapshot", state: createSnapshot(service.snapshot()) });
        return;
      }

      if (message.type !== "command") return;
      if (!context.canMutate) {
        send(socket, {
          version: 1,
          type: "commandResult",
          requestId: message.requestId,
          ok: false,
          code: "FORBIDDEN",
          revision: service.snapshot().revision,
        });
        return;
      }

      const result = service.apply(message.command);
      send(socket, {
        version: 1,
        type: "commandResult",
        requestId: message.requestId,
        ok: result.ok,
        ...(!result.ok ? { code: result.code } : {}),
        revision: result.state.revision,
      });
      if (result.ok) {
        const snapshot: ServerMessage = {
          version: 1,
          type: "snapshot",
          state: createSnapshot(result.state),
        };
        for (const [client, clientContext] of clients) {
          if (clientContext.authenticated && client !== socket) send(client, snapshot);
        }
      }
    });
  });
}
