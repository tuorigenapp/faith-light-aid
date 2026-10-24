import guiaPalabra from "@/assets/mensajes/guia-palabra.png";
import psicologa from "@/assets/mensajes/psicologa.png";
import coach from "@/assets/mensajes/coach.png";
import mascot from "@/assets/mensajes/origen-mascot.png";
import abuelo from "@/assets/mensajes/abuelo-noche.png";
import { getPalabraHoy } from "@/lib/palabra365";

export type CheckOption = { label: string; score: number };
export type Mensaje = {
  id: string;
  assistant: string;
  role: string;
  avatar: string;
  hour: number;
  title: string;
  body: string;
  link?: { to: string; label: string };
  check?: { question: string; options: CheckOption[] };
};

/** Hours (local time) when each assistant's single daily message unlocks. */
export const SCHEDULE = { palabra: 6, emocional: 9, tarea: 13, crecimiento: 17, noche: 21 } as const;

const FEELINGS: CheckOption[] = [
  { label: "En paz y agradecido/a", score: 5 },
  { label: "Bien, con esperanza", score: 4 },
  { label: "Cansado/a pero de pie", score: 3 },
  { label: "Ansioso/a o preocupado/a", score: 2 },
  { label: "Triste o con el corazón pesado", score: 1 },
];
const GROWTH: CheckOption[] = [
  { label: "Hice mi práctica y la sentí", score: 5 },
  { label: "Avancé un poco", score: 4 },
  { label: "Lo intenté, me costó", score: 3 },
  { label: "Hoy no pude avanzar", score: 2 },
];

const pick = <T,>(arr: T[], seed: number) => arr[Math.abs(seed) % arr.length]!;

/** Builds today's five messages. Pure: same inputs, same messages. */
export function buildMensajes(opts: { name: string; focus: string; dayKey: string; hourNow: number }): { all: Mensaje[]; unlocked: Mensaje[] } {
  const p = getPalabraHoy();
  const seed = opts.dayKey.split("").reduce((n, c) => n + c.charCodeAt(0), 0);
  const name = opts.name || "alma valiente";
  const focus = opts.focus || "tu sanación";
  const all: Mensaje[] = [
    {
      id: `${opts.dayKey}-palabra`, assistant: "Samuel", role: "Guía de la Palabra", avatar: guiaPalabra, hour: SCHEDULE.palabra,
      title: `Buenos días, ${name}: hoy Dios te habla de «${p.title}»`,
      body: `${p.intro}\n\n${p.passage.reference}: «${p.passage.text.split("\n")[0]}»\n\nPara ${focus}: ${p.advice}`,
      link: { to: "/palabra", label: "Leer la Palabra completa" },
    },
    {
      id: `${opts.dayKey}-emocional`, assistant: "Dra. Lucía", role: "Acompañante emocional", avatar: psicologa, hour: SCHEDULE.emocional,
      title: `${name}, ¿cómo está tu corazón esta mañana?`,
      body: pick([
        "Nombrar lo que sientes es el primer paso para sanarlo. No hay respuesta incorrecta.",
        "Tu estado de hoy no te define; solo nos ayuda a acompañarte mejor.",
        "Detente un segundo, respira y elige lo que más se parece a ti ahora.",
      ], seed),
      check: { question: "Elige cómo te sientes", options: FEELINGS },
    },
    {
      id: `${opts.dayKey}-tarea`, assistant: "Valeria", role: "Coach de constancia", avatar: coach, hour: SCHEDULE.tarea,
      title: "Tu práctica de hoy te toma 5 minutos",
      body: pick([
        `Una sola práctica hoy sostiene todo lo que empezaste en ${focus}. Hazla ahora y marca tu día.`,
        "La constancia vence a la intensidad. Un paso pequeño hoy vale más que una semana perfecta que nunca llega.",
        "Tu racha te está esperando. Termina tu ejercicio del día y gana tus hojas.",
      ], seed + 1),
      link: { to: "/ejercicios", label: "Hacer mi práctica" },
    },
    {
      id: `${opts.dayKey}-crecimiento`, assistant: "ORÍGEN", role: "Tu guía de crecimiento", avatar: mascot, hour: SCHEDULE.crecimiento,
      title: "Valida tu nivel de sanación de hoy",
      body: "Mira hacia atrás un momento. Tu respuesta suma a tu índice de crecimiento semanal.",
      check: { question: "¿Cuánto avanzaste hoy?", options: GROWTH },
    },
    {
      id: `${opts.dayKey}-noche`, assistant: "Don Andrés", role: "Cierre de la noche", avatar: abuelo, hour: SCHEDULE.noche,
      title: `Descansa en paz, ${name}`,
      body: pick([
        "Antes de dormir, entrega a Dios lo que hoy pesó. Escribe una línea de gratitud y suelta el resto.",
        "Hoy hiciste lo que pudiste, y eso es suficiente. Mañana hay misericordia nueva.",
        "Repite conmigo: «En paz me acostaré y asimismo dormiré, porque solo Tú, Señor, me haces vivir confiado».",
      ], seed + 2),
      link: { to: "/diario", label: "Escribir mi gratitud" },
    },
  ];
  return { all, unlocked: all.filter((m) => opts.hourNow >= m.hour) };
}

/** Weekly healing index (0-100) from check-in scores (1-5). Null without data. */
export function healingIndex(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(((avg - 1) / 4) * 100);
}

export const SEEN_KEY = (dayKey: string) => `mensajes-seen-${dayKey}`;
