import { describe, expect, it } from "vitest";
import { FUNNEL_VARIATION_COUNT, nextFunnelVariation } from "./funnel-visual-rotation";

describe("funnel photo variations", () => {
  it("cycles all five result variations without repeating the previous photo", () => {
    expect(FUNNEL_VARIATION_COUNT).toBe(5);
    let previous: number | null = null;
    const seen = new Set<number>();
    for (let i = 0; i < 5; i++) {
      const next = nextFunnelVariation("sanar|miedo", previous);
      expect(next).not.toBe(previous);
      seen.add(next);
      previous = next;
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
  });
  it("uses the selected topic for the initial result", () => {
    expect(nextFunnelVariation("sanar", null)).toBe(3);
    expect(nextFunnelVariation("fe", null)).toBe(3);
    expect(nextFunnelVariation("identidad", null)).toBe(4);
  });
});