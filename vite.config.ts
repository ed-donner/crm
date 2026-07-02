import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the Vite dev server runs on :5173 and proxies every /api
// request to the local Express + SQLite backend on :3001. In production the
// backend serves the built bundle directly on a single port.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Poll instead of inotify: reliable inside Docker / WSL bind mounts where
    // filesystem change events don't propagate, so HMR always stays in sync.
    watch: {
      usePolling: true,
      interval: 500,
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
