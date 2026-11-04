import { describe, expect, it } from "vitest";
import { graceState, type GraceRow } from "./grace";

const base: GraceRow = { id: "g", user_id: "u", days: 7, status: "active", reason: "", starts_at: "2026-11-01T12:00:00Z", ends_at: "2026-11-08T12:00:00Z", purge_at: "2026-12-08T12:00:00Z", from_plan: null, admin_note: null, created_at: "2026-11-01T12:00:00Z" };

describe("período de gracia", () => {
  it("avisa desde el día 5 en el período de 7 días", () => {
    const s = graceState(base, new Date("2026-11-05T13:00:00Z"));
    expect(s.kind === "active" && s.day).toBe(5);
    expect(s.kind === "active" && s.warn).toBe(true);
  });
  it("no avisa el día 4 de 7", () => {
    const s = graceState(base, new Date("2026-11-04T13:00:00Z"));
    expect(s.kind === "active" && s.warn).toBe(false);
  });
  it("avisa desde el día 12 en el período de 14 días", () => {
    const row = { ...base, days: 14, ends_at: "2026-11-15T12:00:00Z" };
    expect(graceState(row, new Date("2026-11-11T13:00:00Z")).kind === "active" && (graceState(row, new Date("2026-11-11T13:00:00Z")) as { warn: boolean }).warn).toBe(false);
    expect((graceState(row, new Date("2026-11-12T13:00:00Z")) as { warn: boolean }).warn).toBe(true);
  });
  it("bloquea al terminar y da 30 días antes del borrado", () => {
    const s = graceState(base, new Date("2026-11-08T12:00:01Z"));
    expect(s.kind).toBe("locked");
    expect(s.kind === "locked" && s.daysToPurge).toBe(30);
  });
  it("una solicitud pendiente no bloquea", () => {
    expect(graceState({ ...base, status: "requested" }).kind).toBe("requested");
  });
});
