import { copyFile, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { SessionStateSchema, type SessionState } from "@camera-grid/domain";

export class LayoutStore {
  readonly #primary: string;
  readonly #backup: string;
  readonly #temporary: string;

  constructor(private readonly directory: string) {
    this.#primary = join(directory, "session.json");
    this.#backup = join(directory, "session.backup.json");
    this.#temporary = join(directory, "session.tmp.json");
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

    await writeFile(this.#temporary, serialized, { encoding: "utf8", flag: "wx" });
    try {
      await rename(this.#temporary, this.#primary);
    } catch (error) {
      await unlink(this.#temporary).catch(() => undefined);
      throw error;
    }
    return "written";
  }

  async load(): Promise<SessionState | undefined> {
    for (const path of [this.#primary, this.#backup]) {
      try {
        return SessionStateSchema.parse(JSON.parse(await readFile(path, "utf8")));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      }
    }
    return undefined;
  }
}
