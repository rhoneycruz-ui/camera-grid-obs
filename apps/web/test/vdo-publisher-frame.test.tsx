import "@testing-library/jest-dom/vitest";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VdoPublisherFrame } from "../src/vdo/VdoPublisherFrame.js";

describe("VdoPublisherFrame", () => {
  it("allows the camera but never grants microphone permission", () => {
    const { getByTitle } = render(
      <VdoPublisherFrame
        streamId="stream-1"
        roomId="LobbyRoom1"
        roomPassword="DemoOnly123"
      />,
    );
    const frame = getByTitle("Publicação da câmera") as HTMLIFrameElement;
    const allow = frame.getAttribute("allow") ?? "";

    expect(allow).toContain("camera");
    expect(allow).toContain("autoplay");
    expect(allow).toContain("fullscreen");
    expect(allow).not.toContain("microphone");
    expect(new URL(frame.src).searchParams.get("audiodevice")).toBe("0");
  });
});
