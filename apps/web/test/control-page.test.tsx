import "@testing-library/jest-dom/vitest";

import { createDefaultLayout } from "@camera-grid/domain";
import type { SessionSnapshot } from "@camera-grid/protocol";
import { fireEvent, render } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

const send = vi.fn();
const snapshot: SessionSnapshot = {
  sessionId: "session-1",
  revision: 4,
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

vi.mock("../src/ws/useSession.js", () => ({
  useSession: () => ({ snapshot, status: "connected", send }),
}));

import { ControlPage } from "../src/routes/ControlPage.js";

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
});

describe("ControlPage", () => {
  it("sends revisioned move and resize commands from the panel", () => {
    const { getByRole } = render(<ControlPage capability="panel-test-only" />);

    fireEvent.click(getByRole("button", { name: "MOVER +20 PX" }));
    fireEvent.click(getByRole("button", { name: "AMPLIAR +20 PX" }));

    expect(send).toHaveBeenNthCalledWith(1, {
      type: "UPDATE_CAMERA_GEOMETRY",
      expectedRevision: 4,
      participantId: "participant-1",
      geometry: { x: 20 },
    });
    expect(send).toHaveBeenNthCalledWith(2, {
      type: "UPDATE_CAMERA_GEOMETRY",
      expectedRevision: 4,
      participantId: "participant-1",
      geometry: { width: 500 },
    });
  });
});
