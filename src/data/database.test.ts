import { describe, expect, it } from "vitest";
import { openDatabase } from "./database.ts";

describe("openDatabase", () => {
  it("turns foreign keys on for the connection", () => {
    const db = openDatabase(":memory:");
    try {
      expect(db.prepare("PRAGMA foreign_keys").get()).toEqual({
        foreign_keys: 1,
      });
    } finally {
      db.close();
    }
  });
});
