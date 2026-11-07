import { DatabaseSync } from "node:sqlite";

/**
 * Opens the SQLite database at `path` (`:memory:` in tests).
 * SQLite leaves foreign keys off by default, so every connection turns them on
 * (docs/conventions.md, Known traps).
 */
export function openDatabase(path: string): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}
