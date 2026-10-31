import { z } from "zod";

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 270;
const MIN_WIDTH = 160;
const MIN_HEIGHT = 90;

export const CameraSlotSchema = z
  .object({
    slot: z.number().int().min(0).max(8),
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    width: z.number().int().positive().max(CANVAS_WIDTH),
    height: z.number().int().positive().max(CANVAS_HEIGHT),
    zIndex: z.number().int().min(0),
    visible: z.boolean(),
    locked: z.boolean(),
    maintainAspectRatio: z.boolean(),
    aspectRatio: z.number().positive(),
    fitMode: z.enum(["cover", "contain"]),
    mirrored: z.boolean(),
    disconnectedPolicy: z.enum(["hide", "placeholder"]),
  })
  .strict()
  .refine((camera) => camera.x + camera.width <= CANVAS_WIDTH, "Camera exceeds canvas width")
  .refine((camera) => camera.y + camera.height <= CANVAS_HEIGHT, "Camera exceeds canvas height");

export type CameraSlot = z.infer<typeof CameraSlotSchema>;

export const CameraLayoutSchema = z
  .object({
    canvas: z.object({ width: z.literal(CANVAS_WIDTH), height: z.literal(CANVAS_HEIGHT) }).strict(),
    cameras: z.array(CameraSlotSchema).length(9),
  })
  .strict()
  .superRefine((layout, context) => {
    if (new Set(layout.cameras.map((camera) => camera.slot)).size !== 9) {
      context.addIssue({ code: "custom", path: ["cameras"], message: "Camera slots must be unique" });
    }
  });

export type CameraLayout = z.infer<typeof CameraLayoutSchema>;
export type CameraLayoutPatch = Partial<
  Pick<
    CameraSlot,
    | "x"
    | "y"
    | "width"
    | "height"
    | "zIndex"
    | "visible"
    | "locked"
    | "maintainAspectRatio"
    | "fitMode"
    | "mirrored"
    | "disconnectedPolicy"
  >
>;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(Math.round(value), minimum), maximum);
}

export function createDefaultLayout(): CameraLayout {
  const cameras = Array.from({ length: 9 }, (_, slot): CameraSlot => ({
    slot,
    x: (slot % 3) * 720,
    y: Math.floor(slot / 3) * 405,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    zIndex: slot,
    visible: true,
    locked: false,
    maintainAspectRatio: true,
    aspectRatio: 16 / 9,
    fitMode: "cover",
    mirrored: false,
    disconnectedPolicy: "hide",
  }));

  return CameraLayoutSchema.parse({
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    cameras,
  });
}

export function updateCameraLayout(
  layout: CameraLayout,
  slot: number,
  patch: CameraLayoutPatch,
): CameraLayout {
  const current = layout.cameras.find((camera) => camera.slot === slot);
  if (current === undefined) throw new Error("UNKNOWN_SLOT");

  if (current.locked && patch.locked !== false) return layout;

  let width = clamp(patch.width ?? current.width, MIN_WIDTH, CANVAS_WIDTH);
  let height = clamp(patch.height ?? current.height, MIN_HEIGHT, CANVAS_HEIGHT);
  const maintainAspectRatio = patch.maintainAspectRatio ?? current.maintainAspectRatio;

  if (maintainAspectRatio && patch.width !== undefined) {
    height = clamp(Math.floor(width / current.aspectRatio), MIN_HEIGHT, CANVAS_HEIGHT);
  } else if (maintainAspectRatio && patch.height !== undefined) {
    width = clamp(Math.floor(height * current.aspectRatio), MIN_WIDTH, CANVAS_WIDTH);
  }

  const x = clamp(patch.x ?? current.x, 0, CANVAS_WIDTH - width);
  const y = clamp(patch.y ?? current.y, 0, CANVAS_HEIGHT - height);
  const next: CameraSlot = {
    ...current,
    ...patch,
    x,
    y,
    width,
    height,
    maintainAspectRatio,
  };

  return CameraLayoutSchema.parse({
    ...layout,
    cameras: layout.cameras.map((camera) => (camera.slot === slot ? next : camera)),
  });
}
