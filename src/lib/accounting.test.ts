import { describe, expect, it } from "vitest";
import { bucketKey, countBy, planPrice } from "./accounting";

describe("contabilidad", () => {
  it("precio del plan según nombre y frecuencia", () => {
    expect(planPrice("caminante-anual")).toEqual({ name: "CAMINANTE ORÍGEN", cadence: "Anual", usd: 69.99 });
    expect(planPrice("proposito-semanal")?.usd).toBe(7.99);
    expect(planPrice("free")).toBeNull();
  });
  it("agrupa por mes y semana", () => {
    expect(bucketKey("2026-11-05T12:00:00", "month")).toBe("2026-11");
    expect(bucketKey("2026-01-01T12:00:00", "week")).toBe("2026-S01");
    const m = countBy([{ created_at: "2026-11-01T10:00:00" }, { created_at: "2026-11-20T10:00:00" }], "month");
    expect(m.get("2026-11")).toBe(2);
  });
});
