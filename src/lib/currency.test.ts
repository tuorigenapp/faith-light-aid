import { describe, expect, it } from "vitest";
import { discounted, resolveCurrency } from "./currency";

describe("funnel pricing", () => {
  it("80% off the 14.99 monthly is 3.00", () => expect(discounted(14.99, 80)).toBe(3));
  it("65% off the 2.99 weekly is 1.05", () => expect(discounted(2.99, 65)).toBe(1.05));
  it("Santo Domingo shows pesos dominicanos", () => expect(resolveCurrency("America/Santo_Domingo").symbol).toBe("RD$"));
  it("unknown country falls back to USD, not detected", () => {
    const c = resolveCurrency("Asia/Tokyo", "ja-JP");
    expect(c.code).toBe("USD");
    expect(c.detected).toBe(false);
  });
});
