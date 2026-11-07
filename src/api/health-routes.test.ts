import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import type { HealthService } from "../business/health-service.ts";
import { buildApp } from "./app.ts";

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

function appReturning(health: ReturnType<HealthService["getSystemHealth"]>) {
  app = buildApp({ healthService: { getSystemHealth: () => health } });
  return app;
}

describe("GET /api/health", () => {
  it("returns 200 and ok without a session", async () => {
    const response = await appReturning({
      status: "ok",
      database: "reachable",
    }).inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", database: "reachable" });
  });

  it("returns 503 and degraded without leaking details", async () => {
    // A service that (wrongly) carries internals: the response must still hold only the two fields.
    const withInternals = {
      status: "degraded",
      database: "unreachable",
      detail: "SQLITE_CANTOPEN: unable to open C:\\data\\leave-manager.sqlite",
      stack:
        "Error: SQLITE_CANTOPEN\n    at pingDatabase (health-repository.ts:9)",
    } as const;

    const response = await appReturning(withInternals).inject({
      method: "GET",
      url: "/api/health",
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      status: "degraded",
      database: "unreachable",
    });
    expect(response.body).not.toMatch(/SQLITE|stack|leave-manager\.sqlite/);
  });
});
