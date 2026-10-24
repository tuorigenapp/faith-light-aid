import { useEffect, useState } from "react";
import primaveraDia from "@/assets/etapas-bg/primavera-dia.jpg";
import primaveraTarde from "@/assets/etapas-bg/primavera-tarde.jpg";
import veranoDia from "@/assets/etapas-bg/verano-dia.jpg";
import veranoTarde from "@/assets/etapas-bg/verano-tarde.jpg";
import otonoDia from "@/assets/etapas-bg/otono-dia.jpg";
import otonoTarde from "@/assets/etapas-bg/otono-tarde.jpg";
import inviernoDia from "@/assets/etapas-bg/invierno-dia.jpg";
import inviernoTarde from "@/assets/etapas-bg/invierno-tarde.jpg";
import noche1 from "@/assets/etapas-bg/noche-1.jpg";
import noche2 from "@/assets/etapas-bg/noche-2.jpg";

export type Season = "primavera" | "verano" | "otono" | "invierno";
export type DayPart = "dia" | "tarde" | "noche";

const BY_SEASON: Record<Season, { dia: string; tarde: string }> = {
  primavera: { dia: primaveraDia, tarde: primaveraTarde },
  verano: { dia: veranoDia, tarde: veranoTarde },
  otono: { dia: otonoDia, tarde: otonoTarde },
  invierno: { dia: inviernoDia, tarde: inviernoTarde },
};
const NIGHTS = [noche1, noche2];

export function seasonOf(month: number): Season {
  if (month >= 2 && month <= 4) return "primavera";
  if (month >= 5 && month <= 7) return "verano";
  if (month >= 8 && month <= 10) return "otono";
  return "invierno";
}

export function dayPartOf(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return "dia";
  if (hour >= 12 && hour < 19) return "tarde";
  return "noche";
}

/** One of 10 backgrounds chosen by season, time of day and (at night) the day of the month. */
export function seasonalBackground(d: Date = new Date()): string {
  const part = dayPartOf(d.getHours());
  if (part === "noche") return NIGHTS[d.getDate() % NIGHTS.length]!;
  return BY_SEASON[seasonOf(d.getMonth())][part];
}

/** Browser-only pick (avoids hydration mismatch); falls back to a neutral daytime image during SSR. */
export function useSeasonalBackground() {
  const [bg, setBg] = useState(otonoDia);
  useEffect(() => {
    setBg(seasonalBackground());
    const t = setInterval(() => setBg(seasonalBackground()), 10 * 60_000);
    return () => clearInterval(t);
  }, []);
  return bg;
}
