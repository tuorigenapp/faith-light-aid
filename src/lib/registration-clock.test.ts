import { describe, expect, it } from "vitest";
import { isRegistrationOffer, registrationClock } from "./registration-clock";

describe("registration clock", () => {
  it("uses the current calendar date and updates after midnight", () => {
    const before = registrationClock(new Date(2026, 9, 24, 23, 59, 59));
    const after = registrationClock(new Date(2026, 9, 25, 0, 0, 1));
    expect(before.dayKey).toBe("2026-10-24");
    expect(after.dayKey).toBe("2026-10-25");
    expect(after.date).not.toBe(before.date);
    expect(before.time).toBe("23:59:59");
    expect(after.time).toBe("00:00:01");
  });
  it("only enables the explicitly selected existing special offer", () => {
    expect(isRegistrationOffer("especial")).toBe(true);
    expect(isRegistrationOffer(undefined)).toBe(false);
    expect(isRegistrationOffer("desconocida")).toBe(false);
  });
});