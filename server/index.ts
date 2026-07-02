import cors from "cors";
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createDb, DEFAULT_DB_PATH } from "./db.js";
import { createRouter } from "./routes.js";
import { seedIfEmpty } from "./seed.js";
import { HttpError } from "./repositories.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 5173);
const DB_PATH = process.env.DB_PATH ?? DEFAULT_DB_PATH;

const db = createDb(DB_PATH);

// In dev the Vite dev server serves the frontend; the API just needs to be
// reachable. In production we serve the built bundle from /dist ourselves.
const distDir = join(__dirname, "..", "dist");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", createRouter(db));

// Health check for the dev proxy / browser.
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Serve the production build if present.
app.use(express.static(distDir));
app.get("*", (req, res, next) => {
  // Never hijack API routes.
  if (req.path.startsWith("/api")) return next();
  res.sendFile(join(distDir, "index.html"), (err) => {
    if (err) next();
  });
});

// Centralised error handler — turns HttpError into a clean JSON response.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error("[server] unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Auto-seed on first launch so the app looks alive immediately.
seedIfEmpty(db);

app.listen(PORT, () => {
  console.log(`Personal CRM API listening on http://localhost:${PORT}`);
  console.log(`  database: ${DB_PATH}`);
});
