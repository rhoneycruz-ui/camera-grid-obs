import { randomBytes } from "node:crypto";

import { createSession } from "@camera-grid/domain";

import { createServer } from "./app.js";

const host = "127.0.0.1";
const port = Number(process.env["CAMERA_GRID_PORT"] ?? 4174);
const panelCapability = process.env["CAMERA_GRID_PANEL_CAPABILITY"] ?? randomBytes(32).toString("base64url");
const outputCapability = process.env["CAMERA_GRID_OUTPUT_CAPABILITY"] ?? randomBytes(32).toString("base64url");

const app = await createServer({
  state: createSession({ sessionId: randomBytes(16).toString("hex"), invites: [] }),
  auth: {
    panelCapability,
    outputCapability,
    allowedOrigins: ["http://127.0.0.1:4173", "http://localhost:4173"],
  },
});

await app.listen({ host, port });
