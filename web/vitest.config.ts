import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
    conditions: ["react-server"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
