import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("central error handler", () => {
  it("hides unexpected error details", async () => {
    app = buildApp({
      healthService: {
        getSystemHealth: () => {
          throw new Error(
            "SQLITE_ERROR: no such table: users (C:\\secret\\leave-manager.sqlite)",
          );
        },
      },
    });

    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Beklenmeyen bir hata oluştu.",
      },
    });
    expect(response.body).not.toMatch(/SQLITE|users|secret|at /);
  });

  it("keeps a client error as 4xx with a generic body", async () => {
    app = buildApp({
      healthService: {
        getSystemHealth: () => ({ status: "ok", database: "reachable" }),
      },
    });
    // Test-only route: a malformed JSON body makes Fastify raise its own 400.
    app.post("/test/echo", async (request) => request.body);

    const response = await app.inject({
      method: "POST",
      url: "/test/echo",
      headers: { "content-type": "application/json" },
      payload: '{"broken": ',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: "BAD_REQUEST", message: "İstek geçersiz." },
    });
  });
});
