import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  // Percorsi relativi: la build gira sia sotto un dominio sia in un'anteprima statica.
  base: "./",
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  // Il tagger serve all'editor visuale di Lovable, solo in sviluppo.
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@motore": path.resolve(__dirname, "./motore"),
      "@font-bricolage": path.resolve(__dirname, "./node_modules/@fontsource-variable/bricolage-grotesque/files"),
    },
  },
}));
