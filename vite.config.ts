import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(() => ({
  plugins: [
    nodePolyfills({
      include: ["stream", "crypto", "process"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    assetsDir: "_assets",
  },
  server: {
    port: 3000,
    proxy: {
      "/_api": {
        target: "http://localhost:3344",
        changeOrigin: true,
        
      },
    },
  },
}));
