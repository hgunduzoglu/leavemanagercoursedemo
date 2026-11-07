import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Determinism (docs/testing.md): one time zone and locale for every test worker, set before the
// workers start. Set here, not in npm scripts — Windows cmd has no `TZ=… command` syntax
// (docs/conventions.md, Known traps).
process.env.TZ = "UTC";
process.env.LANG = "tr_TR.UTF-8";
process.env.LC_ALL = "tr_TR.UTF-8";

export default defineConfig({
  plugins: [react()],
  test: {
    // resource hygiene: never watch, even when started as plain `vitest` (docs/testing.md, Resource hygiene 4)
    watch: false,
    // Component tests opt into jsdom with a `// @vitest-environment jsdom` first line.
    environment: "node",
  },
});
