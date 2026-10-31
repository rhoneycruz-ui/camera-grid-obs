import { buildViewerUrl } from "@camera-grid/vdo";

export function VdoSceneFrame({
  roomId,
  roomPassword,
  scene = 0,
}: {
  roomId: string;
  roomPassword?: string;
  scene?: number;
}) {
  const src = buildViewerUrl({
    roomId,
    scene,
    ...(roomPassword === undefined ? {} : { roomPassword }),
  }).toString();
  return (
    <iframe
      className="vdo-scene-frame"
      title={`Cena VDO ${scene}`}
      src={src}
      allow="autoplay; fullscreen"
      referrerPolicy="strict-origin"
    />
  );
}
