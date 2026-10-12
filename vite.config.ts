import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // Percorsi relativi: la build gira sia sotto un dominio sia in un'anteprima statica.
  base: "./",
  server: { host: true, port: 8080 },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@motore": path.resolve(__dirname, "./motore"),
      "@font-bricolage": path.resolve(__dirname, "./node_modules/@fontsource-variable/bricolage-grotesque/files"),
    },
  },
});
