import { useState } from "react";

import { VdoPublisherFrame } from "../vdo/VdoPublisherFrame.js";

export interface GuestPageProps {
  streamId: string;
  roomId: string;
  roomPassword?: string;
}

export function GuestPage({ streamId, roomId, roomPassword }: GuestPageProps) {
  const [publishing, setPublishing] = useState(false);
  return (
    <main className="guest-page">
      <section className="guest-card">
        <p className="eyebrow">PROVA TÉCNICA / VDO DIRETO</p>
        <h1>Sua imagem na transmissão</h1>
        <p>
          Esta página compartilha somente a câmera pelo VDO.Ninja. Ela não usa seu microfone; a
          conversa continua no Discord.
        </p>
        <p className="spike-warning">
          Este link descartável ainda não é a fronteira de autorização local. Revogar no painel
          não bloqueia acesso direto ao VDO.Ninja com dados de destino já conhecidos.
        </p>
        {publishing ? (
          <VdoPublisherFrame
            streamId={streamId}
            roomId={roomId}
            {...(roomPassword === undefined ? {} : { roomPassword })}
          />
        ) : (
          <button className="primary-action" type="button" onClick={() => setPublishing(true)}>
            Abrir minha câmera
          </button>
        )}
      </section>
    </main>
  );
}
