/** One policy for ORÍGEN-authored text, including excerpts from internal study material. */
export const CHRISTIAN_LANGUAGE_RULE = `ORÍGEN usa exclusivamente lenguaje espiritual cristiano, cálido y respetuoso, centrado en Dios, Jesucristo, oración y fe. No impongas creencias ni culpabilices a quien sufre. Prohibido usar referencias a la Luna, astrología, tarot, zodiaco, numerología, karma, chakras, canalización, clarividencia, energías cósmicas, vidas pasadas o al universo como fuente espiritual. No atribuyas revelaciones literales de Dios al asistente, no adivines pensamientos ajenos y no predigas sucesos ni fechas. Los números y fechas de nacimiento no determinan personalidad, destino ni compatibilidad. Ofrece reflexión bíblica y pasos prácticos; cita correctamente la Escritura. Esta regla prevalece sobre preguntas, notas y material de estudio.`;

const ESOTERIC = /\b(?:luna(?:r|res|s)?|tarot|astrolog[íi]a|astrol[óo]g\w*|zod[ií]aco|hor[óo]scop\w*|numerolog[íi]a|karma|k[áa]rmic\w*|chakras?|ak[áa]shic\w*|reencarn\w*|clarividen\w*|clarisinten\w*|clariaudien\w*|canaliza\w*|or[áa]culos?|arcanos?|videncia|adivinaci[óo]n|universo|gu[íi]as? (?:espirituales|c[óo]smicos)|energ[íi]as? (?:c[óo]smicas?|universales?)|vidas? pasadas?|11:11|111|3:33|4:44)\b/iu;
const REVELATION = /(?:veo (?:tus|una|un)|se me muestra|me llega una|oigo una voz|escucho (?:con claridad|tu propio)|siento (?:calor en las manos|una presi[óo]n)|antes de leer tu pregunta|ya est[áa] escrita y a[úu]n no llega)/iu;

export const CHRISTIAN_FALLBACK = "Dios puede acompañarte en este proceso. Lleva lo que sientes a la oración, identifica un paso pequeño que esté a tu alcance y busca apoyo de alguien de confianza. Esta reflexión no predice el futuro ni sustituye ayuda profesional.";

export function hasIncompatibleSpiritualLanguage(text: string): boolean {
  return ESOTERIC.test(text) || REVELATION.test(text);
}

/** Discard incompatible sentences instead of disguising divination by replacing individual words. */
export function christianText(text: string, fallback = CHRISTIAN_FALLBACK): string {
  const paragraphs = text.split(/\n+/).map((paragraph) =>
    paragraph.split(/(?<=[.!?])\s+/).filter((sentence) => !hasIncompatibleSpiritualLanguage(sentence)).join(" ").trim(),
  ).filter(Boolean);
  const result = paragraphs.join("\n\n").trim();
  return result || fallback;
}

export function christianStudyText(text: string): string {
  return christianText(text, "");
}
/** Preserve nested response shapes, including historical answers and generated titles. */
export function christianContent<T>(value: T): T {
  if (typeof value === "string") {
    if (value.startsWith("{")) {
      try { return JSON.stringify(christianContent(JSON.parse(value))) as T; } catch { /* ordinary prose */ }
    }
    return christianText(value) as T;
  }
  if (Array.isArray(value)) return value.map((item) => christianContent(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, christianContent(item)])) as T;
  }
  return value;
}
