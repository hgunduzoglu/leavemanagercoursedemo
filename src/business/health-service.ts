import type { HealthRepository } from "../data/health-repository.ts";
import type { HealthResponse } from "../shared/health.ts";

export type HealthService = {
  getSystemHealth(): HealthResponse;
};

/**
 * Spec 0001, R-2 / R-3: health comes from a real database read. A failing read means
 * "degraded"; the error itself never leaves this function.
 */
export function createHealthService(
  repository: HealthRepository,
): HealthService {
  return {
    getSystemHealth() {
      try {
        repository.pingDatabase();
        return { status: "ok", database: "reachable" };
      } catch {
        return { status: "degraded", database: "unreachable" };
      }
    },
  };
}
