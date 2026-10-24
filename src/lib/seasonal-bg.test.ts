import { describe, expect, it } from "vitest";
import { dayPartOf, seasonalBackground, seasonOf } from "./seasonal-bg";

describe("seasonal backgrounds", () => {
  it("maps months to the four seasons", () => {
    expect(seasonOf(3)).toBe("primavera");
    expect(seasonOf(6)).toBe("verano");
    expect(seasonOf(9)).toBe("otono");
    expect(seasonOf(0)).toBe("invierno");
  });
  it("maps hours to morning, afternoon and night", () => {
    expect(dayPartOf(7)).toBe("dia");
    expect(dayPartOf(15)).toBe("tarde");
    expect(dayPartOf(22)).toBe("noche");
    expect(dayPartOf(3)).toBe("noche");
  });
  it("uses different images by time of day", () => {
    const morning = seasonalBackground(new Date(2026, 9, 10, 8));
    const evening = seasonalBackground(new Date(2026, 9, 10, 16));
    expect(morning).not.toBe(evening);
  });
});
