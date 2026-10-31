import "@testing-library/jest-dom/vitest";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VdoViewerFrame } from "../src/vdo/VdoViewerFrame.js";

describe("VdoViewerFrame", () => {
  it("creates a clean video-only receiver without camera or microphone permission", () => {
    const { getByTitle } = render(
      <VdoViewerFrame
        streamId="stream-1"
        roomId="ProductionRoom1"
        roomPassword="DemoOnly123"
      />,
    );
    const frame = getByTitle("Vídeo de stream-1") as HTMLIFrameElement;
    const allow = frame.getAttribute("allow") ?? "";
    const url = new URL(frame.src);

    expect(url.searchParams.has("noaudio")).toBe(true);
    expect(url.searchParams.has("cleanoutput")).toBe(true);
    expect(allow).toContain("autoplay");
    expect(allow).not.toContain("camera");
    expect(allow).not.toContain("microphone");
  });
});
