import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ["motore/**/*.test.ts", "src/**/*.test.{ts,tsx}"],
    environmentMatchGlobs: [["src/**", "jsdom"]],
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@motore": path.resolve(__dirname, "./motore"),
    },
  },
});
