import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { SessionSnapshot } from "@camera-grid/protocol";

import { CameraBox } from "./CameraBox.js";
import { logicalCanvasScale } from "./coordinates.js";

type SnapshotParticipant = SessionSnapshot["participants"][string];

export function LogicalCanvas({
  snapshot,
  renderCamera,
}: {
  snapshot: SessionSnapshot;
  renderCamera?: (participant: SnapshotParticipant) => ReactNode;
}) {
  const shell = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = shell.current;
    if (element === null) return;
    const update = () => setScale(logicalCanvasScale(element.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="stage-shell" ref={shell}>
      <div
        className="logical-canvas"
        aria-label="Composição 1920 por 1080"
        style={{ transform: `scale(${scale})` }}
      >
        {Object.values(snapshot.participants).map((participant) => {
          const camera = snapshot.layout.cameras.find((item) => item.slot === participant.slot);
          if (camera === undefined) return null;
          return (
            <CameraBox
              key={participant.id}
              participantId={participant.id}
              visible={participant.visible}
              rect={{ x: camera.x, y: camera.y, width: camera.width, height: camera.height }}
            >
              {renderCamera?.(participant) ?? (
                <div className="signal-placeholder">
                  <span>CAM {participant.slot + 1}</span>
                  <small>{participant.publicationStatus}</small>
                </div>
              )}
            </CameraBox>
          );
        })}
      </div>
    </div>
  );
}
