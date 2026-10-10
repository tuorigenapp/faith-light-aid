import bNino from "@/assets/banner-nino.png";
import bGlowHombre from "@/assets/banner-glow-hombre.png";
import bGlowMujer from "@/assets/banner-glow-mujer.png";
import bPermiso from "@/assets/banner-permiso.png";
import bMagnetico from "@/assets/banner-magnetico.png";
import bDepresion from "@/assets/banner-depresion.png";
import bNarcisista from "@/assets/banner-narcisista.png";

export const CAMINO_TOTAL_DAYS = 8;
/** Costo en hojas para abrir la semana completa (los 7 días restantes). */
export const WEEK_UNLOCK_COST = 1;

export type CaminoEtapa = {
  day: number;
  title: string;
  focus: string;
  insignia: string;
};

export type Camino = {
  id: string;
  title: string;
  short: string;
  claim: string;
  banner: string;
  gradient: string;
  tint: string;
  scripture: { text: string; ref: string };
  etapas: CaminoEtapa[];
};

export const CAMINOS: Camino[] = [
  {
    id: "nino-interior",
    title: "Sanar al niño o niña interior",
    short: "Sana a mamá, sana a papá",
    claim: "El adulto que eres se calma cuando el niño que fuiste se siente visto.",
    banner: bNino,
    gradient: "from-primary via-accent-pink to-gold",
    tint: "text-primary",
    scripture: { text: "Dejad a los niños venir a mí.", ref: "Mateo 19:14" },
    etapas: [
      { day: 1, title: "Conoce a tu niño interior", focus: "reconocimiento", insignia: "Corazón visto" },
      { day: 2, title: "La escena que te marcó", focus: "herida de origen", insignia: "Verdad nombrada" },
      { day: 3, title: "Sana a mamá", focus: "vínculo materno", insignia: "Raíz materna" },
      { day: 4, title: "Sana a papá", focus: "vínculo paterno", insignia: "Raíz paterna" },
      { day: 5, title: "Devuelve lo que no era tuyo", focus: "cargas heredadas", insignia: "Manos libres" },
      { day: 6, title: "Perdón sin negar el dolor", focus: "perdón", insignia: "Perdón real" },
      { day: 7, title: "El abrazo que esperabas", focus: "consuelo", insignia: "Niño en paz" },
      { day: 8, title: "Adulto que cuida", focus: "identidad", insignia: "Ciclo roto" },
    ],
  },
  {
    id: "glowup-mujer",
    title: "Glow Up: mujer de alto valor",
    short: "Alto valor desde adentro",
    claim: "El verdadero glow up empieza cuando dejas de mendigar lo que ya eres.",
    banner: bGlowMujer,
    gradient: "from-accent-pink via-primary to-gold",
    tint: "text-accent-pink",
    scripture: { text: "Mujer virtuosa, ¿quién la hallará?", ref: "Proverbios 31:10" },
    etapas: [
      { day: 1, title: "Tu valor no se negocia", focus: "autoestima", insignia: "Valor firme" },
      { day: 2, title: "Suelta la mendicidad emocional", focus: "apego", insignia: "Manos abiertas" },
      { day: 3, title: "Estándares con amor", focus: "límites", insignia: "Sí sano" },
      { day: 4, title: "Cuerpo, orden y presencia", focus: "hábitos", insignia: "Templo cuidado" },
      { day: 5, title: "Habla como quien se respeta", focus: "comunicación", insignia: "Voz clara" },
      { day: 6, title: "Sana la comparación", focus: "identidad", insignia: "Sin espejos" },
      { day: 7, title: "Dinero, metas y propósito", focus: "propósito", insignia: "Camino propio" },
      { day: 8, title: "Mujer de alto valor", focus: "consolidación", insignia: "Glow real" },
    ],
  },
  {
    id: "glowup-hombre",
    title: "Glow Up: hombre de alto valor",
    short: "Carácter antes que imagen",
    claim: "Un hombre de alto valor no se impone: se sostiene.",
    banner: bGlowHombre,
    gradient: "from-[#61A8FF] via-primary to-gold",
    tint: "text-[#3F7FD1]",
    scripture: { text: "Esfuérzate y sé valiente.", ref: "Josué 1:9" },
    etapas: [
      { day: 1, title: "El hombre que decidiste ser", focus: "identidad", insignia: "Decisión firme" },
      { day: 2, title: "Sana la figura de tu padre", focus: "vínculo paterno", insignia: "Raíz sanada" },
      { day: 3, title: "Domina tus impulsos", focus: "dominio propio", insignia: "Mente firme" },
      { day: 4, title: "Palabra que se cumple", focus: "integridad", insignia: "Palabra fiel" },
      { day: 5, title: "Cuerpo, disciplina y energía", focus: "hábitos", insignia: "Cuerpo listo" },
      { day: 6, title: "Amar sin controlar", focus: "relaciones", insignia: "Amor libre" },
      { day: 7, title: "Provisión y visión", focus: "propósito", insignia: "Visión clara" },
      { day: 8, title: "Hombre de alto valor", focus: "consolidación", insignia: "Carácter" },
    ],
  },
  {
    id: "magnetico",
    title: "Vuélvete magnético/a",
    short: "Atrae lo que quieras",
    claim: "Dejas de perseguir el día que empiezas a elegir.",
    banner: bMagnetico,
    gradient: "from-gold via-accent-pink to-primary",
    tint: "text-gold",
    scripture: { text: "Deléitate en el Señor y él te dará los deseos de tu corazón.", ref: "Salmo 37:4" },
    etapas: [
      { day: 1, title: "Deja de perseguir", focus: "desapego", insignia: "Paz interior" },
      { day: 2, title: "Sana la necesidad de aprobación", focus: "autoestima", insignia: "Sin permiso" },
      { day: 3, title: "Presencia que se siente", focus: "presencia", insignia: "Aquí y ahora" },
      { day: 4, title: "Habla menos, comunica más", focus: "comunicación", insignia: "Voz serena" },
      { day: 5, title: "Cierra puertas que te vacían", focus: "límites", insignia: "Puerta cerrada" },
      { day: 6, title: "Fe que atrae, no ansiedad", focus: "fe", insignia: "Fe tranquila" },
      { day: 7, title: "Ordena tu vida y tu espacio", focus: "hábitos", insignia: "Orden nuevo" },
      { day: 8, title: "Magnético/a por identidad", focus: "consolidación", insignia: "Imán real" },
    ],
  },
  {
    id: "permiso",
    title: "Deja de pedir permiso para existir",
    short: "Tu primer no sin culpa",
    claim: "No naciste para pedir permiso: naciste para ocupar tu lugar.",
    banner: bPermiso,
    gradient: "from-primary via-[#61A8FF] to-accent-pink",
    tint: "text-primary",
    scripture: { text: "Para libertad fuiste llamado.", ref: "Gálatas 5:1" },
    etapas: [
      { day: 1, title: "¿Cuándo aprendiste a pedir permiso?", focus: "origen", insignia: "Origen visto" },
      { day: 2, title: "La culpa que no era tuya", focus: "culpa", insignia: "Culpa devuelta" },
      { day: 3, title: "Tu primer no sin explicar", focus: "límites", insignia: "Primer no" },
      { day: 4, title: "Deja de complacer para ser amado", focus: "complacencia", insignia: "Amor sano" },
      { day: 5, title: "Ocupa tu lugar en tu familia", focus: "familia", insignia: "Lugar propio" },
      { day: 6, title: "Habla claro sin pelear", focus: "comunicación", insignia: "Voz firme" },
      { day: 7, title: "Decide sin buscar aprobación", focus: "decisión", insignia: "Decisión libre" },
      { day: 8, title: "Existir sin pedir permiso", focus: "consolidación", insignia: "Libertad" },
    ],
  },
  {
    id: "depresion-ansiedad",
    title: "Salir de la depresión y la ansiedad",
    short: "Paz para tu mente y tu cuerpo",
    claim: "La tristeza que te apaga y el miedo que te acelera se trabajan juntos, no por separado.",
    banner: bDepresion,
    gradient: "from-primary via-[#61A8FF] to-accent-green",
    tint: "text-primary",
    scripture: { text: "No temas, porque yo estoy contigo.", ref: "Isaías 41:10" },
    etapas: [
      { day: 1, title: "Ponle nombre a lo que sientes", focus: "reconocimiento", insignia: "Verdad dicha" },
      { day: 2, title: "De dónde viene tu tristeza", focus: "origen familiar", insignia: "Raíz vista" },
      { day: 3, title: "Calma tu cuerpo primero", focus: "respiración", insignia: "Cuerpo en paz" },
      { day: 4, title: "Corta el pensamiento que te hunde", focus: "mente", insignia: "Mente firme" },
      { day: 5, title: "Un motivo para levantarte hoy", focus: "propósito diario", insignia: "Paso dado" },
      { day: 6, title: "El miedo que anticipa lo peor", focus: "ansiedad", insignia: "Miedo devuelto" },
      { day: 7, title: "Pide ayuda sin vergüenza", focus: "apoyo", insignia: "Manos tomadas" },
      { day: 8, title: "Vivir con esperanza real", focus: "consolidación", insignia: "Luz de vuelta" },
    ],
  },
  {
    id: "salir-narcisista",
    title: "Salir de una relación narcisista",
    short: "Recupera tu voz y tu lugar",
    claim: "No estás loca ni exagerada: estás cansada de sostener sola lo que dos rompieron.",
    banner: bNarcisista,
    gradient: "from-primary via-accent-pink to-gold",
    tint: "text-accent-pink",
    scripture: { text: "La verdad os hará libres.", ref: "Juan 8:32" },
    etapas: [
      { day: 1, title: "Lo que vives tiene nombre", focus: "reconocimiento", insignia: "Ojos abiertos" },
      { day: 2, title: "Cómo te hicieron dudar de ti", focus: "manipulación", insignia: "Mente clara" },
      { day: 3, title: "Deja de justificar lo que te duele", focus: "límites", insignia: "Basta dicho" },
      { day: 4, title: "Tu plan de salida paso a paso", focus: "decisión", insignia: "Plan listo" },
      { day: 5, title: "Corta el contacto que te vacía", focus: "distancia", insignia: "Puerta cerrada" },
      { day: 6, title: "Sana la culpa que te dejaron", focus: "culpa", insignia: "Culpa devuelta" },
      { day: 7, title: "Reconstruye tu propia voz", focus: "identidad", insignia: "Voz propia" },
      { day: 8, title: "Amar sin perderte otra vez", focus: "consolidación", insignia: "Libertad" },
    ],
  },
];

