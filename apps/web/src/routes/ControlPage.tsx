import { useSession } from "../ws/useSession.js";
import { LogicalCanvas } from "../composition/LogicalCanvas.js";

export function ControlPage({ capability }: { capability: string }) {
  const { snapshot, status, pending, lastError, send } = useSession("panel", capability);
  return (
    <main className="control-workbench">
      <header className="topbar">
        <div>
          <p className="eyebrow">CAMERA GRID / CONTROLE LOCAL</p>
          <h1>Mesa de composição</h1>
        </div>
        <span className={`connection-status is-${status}`}>{status}</span>
      </header>
      {lastError !== undefined && <p className="command-error">Comando rejeitado: {lastError}</p>}
      {snapshot === undefined ? (
        <section className="empty-state">Aguardando snapshot seguro do servidor local…</section>
      ) : (
        <div className="workspace-grid">
          <LogicalCanvas snapshot={snapshot} />
          <aside className="signal-rail" aria-label="Câmeras">
            <p className="rail-title">SINAIS</p>
            {Object.values(snapshot.participants).map((participant) => (
              <div className="signal-item" key={participant.id}>
                <button
                  type="button"
                  className="signal-row"
                  disabled={pending}
                  onClick={() =>
                    send({
                      type: "SET_VISIBILITY",
                      expectedRevision: snapshot.revision,
                      participantId: participant.id,
                      visible: !participant.visible,
                    })
                  }
                >
                  <span>CAM {participant.slot + 1}</span>
                  <strong>{participant.visible ? "NO AR" : "OCULTA"}</strong>
                </button>
                <button
                  type="button"
                  className="geometry-action"
                  disabled={pending}
                  onClick={() => {
                    const camera = snapshot.layout.cameras.find(
                      (item) => item.slot === participant.slot,
                    );
                    if (camera === undefined) return;
                    send({
                      type: "UPDATE_CAMERA_GEOMETRY",
                      expectedRevision: snapshot.revision,
                      participantId: participant.id,
                      geometry: { x: camera.x + 20 },
                    });
                  }}
                >
                  MOVER +20 PX
                </button>
                <button
                  type="button"
                  className="geometry-action"
                  disabled={pending}
                  onClick={() => {
                    const camera = snapshot.layout.cameras.find(
                      (item) => item.slot === participant.slot,
                    );
                    if (camera === undefined) return;
                    send({
                      type: "UPDATE_CAMERA_GEOMETRY",
                      expectedRevision: snapshot.revision,
                      participantId: participant.id,
                      geometry: { width: camera.width + 20 },
                    });
                  }}
                >
                  AMPLIAR +20 PX
                </button>
              </div>
            ))}
          </aside>
        </div>
      )}
    </main>
  );
}
