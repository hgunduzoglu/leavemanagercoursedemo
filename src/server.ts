import { buildApp } from "./api/app.ts";
import { createHealthService } from "./business/health-service.ts";
import { openDatabase } from "./data/database.ts";
import { createHealthRepository } from "./data/health-repository.ts";

// Composition root (docs/architecture.md): the one place that wires the layers together.
// Settings come from the environment; .env.example lists them with their defaults. An empty value
// (`PORT=`) means "use the default", as in vite.config.ts — hence `||`, not `??`.
const port = Number(process.env.PORT || "3000");
const host = process.env.HOST || "127.0.0.1";
const databasePath = process.env.DATABASE_PATH || "leave-manager.sqlite";

const db = openDatabase(databasePath);
const app = buildApp(
  { healthService: createHealthService(createHealthRepository(db)) },
  { logger: true },
);

async function shutdown(): Promise<void> {
  await app.close();
  db.close();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    shutdown().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error(error, "shutdown failed");
        process.exit(1);
      },
    );
  });
}

await app.listen({ port, host });
