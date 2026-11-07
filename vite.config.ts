import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// Development: Vite serves the SPA from src/web and forwards /api to the Fastify server, using the
// same HOST/PORT as src/server.ts (.env.example). The production build goes to dist/.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = `http://${env.HOST || "127.0.0.1"}:${env.PORT || "3000"}`;

  return {
    root: "src/web",
    plugins: [react()],
    build: { outDir: "../../dist", emptyOutDir: true },
    server: { proxy: { "/api": apiTarget } },
  };
});
