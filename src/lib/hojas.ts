/** Paquetes de Hojas de Sanación (1 hoja = 1 gema) */
export type HojaPack = {
  id: string;
  hojas: number;
  usd: number;
  tag?: "especial" | "super";
};

export const HOJA_PACKS: HojaPack[] = [
  { id: "p5", hojas: 5, usd: 2.99 },
  { id: "p10", hojas: 10, usd: 4.99 },
  { id: "p20", hojas: 20, usd: 8.99 },
  { id: "p50", hojas: 50, usd: 14.99 },
  { id: "p100", hojas: 100, usd: 24.99 },
  { id: "p170", hojas: 170, usd: 30, tag: "especial" },
  { id: "p200", hojas: 200, usd: 70, tag: "especial" },
  { id: "p350", hojas: 350, usd: 150, tag: "especial" },
  { id: "p500", hojas: 500, usd: 350, tag: "especial" },
  { id: "p1000", hojas: 1000, usd: 650, tag: "especial" },
];

export const HOJA_PACK_HERO: HojaPack = { id: "p10000", hojas: 10000, usd: 3500, tag: "super" };

export const HOJA_USES = [
  { title: "Chat con la Mentora", cost: 1, to: "/chat" as const, emoji: "🗨️" },
  { title: "Patrones Familiares", cost: 1, to: "/patrones" as const, emoji: "🌳" },
  { title: "Dios te dice hoy", cost: 1, to: "/ministracion" as const, emoji: "📖" },
];

export function usd(n: number) {
  return `${n.toFixed(2)} USD`;
}
