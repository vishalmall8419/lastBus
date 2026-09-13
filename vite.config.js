import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// LAST BUS — frontend-only Vite config. No backend, no server-side code.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
