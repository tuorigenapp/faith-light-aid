import { describe, expect, it } from "vitest";
import { illustrativeImpactScore } from "./funnel-impact";

describe("illustrative impact index", () => {
  it("keeps every result in the positive half of the percentage scale", () => {
    for (let variant = 0; variant < 5; variant++) {
      expect(illustrativeImpactScore(variant)).toBeGreaterThan(50);
      expect(illustrativeImpactScore(variant)).toBeLessThanOrEqual(100);
    }
  });

  it("shows different indices for all five result variations", () => {
    const scores = Array.from({ length: 5 }, (_, variant) => illustrativeImpactScore(variant));
    expect(new Set(scores).size).toBe(5);
    for (let variant = 1; variant < 5; variant++) {
      expect(scores[variant]).not.toBe(scores[variant - 1]);
    }
  });

  it("keeps invalid or unhydrated variants positive and stable", () => {
    for (const variant of [null, -1, 5, 1.5, Number.NaN]) {
      expect(illustrativeImpactScore(variant)).toBe(illustrativeImpactScore(0));
      expect(illustrativeImpactScore(variant)).toBeGreaterThan(50);
    }
  });
});