import type { SessionSnapshot } from "@camera-grid/protocol";

import { LogicalCanvas } from "../composition/LogicalCanvas.js";
import { VdoViewerFrame } from "../vdo/VdoViewerFrame.js";
import { VdoSceneFrame } from "../vdo/VdoSceneFrame.js";
import { useSession } from "../ws/useSession.js";

export function OutputPage({
  capability,
  roomId,
  roomPassword,
  receiverStrategy = "individual-viewers",
}: {
  capability: string;
  roomId?: string;
  roomPassword?: string;
  receiverStrategy?: "individual-viewers" | "native-scene";
}) {
  const { snapshot, status } = useSession("output", capability);
  const authorized = status === "connected" && snapshot?.outputAccess === "ACTIVE";
  if (!authorized) return <main className="obs-output" />;
  if (receiverStrategy === "native-scene" && roomId !== undefined) {
    return (
      <main className="obs-output">
        <VdoSceneFrame
          roomId={roomId}
          {...(roomPassword === undefined ? {} : { roomPassword })}
        />
      </main>
    );
  }
  return (
    <main className="obs-output">
      {snapshot && (
        <LogicalCanvas
          snapshot={snapshot}
          {...(roomId === undefined
            ? {}
            : {
                renderCamera: (participant: SessionSnapshot["participants"][string]) => (
                  <VdoViewerFrame
                    streamId={participant.streamId}
                    roomId={roomId}
                    {...(roomPassword === undefined ? {} : { roomPassword })}
                  />
                ),
              })}
        />
      )}
    </main>
  );
}
