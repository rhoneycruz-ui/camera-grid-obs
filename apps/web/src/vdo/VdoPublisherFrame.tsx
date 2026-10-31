import { buildGuestUrl } from "@camera-grid/vdo";

export interface VdoPublisherFrameProps {
  streamId: string;
  roomId: string;
  roomPassword?: string;
}

export function VdoPublisherFrame({ streamId, roomId, roomPassword }: VdoPublisherFrameProps) {
  const src = buildGuestUrl({
    streamId,
    roomId,
    ...(roomPassword === undefined ? {} : { roomPassword }),
    profile: "economy",
  }).toString();

  return (
    <iframe
      className="vdo-publisher-frame"
      title="Publicação da câmera"
      src={src}
      allow="camera; autoplay; fullscreen"
      referrerPolicy="strict-origin"
    />
  );
}
