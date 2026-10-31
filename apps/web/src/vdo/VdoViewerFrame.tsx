import { buildViewerUrl } from "@camera-grid/vdo";

export interface VdoViewerFrameProps {
  streamId: string;
  roomId: string;
  roomPassword?: string;
}

export function VdoViewerFrame({ streamId, roomId, roomPassword }: VdoViewerFrameProps) {
  const src = buildViewerUrl({
    streamId,
    roomId,
    ...(roomPassword === undefined ? {} : { roomPassword }),
    videoBitrateKbps: 1200,
  }).toString();
  return (
    <iframe
      className="vdo-viewer-frame"
      title={`Vídeo de ${streamId}`}
      src={src}
      allow="autoplay; fullscreen"
      referrerPolicy="strict-origin"
    />
  );
}
