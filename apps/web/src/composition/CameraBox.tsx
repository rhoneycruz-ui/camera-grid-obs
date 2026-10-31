export interface CameraRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CameraBoxProps {
  participantId: string;
  rect: CameraRect;
  visible?: boolean;
  children?: React.ReactNode;
}

export function CameraBox({ participantId, rect, visible = true, children }: CameraBoxProps) {
  return (
    <div
      className="camera-box"
      data-testid={`camera-box-${participantId}`}
      aria-hidden={!visible}
      style={{
        transform: `translate(${rect.x}px, ${rect.y}px)`,
        width: rect.width,
        height: rect.height,
        visibility: visible ? "visible" : "hidden",
      }}
    >
      <div className="camera-media" data-testid={`camera-media-${participantId}`}>
        {children}
      </div>
    </div>
  );
}
