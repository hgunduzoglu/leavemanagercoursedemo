import type { FastifyInstance } from "fastify";
import type { HealthService } from "../business/health-service.ts";

// Only these two fields are ever serialized — anything else a service returns is dropped.
const healthResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["ok", "degraded"] },
    database: { type: "string", enum: ["reachable", "unreachable"] },
  },
  required: ["status", "database"],
  additionalProperties: false,
} as const;

/**
 * GET /api/health (spec 0001): 200 when healthy, 503 when degraded. Needs no session — the one
 * exception to default-deny (docs/security.md, AuthN / AuthZ).
 */
export function registerHealthRoutes(
  app: FastifyInstance,
  healthService: HealthService,
): void {
  app.get(
    "/api/health",
    {
      schema: {
        response: { 200: healthResponseSchema, 503: healthResponseSchema },
      },
    },
    async (request, reply) => {
      const health = healthService.getSystemHealth();
      if (health.status === "degraded") {
        request.log.warn("health check: database unreachable");
        return reply.status(503).send(health);
      }
      return reply.status(200).send(health);
    },
  );
}
