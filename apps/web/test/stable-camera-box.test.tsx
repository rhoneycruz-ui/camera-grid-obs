import "@testing-library/jest-dom/vitest";

import { createDefaultLayout } from "@camera-grid/domain";
import type { SessionSnapshot } from "@camera-grid/protocol";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CameraBox } from "../src/composition/CameraBox.js";
import { LogicalCanvas } from "../src/composition/LogicalCanvas.js";

describe("CameraBox", () => {
  it("updates geometry without replacing its mounted media node", () => {
    const { getByTestId, rerender } = render(
      <CameraBox participantId="participant-1" rect={{ x: 0, y: 0, width: 480, height: 270 }} />,
    );
    const media = getByTestId("camera-media-participant-1");

    rerender(
      <CameraBox participantId="participant-1" rect={{ x: 400, y: 200, width: 640, height: 360 }} />,
    );

    expect(getByTestId("camera-media-participant-1")).toBe(media);
    expect(getByTestId("camera-box-participant-1")).toHaveStyle({
      transform: "translate(400px, 200px)",
      width: "640px",
      height: "360px",
    });
  });

  it("keeps the exact media iframe mounted while visibility changes", () => {
    class ResizeObserverStub {
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
    const visible: SessionSnapshot = {
      sessionId: "session-1",
      revision: 0,
      status: "ACTIVE",
      directorOnline: true,
      outputAccess: "ACTIVE",
      participants: {
        "participant-1": {
          id: "participant-1",
          streamId: "stream-1",
          slot: 0,
          visible: true,
          publicationStatus: "CONNECTED",
        },
      },
      layout: createDefaultLayout(),
    };
    const { container, getByTitle, rerender } = render(
      <LogicalCanvas
        snapshot={visible}
        renderCamera={() => <iframe title="stable-vdo-frame" src="about:blank" />}
      />,
    );
    const frame = getByTitle("stable-vdo-frame");

    rerender(
      <LogicalCanvas
        snapshot={{
          ...visible,
          revision: 1,
          participants: {
            "participant-1": { ...visible.participants["participant-1"]!, visible: false },
          },
        }}
        renderCamera={() => <iframe title="stable-vdo-frame" src="about:blank" />}
      />,
    );

    expect(getByTitle("stable-vdo-frame")).toBe(frame);
    expect(container.querySelector('[data-testid="camera-box-participant-1"]')).toHaveStyle({
      visibility: "hidden",
    });
  });
});
