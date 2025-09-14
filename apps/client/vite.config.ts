import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    // proxy WYŁĄCZNIE dla API i auth (zostaje jak jest)
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
      "/auth": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: true,
    port: 5174,
  },
  resolve: {
    alias: {
      "@shpoint/shared": path.resolve(__dirname, "../../packages/shared"),
    },
  },
});