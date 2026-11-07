import type { DatabaseSync } from "node:sqlite";

export type HealthRepository = {
  /** Runs a trivial read; throws when the database cannot be read. */
  pingDatabase(): void;
};

export function createHealthRepository(db: DatabaseSync): HealthRepository {
  return {
    pingDatabase() {
      db.prepare("SELECT 1").get();
    },
  };
}
