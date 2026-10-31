import { useEffect, useRef, useState } from "react";
import type { SessionCommand } from "@camera-grid/domain";
import type { SessionSnapshot } from "@camera-grid/protocol";

import { connectSession, type SessionClient, type SessionStatus } from "./client.js";

export function useSession(role: "panel" | "output", capability: string) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>();
  const [status, setStatus] = useState<SessionStatus>("connecting");
  const [pending, setPending] = useState(false);
  const [lastError, setLastError] = useState<string>();
  const client = useRef<SessionClient | undefined>(undefined);

  useEffect(() => {
    client.current = connectSession({
      role,
      capability,
      onSnapshot: setSnapshot,
      onStatus: setStatus,
      onCommandState: ({ pending: nextPending, error }) => {
        setPending(nextPending);
        setLastError(error);
      },
    });
    return () => client.current?.close();
  }, [role, capability]);

  return {
    snapshot,
    status,
    pending,
    lastError,
    send(command: SessionCommand) {
      return client.current?.send(command) ?? false;
    },
  };
}
