import { describe, expect, it } from "vitest";

import {
  logicalCanvasScale,
  logicalToPreview,
  previewToLogical,
} from "../src/composition/coordinates.js";

describe("logical canvas coordinates", () => {
  it.each([
    [{ width: 1920, height: 1080 }, { x: 720, y: 405 }],
    [{ width: 960, height: 540 }, { x: 360, y: 202.5 }],
    [{ width: 1000, height: 700 }, { x: 375, y: 240.625 }],
  ])("round-trips through viewport %o", (viewport, previewPoint) => {
    const logical = previewToLogical(previewPoint, viewport);
    const roundTrip = logicalToPreview(logical, viewport);

    expect(roundTrip.x).toBeCloseTo(previewPoint.x, 5);
    expect(roundTrip.y).toBeCloseTo(previewPoint.y, 5);
  });

  it("accounts for horizontal or vertical letterboxing", () => {
    const topLeft = previewToLogical({ x: 0, y: 68.75 }, { width: 1000, height: 700 });
    const bottomRight = previewToLogical({ x: 1000, y: 631.25 }, { width: 1000, height: 700 });
    expect(topLeft.x).toBeCloseTo(0, 5);
    expect(topLeft.y).toBeCloseTo(0, 5);
    expect(bottomRight.x).toBeCloseTo(1920, 5);
    expect(bottomRight.y).toBeCloseTo(1080, 5);
  });

  it("scales a 1920px logical canvas to the measured stage width", () => {
    expect(logicalCanvasScale(1920)).toBe(1);
    expect(logicalCanvasScale(960)).toBe(0.5);
    expect(logicalCanvasScale(1280)).toBeCloseTo(2 / 3, 8);
  });
});
