/// <reference types="vitest" />
/// <reference types="vite/client" />

import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    watch: {
      usePolling: true,
    },
    strictPort: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    css: true, // Ensures that the element is available in the DOM
    setupFiles: ["./src/setupTests.tsx"],
  },
});
