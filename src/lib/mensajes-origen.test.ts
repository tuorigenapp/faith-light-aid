import { describe, expect, it } from "vitest";
import { buildMensajes, healingIndex } from "./mensajes-origen";

describe("Mensajes ORÍGEN", () => {
  it("sends exactly five assistants per day, one message each", () => {
    const { all } = buildMensajes({ name: "Ana", focus: "", dayKey: "2026-10-24", hourNow: 23 });
    expect(all).toHaveLength(5);
    expect(new Set(all.map((m) => m.assistant)).size).toBe(5);
  });
  it("unlocks messages only after their scheduled hour", () => {
    expect(buildMensajes({ name: "", focus: "", dayKey: "d", hourNow: 5 }).unlocked).toHaveLength(0);
    expect(buildMensajes({ name: "", focus: "", dayKey: "d", hourNow: 9 }).unlocked).toHaveLength(2);
    expect(buildMensajes({ name: "", focus: "", dayKey: "d", hourNow: 21 }).unlocked).toHaveLength(5);
  });
  it("maps check-ins to a 0-100 healing index", () => {
    expect(healingIndex([])).toBeNull();
    expect(healingIndex([5, 5])).toBe(100);
    expect(healingIndex([1])).toBe(0);
    expect(healingIndex([3])).toBe(50);
  });
});
