import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  // esbuild's dependency pre-bundling breaks libsodium-wrappers' internal
  // WASM (blob URL) loading, causing sodium.ready to hang forever. Serving
  // it unbundled avoids that.
  optimizeDeps: {
    exclude: ["libsodium-wrappers-sumo"],
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
});
