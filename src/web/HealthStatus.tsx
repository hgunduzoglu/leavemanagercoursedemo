import { useEffect, useState } from "react";
import { fetchHealth, type HealthResult } from "./health-client.ts";

type ViewState = { kind: "loading" } | HealthResult;

/**
 * Spec 0001, User experience: the system's health in a live status region, always as text
 * (never colour alone). Raw error details are never shown.
 */
export function HealthStatus() {
  const [state, setState] = useState<ViewState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    void fetchHealth(controller.signal).then((result) => {
      if (!controller.signal.aborted) {
        setState(result);
      }
    });
    return () => controller.abort();
  }, []);

  return (
    <section role="status" aria-label="Sistem durumu">
      {state.kind === "loading" && <p>Sistem durumu kontrol ediliyor…</p>}
      {state.kind === "ok" && (
        <>
          <p>Sistem çalışıyor</p>
          <p>Veritabanı: erişilebilir</p>
        </>
      )}
      {state.kind === "degraded" && (
        <>
          <p>Sistem sorunlu</p>
          <p>Veritabanı: erişilemiyor</p>
        </>
      )}
      {state.kind === "unreachable" && <p>Sunucuya ulaşılamadı</p>}
    </section>
  );
}
