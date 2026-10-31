import "@testing-library/jest-dom/vitest";

import { createDefaultLayout } from "@camera-grid/domain";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  current: {
    snapshot: undefined as unknown,
    status: "connected",
    send: vi.fn(),
  },
}));

vi.mock("../src/ws/useSession.js", () => ({
  useSession: () => session.current,
}));

import { Router } from "../src/router.js";

describe("output receiver selection", () => {
  it("selects the native scene candidate from the output query flag", () => {
    session.current = {
      snapshot: {
        sessionId: "session-1",
        revision: 0,
        status: "ACTIVE",
        directorOnline: false,
        outputAccess: "ACTIVE",
        participants: {},
        layout: createDefaultLayout(),
      },
      status: "connected",
      send: vi.fn(),
    };
    window.history.replaceState(
      {},
      "",
      "/output?cap=output-test&room=ProductionRoom1&password=DemoOnly123&receiver=scene",
    );

    const { getByTitle } = render(<Router />);
    const frame = getByTitle("Cena VDO 0") as HTMLIFrameElement;
    expect(new URL(frame.src).searchParams.get("scene")).toBe("0");
  });

  it("mounts no VDO receiver without an authenticated active output snapshot", () => {
    session.current = { snapshot: undefined, status: "forbidden", send: vi.fn() };
    window.history.replaceState(
      {},
      "",
      "/output?cap=revoked&room=ProductionRoom1&password=DemoOnly123&receiver=scene",
    );
    const scene = render(<Router />);
    expect(scene.container.querySelector("iframe")).toBeNull();
    scene.unmount();

    window.history.replaceState(
      {},
      "",
      "/output?cap=revoked&room=ProductionRoom1&password=DemoOnly123&receiver=individual",
    );
    const individual = render(<Router />);
    expect(individual.container.querySelector("iframe")).toBeNull();
  });
});
