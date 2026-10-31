import { randomBytes } from "node:crypto";

import { createServer } from "./app.js";
import { LayoutStore } from "./layout-store.js";
import { loadStartupState } from "./startup.js";

const host = "127.0.0.1";
const port = Number(process.env["CAMERA_GRID_PORT"] ?? 4174);
const panelCapability = process.env["CAMERA_GRID_PANEL_CAPABILITY"] ?? randomBytes(32).toString("base64url");
const outputCapability = process.env["CAMERA_GRID_OUTPUT_CAPABILITY"] ?? randomBytes(32).toString("base64url");
const store = new LayoutStore(process.env["CAMERA_GRID_DATA_DIR"] ?? "data");

const app = await createServer({
  state: await loadStartupState(process.env, store),
  persist: (state) => store.save(state),
  auth: {
    panelCapability,
    outputCapability,
    allowedOrigins: ["http://127.0.0.1:4173", "http://localhost:4173"],
  },
});

await app.listen({ host, port });
