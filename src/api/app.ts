import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";
import type { HealthService } from "../business/health-service.ts";
import { handleError } from "./error-handler.ts";
import { registerHealthRoutes } from "./health-routes.ts";

export type AppDependencies = {
  healthService: HealthService;
};

/** Builds the HTTP API; the composition root (src/server.ts) supplies the dependencies. */
export function buildApp(
  deps: AppDependencies,
  options: FastifyServerOptions = {},
): FastifyInstance {
  const app = Fastify(options);
  app.setErrorHandler(handleError);
  registerHealthRoutes(app, deps.healthService);
  return app;
}
