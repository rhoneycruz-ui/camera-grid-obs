import { randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { SessionStateSchema, type SessionState } from "@camera-grid/domain";

export class LayoutStore {
  readonly #primary: string;
  readonly #backup: string;

  constructor(private readonly directory: string) {
    this.#primary = join(directory, "session.json");
    this.#backup = join(directory, "session.backup.json");
  }

  async save(state: SessionState): Promise<"written" | "unchanged"> {
    const validated = SessionStateSchema.parse(state);
    const serialized = JSON.stringify(validated);
    await mkdir(this.directory, { recursive: true });

    try {
      if ((await readFile(this.#primary, "utf8")) === serialized) return "unchanged";
      await copyFile(this.#primary, this.#backup);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }

    const temporary = join(this.directory, `session.${randomUUID()}.tmp.json`);
    await writeFile(temporary, serialized, { encoding: "utf8", flag: "wx" });
    try {
      await rename(temporary, this.#primary);
    } catch (error) {
      await unlink(temporary).catch(() => undefined);
      throw error;
    }
    return "written";
  }

  async load(): Promise<SessionState | undefined> {
    let invalidPersistedState = false;
    for (const path of [this.#primary, this.#backup]) {
      try {
        const serialized = await readFile(path, "utf8");
        invalidPersistedState = true;
        try {
          return SessionStateSchema.parse(JSON.parse(serialized));
        } catch {
          continue;
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        invalidPersistedState = true;
      }
    }
    if (invalidPersistedState) throw new Error("STATE_RECOVERY_FAILED");
    return undefined;
  }
}
