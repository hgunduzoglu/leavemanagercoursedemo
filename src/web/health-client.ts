import type { HealthResponse } from "../shared/health.ts";

export type HealthResult =
  { kind: "ok" } | { kind: "degraded" } | { kind: "unreachable" };

function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const { status, database } = value as Record<string, unknown>;
  return (
    (status === "ok" || status === "degraded") &&
    (database === "reachable" || database === "unreachable")
  );
}

/**
 * Asks the server for its health (spec 0001). Only a well-formed 200/ok or 503/degraded counts;
 * any other status, a non-JSON or malformed body, or a network error is "unreachable" (AC-4).
 */
export async function fetchHealth(signal?: AbortSignal): Promise<HealthResult> {
  try {
    const response = await fetch("/api/health", {
      signal,
      headers: { accept: "application/json" },
    });
    const body: unknown = await response.json();
    if (!isHealthResponse(body)) {
      return { kind: "unreachable" };
    }
    if (response.status === 200 && body.status === "ok") {
      return { kind: "ok" };
    }
    if (response.status === 503 && body.status === "degraded") {
      return { kind: "degraded" };
    }
    return { kind: "unreachable" };
  } catch {
    return { kind: "unreachable" };
  }
}
