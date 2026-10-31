export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  width: number;
  height: number;
}

const LOGICAL_WIDTH = 1920;
const LOGICAL_HEIGHT = 1080;

export function logicalCanvasScale(stageWidth: number): number {
  return stageWidth / LOGICAL_WIDTH;
}

function transform(viewport: Viewport) {
  const scale = Math.min(viewport.width / LOGICAL_WIDTH, viewport.height / LOGICAL_HEIGHT);
  return {
    scale,
    offsetX: (viewport.width - LOGICAL_WIDTH * scale) / 2,
    offsetY: (viewport.height - LOGICAL_HEIGHT * scale) / 2,
  };
}

export function previewToLogical(point: Point, viewport: Viewport): Point {
  const { scale, offsetX, offsetY } = transform(viewport);
  return { x: (point.x - offsetX) / scale, y: (point.y - offsetY) / scale };
}

export function logicalToPreview(point: Point, viewport: Viewport): Point {
  const { scale, offsetX, offsetY } = transform(viewport);
  return { x: point.x * scale + offsetX, y: point.y * scale + offsetY };
}
