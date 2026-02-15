/// <reference types="vitest/config" />
import path from "node:path";
import { defineConfig } from "vite";
import React from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [React(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      include: ["src/test/**/*.spec.ts"],
    },
  };
});