export function getCamino(id: string) {
  return CAMINOS.find((c) => c.id === id) ?? null;
}

export function getEtapa(camino: Camino, day: number) {
  return camino.etapas.find((e) => e.day === day) ?? camino.etapas[0];
}

/** Datos que guarda un camino creado en el panel (mismo formato que los de arriba). */
export type CustomCaminoContent = {
  short?: string;
  claim?: string;
  scripture?: { text: string; ref: string };
  etapas?: CaminoEtapa[];
  stages?: { title: string; lessons?: { title: string }[] }[];
};

/** Convierte un camino creado en el panel en un Camino con las 8 etapas diarias. */
export function customToCamino(c: { slug: string; title: string; subtitle: string | null; cover_url: string | null; content: CustomCaminoContent }): Camino {
  const ct = c.content ?? {};
  let etapas = (ct.etapas ?? []).slice(0, CAMINO_TOTAL_DAYS);
  if (etapas.length < CAMINO_TOTAL_DAYS) {
    const titles = (ct.stages ?? []).flatMap((s) => (s.lessons ?? []).map((l) => l.title.replace(/^(Día \d+|Cierre)\s*:\s*/i, "")));
    etapas = Array.from({ length: CAMINO_TOTAL_DAYS }, (_, i) => etapas[i] ?? { day: i + 1, title: titles[i] || `Etapa ${i + 1}`, focus: c.title, insignia: `Etapa ${i + 1}` });
  }
  return {
    id: c.slug,
    title: c.title,
    short: ct.short || c.subtitle || c.title,
    claim: ct.claim || c.subtitle || "",
    banner: c.cover_url ?? "",
    gradient: "from-primary via-accent-pink to-gold",
    tint: "text-primary",
    scripture: ct.scripture ?? { text: "Él sana a los quebrantados de corazón y venda sus heridas.", ref: "Salmos 147:3" },
    etapas: etapas.map((e, i) => ({ ...e, day: i + 1 })),
  };
}
