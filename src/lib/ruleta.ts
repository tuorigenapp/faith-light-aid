/**
 * Ruleta de Premios de ORÍGEN — configuración compartida (cliente + servidor).
 * El usuario SIEMPRE gana algo. Un giro cada 24 horas.
 */
export type WheelPrize = {
  key: string;
  /** Texto MUY corto dentro de la ruleta (número o símbolo). */
  short: string;
  /** Nombre completo, se muestra al ganar. */
  label: string;
  /** Descripción larga, solo en el resultado. */
  description: string;
  /** Emoji-ícono grande dentro de la sección. */
  icon: string;
  /** Puntos internos otorgados (100 = 1 hoja). */
  points: number;
  /** Peso relativo de probabilidad (los mejores salen menos). */
  weight: number;
  /** Colores de la sección (paleta ORÍGEN). */
  fill: string;
  text: string;
};

export const WHEEL_PRIZES: WheelPrize[] = [
  {
    key: "hoja_1",
    short: "+1",
    label: "1 Hoja de Sanación",
    description: "Una hoja entera directo a tu saldo. Úsala en una consulta o en la mentora.",
    icon: "🌿",
    points: 100,
    weight: 26,
    fill: "#7C5CFF",
    text: "#FFFFFF",
  },
  {
    key: "media_hoja",
    short: "½",
    label: "Media Hoja de Sanación",
    description: "50% de progreso hacia tu próxima hoja. Vas más rápido de lo normal.",
    icon: "🍃",
    points: 50,
    weight: 30,
    fill: "#F5C77E",
    text: "#2A1B3D",
  },
  {
    key: "consulta_cielo",
    short: "1",
    label: "Consulta «Dios te dice hoy»",
    description: "Te acreditamos la hoja de una consulta del cielo. Entra y pregunta lo que arde.",
    icon: "🕊️",
    points: 100,
    weight: 14,
    fill: "#5FD3A0",
    text: "#0F2C22",
  },
  {
    key: "consulta_pareja",
    short: "1",
    label: "Lectura de pareja",
    description: "Una hoja para descubrir si tu relación es deuda ancestral o propósito.",
    icon: "💞",
    points: 100,
    weight: 10,
    fill: "#FF8FB1",
    text: "#3A1020",
  },
  {
    key: "hojas_2",
    short: "+2",
    label: "2 Hojas de Sanación",
    description: "Doble premio. Suficiente para dos consultas o varios días de mentora.",
    icon: "✨",
    points: 200,
    weight: 8,
    fill: "#9C86FF",
    text: "#FFFFFF",
  },
  {
    key: "patrones",
    short: "1",
    label: "Consulta de patrones familiares",
    description: "Una hoja para ver qué se repite en tu línea paterna o materna.",
    icon: "🌳",
    points: 100,
    weight: 8,
    fill: "#4FB8D8",
    text: "#06222C",
  },
  {
    key: "impulso",
    short: "¼",
    label: "Impulso de fe",
    description: "Un cuarto de hoja y una palabra para hoy: lo que se repite, hoy se cierra.",
    icon: "🙏",
    points: 25,
    weight: 30,
    fill: "#FFE3B0",
    text: "#2A1B3D",
  },
  {
    key: "hojas_3",
    short: "+3",
    label: "3 Hojas de Sanación",
    description: "El premio mayor. Tres hojas completas para avanzar sin frenos.",
    icon: "👑",
    points: 300,
    weight: 4,
    fill: "#E0B25C",
    text: "#2A1B3D",
  },
  {
    key: "cielo_5",
    short: "5",
    label: "5 consultas «Dios te dice hoy»",
    description: "Cinco hojas para cinco consultas del cielo. Úsalas cuando las necesites.",
    icon: "",
    points: 500,
    weight: 2,
    fill: "#5FD3A0",
    text: "#0F2C22",
  },
  {
    key: "mentora",
    short: "M",
    label: "Charla con la Mentora",
    description: "Una hoja para hablar con la mentora Ruth Esther hoy.",
    icon: "",
    points: 100,
    weight: 12,
    fill: "#B9A6FF",
    text: "#1B1930",
  },
  {
    key: "bono_regalo",
    short: "B",
    label: "Bono para regalar",
    description: "Dos hojas para transferir a alguien que quieras. Ve a Transferir Balance.",
    icon: "",
    points: 200,
    weight: 5,
    fill: "#FFB38A",
    text: "#3A1A0B",
  },
  {
    key: "semana_camino",
    short: "7",
    label: "Semana libre en Camino ORÍGEN",
    description: "Durante 7 días puedes avanzar las lecciones de cualquier categoría sin esperar al día siguiente.",
    icon: "",
    points: 0,
    weight: 4,
    fill: "#8FD1B8",
    text: "#0F2C22",
  },
  {
    key: "audio_premium",
    short: "A",
    label: "1 audio premium desbloqueado",
    description: "Abre un audio bloqueado de Visualízate. Toca \"Usar mi desbloqueo\" en el audio que elijas. Máximo 1 a la vez.",
    icon: "",
    points: 0,
    weight: 3,
    fill: "#C9B8FF",
    text: "#1B1930",
  },
];

export const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function prizeByKey(key: string) {
  return WHEEL_PRIZES.find((p) => p.key === key) ?? WHEEL_PRIZES[0]!;
}

/** Selección aleatoria ponderada — se ejecuta ANTES de calcular la animación. */
export function pickWeightedPrize(): { prize: WheelPrize; index: number } {
  const total = WHEEL_PRIZES.reduce((a, p) => a + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WHEEL_PRIZES.length; i++) {
    r -= WHEEL_PRIZES[i]!.weight;
    if (r <= 0) return { prize: WHEEL_PRIZES[i]!, index: i };
  }
  return { prize: WHEEL_PRIZES[0]!, index: 0 };
}

export function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
