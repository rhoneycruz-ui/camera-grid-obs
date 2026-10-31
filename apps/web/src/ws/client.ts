import { ServerMessageSchema, type ServerMessage, type SessionSnapshot } from "@camera-grid/protocol";
import type { SessionCommand } from "@camera-grid/domain";

export interface SessionClient {
  send(command: SessionCommand): boolean;
  close(): void;
}

export type SessionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "forbidden"
  | "protocol-error";

export function connectSession(options: {
  role: "panel" | "output";
  capability: string;
  onSnapshot(snapshot: SessionSnapshot): void;
  onStatus(status: SessionStatus): void;
  onCommandState?(state: { pending: boolean; error?: string }): void;
}): SessionClient {
  const endpoint = import.meta.env["VITE_WS_URL"] ?? "ws://127.0.0.1:4174/ws";
  let request = 0;
  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let socket: WebSocket | undefined;
  let stopped = false;
  let pending = false;
  let protocolFailure = false;

  const setCommandState = (nextPending: boolean, error?: string) => {
    pending = nextPending;
    options.onCommandState?.({ pending: nextPending, ...(error === undefined ? {} : { error }) });
  };

  const open = () => {
    if (stopped) return;
    options.onStatus(reconnectAttempt === 0 ? "connecting" : "disconnected");
    const current = new WebSocket(endpoint);
    socket = current;
    current.addEventListener("open", () => {
      current.send(
        JSON.stringify({
          version: 1,
          type: "hello",
          role: options.role,
          capability: options.capability,
        }),
      );
    });
    current.addEventListener("message", (event) => {
      let parsed: ReturnType<typeof ServerMessageSchema.safeParse>;
      try {
        parsed = ServerMessageSchema.safeParse(JSON.parse(String(event.data)));
      } catch {
        protocolFailure = true;
        options.onStatus("protocol-error");
        current.close(1008, "INVALID_SERVER_MESSAGE");
        return;
      }
      if (!parsed.success) {
        protocolFailure = true;
        options.onStatus("protocol-error");
        current.close(1008, "INVALID_SERVER_MESSAGE");
        return;
      }
      const message: ServerMessage = parsed.data;
      options.onStatus("connected");
      if (message.type === "commandResult" && !message.ok) {
        setCommandState(false, message.code ?? "COMMAND_REJECTED");
      }
      if (message.type === "snapshot") {
        reconnectAttempt = 0;
        setCommandState(false);
        options.onSnapshot(message.state);
      }
    });
    current.addEventListener("close", (event) => {
      if (socket !== current || stopped) return;
      setCommandState(false);
      if (!protocolFailure) options.onStatus(event.code === 1008 ? "forbidden" : "disconnected");
      protocolFailure = false;
      if (event.code === 1008) return;
      const delay = Math.min(250 * 2 ** reconnectAttempt, 4_000);
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(open, delay);
    });
  };

  open();
  return {
    send(command) {
      if (socket?.readyState !== WebSocket.OPEN || pending) return false;
      setCommandState(true);
      socket.send(
        JSON.stringify({
          version: 1,
          type: "command",
          requestId: `web-${++request}`,
          command,
        }),
      );
      return true;
    },
    close() {
      stopped = true;
      if (reconnectTimer !== undefined) clearTimeout(reconnectTimer);
      socket?.close();
    },
  };
}
