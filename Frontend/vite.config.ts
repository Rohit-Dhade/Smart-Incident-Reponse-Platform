import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backend = "http://localhost:5000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: backend, changeOrigin: false },
      "/socket.io": { target: backend, ws: true, changeOrigin: false },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api": { target: backend, changeOrigin: false },
      "/socket.io": { target: backend, ws: true, changeOrigin: false },
    },
  },
});
