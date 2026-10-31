import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { createSession, issueInvite } from "@camera-grid/domain";

import { LayoutStore } from "../src/layout-store.js";

const directories: string[] = [];

async function tempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "camera-grid-store-"));
  directories.push(directory);
  return directory;
}

function session(revision = 0) {
  const { invite } = issueInvite({ participantId: "participant-1", streamId: "stream-1", slot: 0 });
  return { ...createSession({ sessionId: "session-1", invites: [invite] }), revision };
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("LayoutStore", () => {
  it("writes atomically and skips a semantically identical state", async () => {
    const directory = await tempDirectory();
    const store = new LayoutStore(directory);
    const value = session();

    await expect(store.save(value)).resolves.toBe("written");
    await expect(store.save(value)).resolves.toBe("unchanged");
    await expect(readFile(join(directory, "session.json"), "utf8")).resolves.toContain('"sessionId":"session-1"');
  });

  it("recovers the previous valid snapshot when the primary JSON is truncated", async () => {
    const directory = await tempDirectory();
    const store = new LayoutStore(directory);
    await store.save(session(1));
    await store.save(session(2));
    await writeFile(join(directory, "session.json"), '{"truncated":', "utf8");

    const recovered = await store.load();

    expect(recovered?.revision).toBe(1);
  });
});
