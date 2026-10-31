import { describe, expect, it } from "vitest";

import { buildGuestUrl, buildViewerUrl } from "../src/index.js";

describe("buildGuestUrl", () => {
  it("creates an allowlisted video-only sender URL", () => {
    const result = new URL(
      buildGuestUrl({
        streamId: "guest-01",
        roomId: "camera-grid-demo",
        roomPassword: "DemoOnly123",
        profile: "economy",
      }),
    );

    expect(result.origin).toBe("https://vdo.ninja");
    expect(result.searchParams.get("push")).toBe("guest-01");
    expect(result.searchParams.get("room")).toBe("camera-grid-demo");
    expect(result.searchParams.get("password")).toBe("DemoOnly123");
    expect(result.searchParams.get("audiodevice")).toBe("0");
    expect(result.searchParams.has("webcam2")).toBe(true);
    expect(result.searchParams.get("quality")).toBe("2");
    expect(result.searchParams.get("maxframerate")).toBe("30");
    expect(result.searchParams.get("maxvideobitrate")).toBe("1200");
    expect(result.searchParams.has("director")).toBe(false);
    expect(result.searchParams.has("broadcast")).toBe(false);
  });

  it("rejects unsafe identifiers instead of accepting free-form query data", () => {
    expect(() =>
      buildGuestUrl({ streamId: "guest&director=secret", roomId: "room" }),
    ).toThrow();
  });

  it("rejects room passwords outside VDO.Ninja's documented format", () => {
    expect(() =>
      buildGuestUrl({
        streamId: "guest",
        roomId: "room",
        roomPassword: "contains-symbols!",
      }),
    ).toThrow();
  });

  it("accepts only a credential-free HTTPS origin, not a path or insecure URL", () => {
    expect(() =>
      buildGuestUrl({
        origin: "http://vdo.ninja",
        streamId: "guest",
        roomId: "room",
      }),
    ).toThrow();
    expect(() =>
      buildGuestUrl({
        origin: "https://vdo.ninja/alpha",
        streamId: "guest",
        roomId: "room",
      }),
    ).toThrow();
  });
});

describe("buildViewerUrl", () => {
  it("creates a clean, muted OBS viewer URL", () => {
    const result = new URL(
      buildViewerUrl({
        streamId: "guest-01",
        roomId: "camera-grid-demo",
        roomPassword: "DemoOnly123",
        videoBitrateKbps: 1200,
      }),
    );

    expect(result.origin).toBe("https://vdo.ninja");
    expect(result.searchParams.get("view")).toBe("guest-01");
    expect(result.searchParams.get("room")).toBe("camera-grid-demo");
    expect(result.searchParams.get("password")).toBe("DemoOnly123");
    expect(result.searchParams.has("noaudio")).toBe(true);
    expect(result.searchParams.has("cleanoutput")).toBe(true);
    expect(result.searchParams.get("videobitrate")).toBe("1200");
  });

  it("supports an allowlisted scene receiver without a stream id", () => {
    const result = new URL(
      buildViewerUrl({
        roomId: "camera-grid-demo",
        scene: 0,
      }),
    );

    expect(result.searchParams.get("scene")).toBe("0");
    expect(result.searchParams.has("view")).toBe(false);
  });

  it("requires exactly one receiver target", () => {
    expect(() => buildViewerUrl({ roomId: "room" })).toThrow();
    expect(() =>
      buildViewerUrl({ roomId: "room", streamId: "guest", scene: 1 }),
    ).toThrow();
  });
});
