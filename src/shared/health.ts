/** Sağlık sorgusunun yanıtı (spec 0001): sistem durumu ve veritabanı erişimi. */
export type HealthResponse = {
  status: "ok" | "degraded";
  database: "reachable" | "unreachable";
};
