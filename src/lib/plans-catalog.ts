/** Catálogo único de membresías ORÍGEN (enlaces Hotmart normales y con descuento). */
export type Cadence = "weekly" | "monthly" | "annual";
export type PlanLevel = {
  id: "explorador" | "caminante" | "proposito";
  name: string;
  claim: string;
  usd: Record<Cadence, number>;
  url: Record<Cadence, string>;
  off: Record<Cadence, string>;
  perks: string[];
  includes: string[];
};

export const hotmartLink = (o: string) => `https://pay.hotmart.com/D107250120S?off=${o}&checkoutMode=6`;
const H = hotmartLink;

export const PLAN_LEVELS: PlanLevel[] = [
  {
    id: "explorador", name: "EXPLORADOR ORÍGEN", claim: "Para dar tu primer paso",
    usd: { weekly: 2.99, monthly: 14.99, annual: 49.99 },
    url: { weekly: H("pz5lp6r7"), monthly: H("2tqo0bnc"), annual: H("0kyotde7") },
    off: { weekly: H("1n9cgz6n"), monthly: H("9mne3xdg"), annual: H("3si9u63f") },
    perks: ["Diagnóstico de tu origen", "Etapa 1 del Camino ORÍGEN", "Diario y Palabra del día"],
    includes: ["Diagnóstico completo de tu origen", "Etapa 1 del Camino ORÍGEN", "Palabra del día con quiz", "Diario con 5 entradas", "1 consulta al mes"],
  },
  {
    id: "caminante", name: "CAMINANTE ORÍGEN", claim: "La experiencia completa",
    usd: { weekly: 4.99, monthly: 19.99, annual: 69.99 },
    url: { weekly: H("m3mf4woy"), monthly: H("m9cvnhi4"), annual: H("ip8loh6o") },
    off: { weekly: H("gv5wx433"), monthly: H("7jifsui7"), annual: H("zqn998l2") },
    perks: ["Camino de 20 etapas completo", "Visualízalo y Vívelo", "Consultas con PDF"],
    includes: ["Todo lo del Explorador", "Todas las etapas y caminos abiertos", "Juegos de prácticas diarias", "Diario ilimitado", "Mentora ampliada cada día", "Consultas de Pareja y Patrones"],
  },
  {
    id: "proposito", name: "PROPÓSITO ORÍGEN", claim: "Acompañamiento total",
    usd: { weekly: 7.99, monthly: 29.99, annual: 99.99 },
    url: { weekly: H("rpp21n33"), monthly: H("z12ipqpy"), annual: H("lf0finnj") },
    off: { weekly: H("8yqx728h"), monthly: H("k7ymwjcn"), annual: H("fcbnhwb8") },
    perks: ["Todo lo de Caminante", "Mentora y consultas sin límite", "Biblioteca y bonos VIP"],
    includes: ["Todo lo del Caminante", "Todo ORÍGEN desbloqueado", "Visualízalo y Vívelo completo", "Ministración sin límite", "Premios, bonos y ruleta ampliada", "Descargables e imprimibles"],
  },
];

export const CADENCES: { id: Cadence; label: string; per: string; days: number }[] = [
  { id: "weekly", label: "Semanal", per: "semana", days: 7 },
  { id: "monthly", label: "Mensual", per: "mes", days: 30 },
  { id: "annual", label: "Anual", per: "año", days: 365 },
];

export const OFF_PCT: Record<Cadence, number> = { weekly: 65, monthly: 80, annual: 80 };

/** Encuentra el nivel guardado en la suscripción (acepta nombres viejos). */
export function levelFromPlan(plan: string | null | undefined): PlanLevel | null {
  const p = (plan ?? "").toLowerCase();
  if (!p || p === "free" || p === "explorador-gratis") return null;
  if (p.includes("proposito") || p.includes("propósito")) return PLAN_LEVELS[2]!;
  if (p.includes("caminante") || p === "camino" || p === "monthly" || p === "annual") return PLAN_LEVELS[1]!;
  if (p.includes("explorador")) return PLAN_LEVELS[0]!;
  return PLAN_LEVELS[1]!;
}
