/**
 * Afirmaciones del Paso 1 — se eligen por el enfoque de la etapa y por el
 * camino, para que ningún camino repita las mismas palabras.
 */

export type Affirmation = { emoji: string; text: string };

const BY_FOCUS: Record<string, Affirmation[]> = {
  ansiedad: [
    { emoji: "🌿", text: "Puedo calmarme" },
    { emoji: "🌿", text: "Puedo respirar" },
    { emoji: "🌿", text: "Estoy a salvo" },
    { emoji: "🌿", text: "Puedo soltar" },
  ],
  autoestima: [
    { emoji: "✨", text: "Valgo por existir" },
    { emoji: "✨", text: "Merezco respeto" },
    { emoji: "✨", text: "Confío en mí" },
    { emoji: "✨", text: "Mi voz importa" },
  ],
  "niño interior": [
    { emoji: "🤍", text: "Merezco cariño" },
    { emoji: "🤍", text: "Puedo ser yo" },
    { emoji: "🤍", text: "Estoy seguro conmigo" },
    { emoji: "🤍", text: "Puedo expresarme" },
  ],
  límites: [
    { emoji: "💫", text: "Mi no también es amor" },
    { emoji: "💫", text: "Cuido mi energía" },
    { emoji: "💫", text: "Puedo decidir" },
    { emoji: "💫", text: "No debo explicar todo" },
  ],
  identidad: [
    { emoji: "🌸", text: "Sé quién soy" },
    { emoji: "🌸", text: "No me comparo" },
    { emoji: "🌸", text: "Mi valor no se negocia" },
    { emoji: "🌸", text: "Soy suficiente hoy" },
  ],
  perdón: [
    { emoji: "🕊️", text: "Suelto sin negar el dolor" },
    { emoji: "🕊️", text: "Elijo la paz" },
    { emoji: "🕊️", text: "Devuelvo lo que no es mío" },
    { emoji: "🕊️", text: "Hoy descanso" },
  ],
  propósito: [
    { emoji: "🌱", text: "Doy un paso hoy" },
    { emoji: "🌱", text: "Mi camino es mío" },
    { emoji: "🌱", text: "Avanzo con calma" },
    { emoji: "🌱", text: "Lo que siembro crece" },
  ],
  presencia: [
    { emoji: "💫", text: "Estoy aquí y ahora" },
    { emoji: "💫", text: "No persigo, elijo" },
    { emoji: "💫", text: "Mi calma se siente" },
    { emoji: "💫", text: "No necesito aprobación" },
  ],
  disciplina: [
    { emoji: "🔥", text: "Cumplo lo que digo" },
    { emoji: "🔥", text: "Sostengo mi palabra" },
    { emoji: "🔥", text: "Un día a la vez" },
    { emoji: "🔥", text: "Elijo mi mejor versión" },
  ],
  libertad: [
    { emoji: "🕊️", text: "No pido permiso para existir" },
    { emoji: "🕊️", text: "Ocupo mi lugar" },
    { emoji: "🕊️", text: "Puedo ser auténtico" },
    { emoji: "🕊️", text: "Elijo sin culpa" },
  ],
};

/** Palabras clave del enfoque → grupo de afirmaciones. */
const MATCH: [RegExp, keyof typeof BY_FOCUS][] = [
  [/ansied|calma|paz|emocional|consuelo|miedo/i, "ansiedad"],
  [/autoestim|valor|aprobaci|comparaci/i, "autoestima"],
  [/niñ|infan|materno|paterno|recuerdo|herida de origen|reconocimiento/i, "niño interior"],
  [/límit|limite|no\b|complacen|apego/i, "límites"],
  [/identidad|consolidaci|decisi/i, "identidad"],
  [/perd|culpa|carga|soltar/i, "perdón"],
  [/propósit|proposito|dinero|meta|visi|provisi/i, "propósito"],
  [/presencia|magnét|magnet|comunicaci|desapego/i, "presencia"],
  [/hábito|habito|disciplina|dominio|integridad|cuerpo/i, "disciplina"],
  [/libert|permiso|origen|familia/i, "libertad"],
];

/** Toque temático extra por camino, para que no se repitan entre rutas. */
const BY_CAMINO: Record<string, Affirmation[]> = {
  "nino-interior": [
    { emoji: "🤍", text: "El niño que fui ya está a salvo" },
    { emoji: "🧸", text: "Puedo jugar otra vez" },
    { emoji: "🤍", text: "Hoy me cuido yo" },
  ],
  "glowup-mujer": [
    { emoji: "✨", text: "No mendigo lo que ya soy" },
    { emoji: "🌸", text: "Mi presencia habla por mí" },
    { emoji: "✨", text: "Elijo con estándares" },
  ],
  "glowup-hombre": [
    { emoji: "🔥", text: "Me sostengo sin imponerme" },
    { emoji: "🛡️", text: "Mi palabra vale" },
    { emoji: "🔥", text: "Domino mis impulsos" },
  ],
  magnetico: [
    { emoji: "💫", text: "Dejo de perseguir" },
    { emoji: "🧲", text: "Atraigo desde la calma" },
    { emoji: "💫", text: "Elijo, no ruego" },
  ],
  permiso: [
    { emoji: "🕊️", text: "Digo no sin culpa" },
    { emoji: "🚪", text: "Cierro lo que me vacía" },
    { emoji: "🕊️", text: "Existo sin permiso" },
  ],
};

const FALLBACK: Affirmation[] = [
  { emoji: "🌿", text: "Hoy doy un paso" },
  { emoji: "✨", text: "Estoy en proceso" },
  { emoji: "🤍", text: "Merezco sanar" },
  { emoji: "💫", text: "No estoy solo en esto" },
];

/**
 * Afirmaciones para el Paso 1 de una etapa.
 * @param focus enfoque de la etapa (focus_area / focus)
 * @param caminoId id del camino cuando aplica
 * @param words palabras del contenido del día (las genera la IA de ORÍGEN)
 */
export function affirmationsFor(focus?: string | null, caminoId?: string | null, words: string[] = []): Affirmation[] {
  const key = MATCH.find(([re]) => re.test(focus ?? ""))?.[1];
  const base = key ? BY_FOCUS[key]! : FALLBACK;
  const extra = caminoId ? (BY_CAMINO[caminoId] ?? []) : [];
  const fromWords = words
    .map((w) => (w ?? "").trim())
    .filter((w) => w.length > 2 && w.length < 22)
    .slice(0, 2)
    .map((w) => ({ emoji: "🌱", text: `Hoy elijo ${w.toLowerCase()}` }));
  const all = [...base, ...extra, ...fromWords];
  const seen = new Set<string>();
  return all.filter((a) => (seen.has(a.text) ? false : (seen.add(a.text), true))).slice(0, 7);
}
