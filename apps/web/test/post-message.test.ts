import { describe, expect, it } from "vitest";

import { validateVdoMessage } from "../src/vdo/post-message.js";

describe("validateVdoMessage", () => {
  it("accepts a documented event only from the exact VDO origin and iframe window", () => {
    const frameWindow = {} as Window;
    const event = {
      origin: "https://vdo.ninja",
      source: frameWindow,
      data: { action: "guest-connected", streamID: "stream-1" },
    } as unknown as MessageEvent;

    expect(validateVdoMessage(event, frameWindow, "https://vdo.ninja")).toMatchObject({
      action: "guest-connected",
      streamID: "stream-1",
    });
  });

  it("rejects forged origin, wrong window, and invalid payload", () => {
    const frameWindow = {} as Window;
    const base = { source: frameWindow, data: { action: "guest-connected", streamID: "stream-1" } };
    expect(
      validateVdoMessage(
        { ...base, origin: "https://evil.example" } as unknown as MessageEvent,
        frameWindow,
        "https://vdo.ninja",
      ),
    ).toBeUndefined();
    expect(
      validateVdoMessage(
        { ...base, origin: "https://vdo.ninja", source: {} } as unknown as MessageEvent,
        frameWindow,
        "https://vdo.ninja",
      ),
    ).toBeUndefined();
    expect(
      validateVdoMessage(
        { ...base, origin: "https://vdo.ninja", data: { action: "eval" } } as unknown as MessageEvent,
        frameWindow,
        "https://vdo.ninja",
      ),
    ).toBeUndefined();
  });
});
