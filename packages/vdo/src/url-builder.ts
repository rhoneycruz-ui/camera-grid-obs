import {
  GuestUrlInputSchema,
  ViewerUrlInputSchema,
  type GuestUrlInput,
  type ViewerUrlInput,
} from "./contracts.js";

const DEFAULT_ORIGIN = "https://vdo.ninja";

const guestProfiles = {
  economy: {
    quality: "2",
    maxframerate: "30",
    maxvideobitrate: "1200",
  },
  quality: {
    quality: "1",
    maxframerate: "30",
    maxvideobitrate: "2500",
  },
} as const;

export function buildGuestUrl(input: GuestUrlInput): URL {
  const parsed = GuestUrlInputSchema.parse(input);
  const profile = guestProfiles[parsed.profile ?? "economy"];
  const url = new URL(parsed.origin ?? DEFAULT_ORIGIN);

  url.searchParams.set("push", parsed.streamId);
  url.searchParams.set("room", parsed.roomId);
  if (parsed.roomPassword !== undefined) {
    url.searchParams.set("password", parsed.roomPassword);
  }
  url.searchParams.set("audiodevice", "0");
  url.searchParams.set("webcam2", "");
  url.searchParams.set("quality", profile.quality);
  url.searchParams.set("maxframerate", profile.maxframerate);
  url.searchParams.set("maxvideobitrate", profile.maxvideobitrate);

  return url;
}

export function buildViewerUrl(input: ViewerUrlInput): URL {
  const parsed = ViewerUrlInputSchema.parse(input);
  const url = new URL(parsed.origin ?? DEFAULT_ORIGIN);

  url.searchParams.set("room", parsed.roomId);
  if (parsed.roomPassword !== undefined) {
    url.searchParams.set("password", parsed.roomPassword);
  }
  if (parsed.streamId !== undefined) {
    url.searchParams.set("view", parsed.streamId);
  } else {
    url.searchParams.set("scene", String(parsed.scene));
  }
  url.searchParams.set("noaudio", "");
  url.searchParams.set("cleanoutput", "");
  url.searchParams.set("videobitrate", String(parsed.videoBitrateKbps ?? 1200));

  return url;
}
