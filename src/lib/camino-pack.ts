import { useQuery } from "@tanstack/react-query";

export type CaminoPack = {
  leccion: string;
  soluciones: string[];
  tareas: string[];
  afirmacion: string;
  oracion: string;
  resumen: string;
  cargas: string[];
  words: string[];
  promesas: string[];
  fe: { q: string; options: string[]; correct: number }[];
  bienestar: { q: string; options: string[] }[];
  emociones: { cargas: string[]; sanas: string[] };
};

export function caminoVariant(camino: string, day: number) {
  return `${new Date().toISOString().slice(0, 10)}-${camino}-d${day}`;
}

/**
 * Contenido base que se muestra al instante mientras llega la versión
 * personalizada del día. Así la etapa nunca se queda en blanco.
 */
export const CAMINO_PACK_BASE: CaminoPack = {
  leccion:
    "Hoy Dios pone luz en una parte de tu historia que aprendiste a callar. No vienes a revivir el dolor: vienes a entenderlo para que deje de decidir por ti.",
  soluciones: [
    "Nombra en voz alta lo que sientes hoy, sin adornarlo.",
    "Identifica de quién aprendiste esa reacción.",
    "Devuelve con respeto lo que no te pertenece.",
    "Elige una respuesta nueva para la próxima vez.",
  ],
  tareas: [
    "Escribe 5 líneas sobre lo que descubriste hoy.",
    "Identifica una frase que repites y no es tuya.",
    "Ora entregando esta carga en tus propias palabras.",
    "Sostén un límite pequeño hoy mismo.",
  ],
  afirmacion: "Hoy elijo sanar en lugar de repetir.",
  oracion:
    "Padre, hoy te entrego lo que aprendí a cargar. Sáname desde la raíz, dame paz y enséñame a responder distinto. Amén.",
  resumen: "Nombraste la verdad, la entregaste y elegiste una respuesta nueva. Eso es romper el ciclo.",
  cargas: ["Culpa", "Rencor", "Tristeza", "Miedo", "Vergüenza", "Rechazo", "Soledad", "Ansiedad", "Control", "Silencio", "Abandono", "Orgullo", "Cansancio", "Duda", "Prisa"],
  words: ["PERDON", "LIBERTAD", "PAZ", "SANAR", "FE", "AMOR", "LUZ", "SOLTAR"],
  promesas: [
    "Dios me ama", "No temas, estoy contigo", "Eres mi hijo amado", "Yo te sostengo", "Mi paz te dejo",
    "Todo obra para bien", "Te di libertad", "Nada te falta", "Yo sano tu corazón", "Descansa en mí",
    "Te llamé por tu nombre", "Yo peleo por ti",
  ],
  fe: [
    { q: "¿Quién sana las heridas del alma?", options: ["Yo solo", "Dios", "El tiempo"], correct: 1 },
    { q: "¿Qué necesita una herida para sanar?", options: ["Ser negada", "Ser reconocida", "Ser olvidada"], correct: 1 },
    { q: "¿Qué haces con lo que no puedes controlar?", options: ["Lo entrego", "Lo cargo", "Lo repito"], correct: 0 },
    { q: "Cuando perdonas, ¿quién queda libre primero?", options: ["El otro", "Tú", "Nadie"], correct: 1 },
    { q: "Un patrón deja de repetirse cuando…", options: ["Se esconde", "Se nombra y se cierra", "Se hereda"], correct: 1 },
  ],
  bienestar: [
    { q: "¿Con qué frecuencia te sentiste sin ganas de nada esta semana?", options: ["Casi nunca", "Algunos días", "Casi todos los días"] },
    { q: "¿Cómo has dormido últimamente?", options: ["Bien", "Regular", "Muy mal"] },
    { q: "¿Sientes que puedes hablar con alguien de lo que te pasa?", options: ["Sí, tengo con quién", "A veces", "Me siento solo/a"] },
    { q: "¿Has tenido pensamientos de hacerte daño?", options: ["No", "Pensamientos pasajeros", "Sí, con frecuencia"] },
  ],
  emociones: {
    cargas: ["Culpa heredada", "Miedo al rechazo", "Necesidad de aprobación", "Rencor viejo", "Vergüenza"],
    sanas: ["Paz", "Gratitud", "Confianza", "Ternura", "Esperanza"],
  },
};

export function useCaminoPack(args: {
  camino: string;
  caminoTitle: string;
  day: number;
  dayTitle: string;
  focus: string;
}) {
  const variant = caminoVariant(args.camino, args.day);
  return useQuery<CaminoPack>({
    queryKey: ["camino-pack", variant],
    staleTime: 1000 * 60 * 60 * 6,
    placeholderData: CAMINO_PACK_BASE,
    queryFn: async () => {
      const r = await fetch("/api/camino-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...args, variant }),
      });
      if (!r.ok) return CAMINO_PACK_BASE;
      try {
        return (await r.json()) as CaminoPack;
      } catch {
        return CAMINO_PACK_BASE;
      }
    },
  });
}
