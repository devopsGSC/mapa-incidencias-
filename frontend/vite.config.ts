import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const BACKEND_URL = "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Permite abrir el dev server a través de un Cloudflare Tunnel
    // (ej. para probar en la TV).
    allowedHosts: [".trycloudflare.com"],
    // En dev el frontend llama a la API en su mismo origen y Vite la reenvía
    // al backend: así un único túnel/URL sirve frontend, API y socket.io.
    proxy: {
      "/api": BACKEND_URL,
      "/socket.io": { target: BACKEND_URL, ws: true },
    },
  },
});
