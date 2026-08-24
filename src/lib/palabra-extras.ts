/**
 * Extras de la Palabra del día: fondos imprimibles, narración humana,
 * quiz "Para pensar" y enlaces para compartir en redes.
 */
import { getPalabraForDay, type Palabra } from "@/lib/palabra365";

import bg1 from "@/assets/palabra-bg-1.jpg";
import bg2 from "@/assets/palabra-bg-2.jpg";
import bg3 from "@/assets/palabra-bg-3.jpg";
import bg4 from "@/assets/palabra-bg-4.jpg";
import bg5 from "@/assets/palabra-bg-5.jpg";
import bg6 from "@/assets/palabra-bg-6.jpg";
import bg7 from "@/assets/palabra-bg-7.jpg";
import bg8 from "@/assets/palabra-bg-8.jpg";
import bg9 from "@/assets/palabra-bg-9.jpg";
import bg10 from "@/assets/palabra-bg-10.jpg";

export const PALABRA_BACKGROUNDS = [bg1, bg2, bg3, bg4, bg5, bg6, bg7, bg8, bg9, bg10];

export const APP_URL = "https://tuorigen.app";

export function backgroundForDay(day: number) {
  return PALABRA_BACKGROUNDS[(day - 1) % PALABRA_BACKGROUNDS.length]!;
}

/* ---------------- Narración humana ---------------- */

const OPENERS = [
  "Imagina la escena por un momento.",
  "Detente aquí, respira y quédate un segundo con esto.",
  "Piensa en la última vez que sentiste esto mismo.",
  "Hay días en que uno amanece con el alma pesada.",
  "Deja que te cuente algo antes de leer el pasaje.",
  "Quizás hoy te levantaste con más preguntas que respuestas.",
];

const FAMILY_LINES = [
  "Lleva esta palabra a tu mesa: pregunta en casa qué le pesa hoy a cada uno y escucha sin corregir.",
  "Comparte esta palabra con alguien de tu familia y cuéntale una vez en que Dios te sostuvo.",
  "Nombra en oración a la persona de tu familia que más te ha costado perdonar. Solo su nombre; eso ya es un paso.",
  "Si hay un silencio viejo en tu familia, hoy puedes romperlo con una frase simple: “estuve pensando en ti”.",
  "Bendice hoy a tus padres, con sus fallas incluidas. Bendecir no es aprobar: es dejar de cargar.",
  "Escribe el nombre de un hijo, sobrino o hermano y pídele a Dios que en él se corte lo que en ti dolió.",
];

const CLOSERS = [
  "No necesitas resolverlo todo hoy. Solo no soltarle la mano.",
  "Dios no llega cuando ya estás bien; llega justo así como estás.",
  "El cambio empieza pequeño, casi invisible, y luego se nota en todo.",
  "Un paso hoy vale más que un plan perfecto para mañana.",
];

export type PalabraBlock = {
  key: "ensenanza" | "reflexion" | "familia" | "consejo";
  emoji: string;
  label: string;
  text: string;
};

export function palabraBlocks(p: Palabra): PalabraBlock[] {
  const i = p.day - 1;
  return [
    {
      key: "ensenanza",
      emoji: "📖",
      label: "Enseñanza de hoy",
      text: `${OPENERS[i % OPENERS.length]} ${p.intro}`,
    },
    {
      key: "reflexion",
      emoji: "💛",
      label: "Reflexión para ti",
      text: `${p.reflection} ${CLOSERS[i % CLOSERS.length]}`,
    },
    {
      key: "familia",
      emoji: "🏡",
      label: "Reflexión para tu familia",
      text: FAMILY_LINES[i % FAMILY_LINES.length]!,
    },
    {
      key: "consejo",
      emoji: "🕊️",
      label: "Consejo espiritual",
      text: p.advice,
    },
  ];
}

/* ---------------- Quiz "Para pensar" ---------------- */

