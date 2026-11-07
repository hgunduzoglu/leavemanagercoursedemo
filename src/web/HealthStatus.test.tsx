// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HealthStatus } from "./HealthStatus.tsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubFetch(answer: () => Promise<Response>) {
  const fetchMock = vi.fn(answer);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const statusText = () => screen.getByRole("status").textContent;

describe("HealthStatus", () => {
  it("shows the loading state until the health query resolves", async () => {
    let answer: (response: Response) => void = () => {};
    stubFetch(() => new Promise((resolve) => (answer = resolve)));

    render(<HealthStatus />);
    expect(statusText()).toBe("Sistem durumu kontrol ediliyor…");

    answer(jsonResponse(200, { status: "ok", database: "reachable" }));
    await screen.findByText("Sistem çalışıyor");
    expect(screen.queryByText("Sistem durumu kontrol ediliyor…")).toBeNull();
  });

  it("shows a healthy system and a reachable database", async () => {
    const fetchMock = stubFetch(async () =>
      jsonResponse(200, { status: "ok", database: "reachable" }),
    );

    render(<HealthStatus />);

    await screen.findByText("Sistem çalışıyor");
    expect(statusText()).toBe("Sistem çalışıyorVeritabanı: erişilebilir");
    expect(fetchMock).toHaveBeenCalledWith("/api/health", expect.anything());
  });

  it("shows a degraded system when the database is unreachable", async () => {
    stubFetch(async () =>
      jsonResponse(503, { status: "degraded", database: "unreachable" }),
    );

    render(<HealthStatus />);

    await screen.findByText("Sistem sorunlu");
    expect(statusText()).toBe("Sistem sorunluVeritabanı: erişilemiyor");
  });

  it.each([
    {
      reason: "a 500 status",
      answer: async () =>
        new Response("SQLITE_BUSY at C:\\data\\leave-manager.sqlite", {
          status: 500,
        }),
    },
    {
      reason: "a non-JSON body",
      answer: async () =>
        new Response("<html>502 proxy error</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
    },
    {
      reason: "a malformed body",
      answer: async () => jsonResponse(200, { healthy: true }),
    },
    {
      reason: "a status that contradicts the body",
      answer: async () =>
        jsonResponse(200, { status: "degraded", database: "unreachable" }),
    },
    {
      reason: "a network error",
      answer: () =>
        Promise.reject(new TypeError("fetch failed: ECONNREFUSED 127.0.0.1")),
    },
  ])(
    "shows server unreachable without raw details for $reason",
    async ({ answer }) => {
      stubFetch(answer);

      render(<HealthStatus />);

      await screen.findByText("Sunucuya ulaşılamadı");
      expect(statusText()).toBe("Sunucuya ulaşılamadı");
    },
  );
});
