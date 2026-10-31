import "@testing-library/jest-dom/vitest";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VdoSceneFrame } from "../src/vdo/VdoSceneFrame.js";

describe("VdoSceneFrame", () => {
  it("creates the alternate clean video-only native scene receiver", () => {
    const { getByTitle } = render(
      <VdoSceneFrame roomId="ProductionRoom1" roomPassword="DemoOnly123" scene={0} />,
    );
    const frame = getByTitle("Cena VDO 0") as HTMLIFrameElement;
    const url = new URL(frame.src);
    const allow = frame.getAttribute("allow") ?? "";

    expect(url.searchParams.get("scene")).toBe("0");
    expect(url.searchParams.has("noaudio")).toBe(true);
    expect(url.searchParams.has("cleanoutput")).toBe(true);
    expect(allow).not.toContain("camera");
    expect(allow).not.toContain("microphone");
  });
});