export type QuizQuestion = { question: string; options: string[]; correct: number };

const WRONG_INVITATIONS = [
  "Esperar a sentirte fuerte para acercarte a Dios.",
  "Exigir que los demás cambien primero para poder estar en paz.",
  "Aguantar en silencio hasta que el dolor se acostumbre.",
  "Cargar solo y no pedir ayuda a nadie.",
];

function firstSentence(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  const cut = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  return cut.length > 120 ? `${cut.slice(0, 117)}…` : cut;
}

function shuffleFixed<T>(items: T[], seed: number): { list: T[]; indexOf: (item: T) => number } {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = (seed * (i + 7)) % (i + 1);
    [list[i], list[j]] = [list[j]!, list[i]!];
  }
  return { list, indexOf: (item: T) => list.indexOf(item) };
}

export function palabraQuiz(p: Palabra): QuizQuestion[] {
  const other1 = getPalabraForDay(((p.day + 97) % 365) + 1);
  const other2 = getPalabraForDay(((p.day + 211) % 365) + 1);

  // 1) Pasaje
  const refs = shuffleFixed(
    [p.passage.reference, other1.passage.reference, other2.passage.reference],
    p.day,
  );

  // 2) Invitación central
  const right = firstSentence(p.advice);
  const invs = shuffleFixed(
    [right, WRONG_INVITATIONS[p.day % WRONG_INVITATIONS.length]!, WRONG_INVITATIONS[(p.day + 2) % WRONG_INVITATIONS.length]!],
    p.day + 3,
  );

  // 3) Idea del pasaje
  const rightIdea = firstSentence(p.passage.text);
  const ideas = shuffleFixed(
    [rightIdea, firstSentence(other1.passage.text), firstSentence(other2.passage.text)],
    p.day + 5,
  );

  return [
    {
      question: "¿En qué pasaje se apoya la palabra de hoy?",
      options: refs.list,
      correct: refs.indexOf(p.passage.reference),
    },
    {
      question: "¿Cuál es la invitación central de hoy?",
      options: invs.list,
      correct: invs.indexOf(right),
    },
    {
      question: "¿Cuál de estas frases pertenece al pasaje de hoy?",
      options: ideas.list,
      correct: ideas.indexOf(rightIdea),
    },
  ];
}

/* ---------------- Compartir ---------------- */

export type ShareTarget = { id: string; label: string; href?: string; copy?: boolean };

export function shareTargets(text: string): ShareTarget[] {
  const full = text.includes(APP_URL) ? text : `${text}\n\n${APP_URL}`;
  const enc = encodeURIComponent(full);
  const url = encodeURIComponent(APP_URL);
  return [
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${enc}` },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${enc}` },
    { id: "x", label: "X", href: `https://twitter.com/intent/tweet?text=${enc}` },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${url}&text=${enc}` },
    { id: "email", label: "Email", href: `mailto:?subject=${encodeURIComponent("Palabra del día — ORÍGEN")}&body=${enc}` },
    { id: "instagram", label: "Instagram (copiar)", copy: true },
    { id: "copiar", label: "Copiar texto", copy: true },
  ];
}

/** Texto completo para compartir: tema, cita, enseñanza, reflexión para ti y para tu familia + sitio. */
export function palabraFullShareText(p: Palabra): string {
  const blocks = palabraBlocks(p);
  const ense = blocks.find((b) => b.key === "ensenanza")?.text ?? "";
  const refl = blocks.find((b) => b.key === "reflexion")?.text ?? "";
  const fam = blocks.find((b) => b.key === "familia")?.text ?? "";
  return [
    `✨ ${p.title}`,
    "",
    `${p.passage.reference}`,
    p.passage.text,
    "",
    "📖 Enseñanza de hoy",
    ense,
    "",
    "💛 Reflexión para ti",
    refl,
    "",
    "🏡 Reflexión para tu familia",
    fam,
    "",
    `${APP_URL}`,
  ].join("\n");
}
