import { describe, expect, it } from "vitest";
import { openDatabase } from "../data/database.ts";
import { createHealthRepository } from "../data/health-repository.ts";
import { createHealthService } from "./health-service.ts";

describe("health service", () => {
  it("reports a reachable database", () => {
    const db = openDatabase(":memory:");
    try {
      const service = createHealthService(createHealthRepository(db));

      expect(service.getSystemHealth()).toEqual({
        status: "ok",
        database: "reachable",
      });
    } finally {
      db.close();
    }
  });

  it("reports an unreachable database when the query fails", () => {
    const db = openDatabase(":memory:");
    const service = createHealthService(createHealthRepository(db));
    db.close(); // every read now throws: the database cannot be read

    expect(service.getSystemHealth()).toEqual({
      status: "degraded",
      database: "unreachable",
    });
  });
});
