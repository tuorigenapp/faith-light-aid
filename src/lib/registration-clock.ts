/** Local calendar and clock only; these values never claim an offer expires. */
export function registrationClock(now: Date) {
  return {
    iso: now.toISOString(),
    dayKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    date: now.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" }),
    time: now.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
  };
}

export function isRegistrationOffer(value: unknown): boolean {
  return value === "especial";
}