import { describe, expect, it } from "vitest";

import { CameraLayoutSchema, createDefaultLayout, updateCameraLayout } from "../src/index.js";

describe("canonical 1920x1080 layout", () => {
  it("creates exactly nine stable slots inside the canvas", () => {
    const layout = createDefaultLayout();

    expect(layout.canvas).toEqual({ width: 1920, height: 1080 });
    expect(layout.cameras).toHaveLength(9);
    expect(layout.cameras.map((camera) => camera.slot)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(() => CameraLayoutSchema.parse(layout)).not.toThrow();
  });

  it("clamps geometry and preserves 16:9 when aspect lock is enabled", () => {
    const layout = createDefaultLayout();
    const updated = updateCameraLayout(layout, 0, {
      x: -100,
      y: 900,
      width: 1000,
      height: 100,
    });

    expect(updated.cameras[0]).toMatchObject({
      x: 0,
      y: 518,
      width: 1000,
      height: 562,
    });
  });

  it("does not change geometry while a camera is locked", () => {
    const layout = createDefaultLayout();
    const locked = updateCameraLayout(layout, 0, { locked: true });
    const moved = updateCameraLayout(locked, 0, { x: 500, y: 500, width: 900 });

    expect(moved.cameras[0]).toEqual(locked.cameras[0]);
  });

  it("supports z-order and presentation policies without changing geometry", () => {
    const layout = createDefaultLayout();
    const updated = updateCameraLayout(layout, 3, {
      zIndex: 99,
      fitMode: "contain",
      mirrored: true,
      disconnectedPolicy: "placeholder",
    });

    expect(updated.cameras[3]).toMatchObject({
      zIndex: 99,
      fitMode: "contain",
      mirrored: true,
      disconnectedPolicy: "placeholder",
    });
    expect(() => CameraLayoutSchema.parse(updated)).not.toThrow();
  });
});
