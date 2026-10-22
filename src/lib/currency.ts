// Local-currency display for USD prices. Rates are approximate; Hotmart charges the final amount.
export type LocalCurrency = { country: string; code: string; symbol: string; rate: number; detected: boolean };

const BY_COUNTRY: Record<string, { code: string; symbol: string; rate: number }> = {
  DO: { code: "DOP", symbol: "RD$", rate: 63 },
  MX: { code: "MXN", symbol: "MX$", rate: 18.5 },
  CO: { code: "COP", symbol: "COL$", rate: 4100 },
  AR: { code: "ARS", symbol: "AR$", rate: 1000 },
  CL: { code: "CLP", symbol: "CLP$", rate: 950 },
  PE: { code: "PEN", symbol: "S/", rate: 3.75 },
  GT: { code: "GTQ", symbol: "Q", rate: 7.8 },
  HN: { code: "HNL", symbol: "L", rate: 26 },
  NI: { code: "NIO", symbol: "C$", rate: 36.8 },
  CR: { code: "CRC", symbol: "₡", rate: 510 },
  BO: { code: "BOB", symbol: "Bs", rate: 6.9 },
  PY: { code: "PYG", symbol: "₲", rate: 7800 },
  UY: { code: "UYU", symbol: "$U", rate: 40 },
  BR: { code: "BRL", symbol: "R$", rate: 5.5 },
  ES: { code: "EUR", symbol: "€", rate: 0.92 },
  US: { code: "USD", symbol: "US$", rate: 1 },
  EC: { code: "USD", symbol: "US$", rate: 1 },
  SV: { code: "USD", symbol: "US$", rate: 1 },
  PA: { code: "USD", symbol: "US$", rate: 1 },
  PR: { code: "USD", symbol: "US$", rate: 1 },
};

const TZ_COUNTRY: Record<string, string> = {
  "America/Santo_Domingo": "DO", "America/Mexico_City": "MX", "America/Monterrey": "MX", "America/Cancun": "MX", "America/Tijuana": "MX", "America/Merida": "MX", "America/Chihuahua": "MX", "America/Hermosillo": "MX", "America/Mazatlan": "MX",
  "America/Bogota": "CO", "America/Argentina/Buenos_Aires": "AR", "America/Buenos_Aires": "AR", "America/Argentina/Cordoba": "AR", "America/Santiago": "CL", "America/Lima": "PE",
  "America/Guatemala": "GT", "America/Tegucigalpa": "HN", "America/Managua": "NI", "America/Costa_Rica": "CR", "America/La_Paz": "BO", "America/Asuncion": "PY", "America/Montevideo": "UY",
  "America/Sao_Paulo": "BR", "Europe/Madrid": "ES", "America/Guayaquil": "EC", "America/El_Salvador": "SV", "America/Panama": "PA", "America/Puerto_Rico": "PR",
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US", "America/Los_Angeles": "US", "America/Phoenix": "US",
};

export const USD: LocalCurrency = { country: "", code: "USD", symbol: "US$", rate: 1, detected: false };

/** Resolve a currency from a timezone and/or locale; falls back to USD (detected=false). */
export function resolveCurrency(timeZone?: string, locale?: string): LocalCurrency {
  const fromTz = timeZone ? TZ_COUNTRY[timeZone] : undefined;
  const fromLocale = locale?.split(/[-_]/)[1]?.toUpperCase();
  const country = fromTz ?? (fromLocale && BY_COUNTRY[fromLocale] ? fromLocale : undefined);
  if (!country || !BY_COUNTRY[country]) return USD;
  return { country, ...BY_COUNTRY[country], detected: true };
}

/** Browser-only: call inside useEffect. */
export function detectCurrency(): LocalCurrency {
  try {
    return resolveCurrency(Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language);
  } catch {
    return USD;
  }
}

export function formatLocal(usd: number, c: LocalCurrency): string {
  const v = usd * c.rate;
  const digits = v >= 1000 ? 0 : 2;
  return `${c.symbol}${v.toLocaleString("es", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function formatUsd(usd: number): string {
  return `US$${usd.toFixed(2)}`;
}

/** Discounted price, rounded to cents. */
export function discounted(usd: number, pct: number): number {
  return Math.round(usd * (100 - pct)) / 100;
}
