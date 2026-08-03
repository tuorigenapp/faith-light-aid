import { createFileRoute } from "@tanstack/react-router";

type Body = {
  camino?: string;
  caminoTitle?: string;
  day?: number;
  dayTitle?: string;
  focus?: string;
  variant?: string;
};

const FALLBACK = {
  leccion: "Hoy Dios pone luz en una parte de tu historia que aprendiste a callar. No vienes a revivir el dolor: vienes a entenderlo para que deje de decidir por ti.",
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
  oracion: "Padre, hoy te entrego lo que aprendí a cargar. Sáname desde la raíz, dame paz y enséñame a responder distinto. Amén.",
  resumen: "Dieron un paso real: nombraste la verdad, la entregaste y elegiste una respuesta nueva. Eso es romper el ciclo.",
  cargas: ["Culpa", "Rencor", "Tristeza", "Miedo", "Vergüenza", "Rechazo", "Soledad", "Ansiedad", "Control", "Silencio", "Abandono", "Orgullo", "Cansancio", "Duda", "Prisa"],
  words: ["PERDON", "LIBERTAD", "PAZ", "SANAR", "FE", "AMOR", "LUZ", "SOLTAR"],
  promesas: [
    "Dios me ama", "No temas, estoy contigo", "Eres mi hijo amado", "Yo te sostengo", "Mi paz te dejo",
    "Todo obra para bien", "Te di libertad", "Nada te falta", "Yo sano tu corazón", "Descansa en mí",
    "Te llamé por tu nombre", "Yo peleo por ti", "Hago nuevas las cosas", "Tu llanto tiene fin", "Estoy cerca de ti",
    "Te di un futuro", "No estás sola", "Yo te levanto", "Te cubro con mi mano", "Escucho tu oración",
    "Eres mi obra maestra", "Te libro del temor", "Renuevo tus fuerzas", "Guío tus pasos", "Te doy sabiduría",
    "Perdono tu pasado", "Te doy corazón nuevo", "Rompo tus cadenas", "Bendigo tu casa", "Camino contigo",
    "Soy tu refugio", "Tu valor no cambia",
  ],
  fe: [
    { q: "¿Quién sana las heridas del alma?", options: ["Yo solo", "Dios", "El tiempo"], correct: 1 },
    { q: "¿Qué necesita una herida para sanar?", options: ["Ser negada", "Ser reconocida", "Ser olvidada"], correct: 1 },
    { q: "¿Qué haces con lo que no puedes controlar?", options: ["Lo entrego", "Lo cargo", "Lo repito"], correct: 0 },
    { q: "Cuando perdonas, ¿quién queda libre primero?", options: ["El otro", "Tú", "Nadie"], correct: 1 },
    { q: "Un patrón deja de repetirse cuando…", options: ["Se esconde", "Se nombra y se cierra", "Se hereda"], correct: 1 },
    { q: "Poner un límite sano es…", options: ["Egoísmo", "Amor con verdad", "Rechazo"], correct: 1 },
    { q: "Tu identidad se define por…", options: ["Lo que te dijeron", "Lo que Dios dice de ti", "Tus errores"], correct: 1 },
    { q: "La oración es sobre todo…", options: ["Un trámite", "Una relación", "Un premio"], correct: 1 },
    { q: "El primer paso de tu cambio es…", options: ["Reconocer la verdad", "Aparentar bien", "Esperar sin actuar"], correct: 0 },
    { q: "Avanzar sano significa…", options: ["Ir de prisa", "Un paso por día", "No sentir nada"], correct: 1 },
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

export const Route = createFileRoute("/api/camino-pack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env['LOVABLE_API_KEY'];
        const body = (await request.json().catch(() => ({}))) as Body;
        if (!key) return Response.json(FALLBACK);

        const sys = `Eres el generador de contenido del Método ORIGEN (app cristiana, libro "Reconectando el Espíritu con Dios"). Español LATAM, cálido, humano, bíblico y psicológicamente sano. PROHIBIDO lenguaje esotérico (energía, karma, chakras, akáshico, tarot, vibración, magia, universo).
Devuelve SOLO JSON estricto con este shape exacto:
{
  "leccion": "3 a 5 frases que enseñan la lección del día, personales y concretas",
  "soluciones": ["4 pasos de solución accionables, uno por línea, específicos del tema del día"],
  "tareas": ["4 tareas espirituales del día: una de ESCRIBIR, una de IDENTIFICAR, una de ORAR y una de ACCIÓN concreta"],
  "afirmacion": "una afirmación en primera persona, máx 12 palabras",
  "oracion": "una oración corta (3-4 frases) para el tema del día",
  "resumen": "2 frases de cierre motivador sobre lo trabajado hoy",
  "cargas": ["15 cargas emocionales de 1 o 2 palabras propias del tema"],
  "words": ["8 palabras de 3 a 9 letras, MAYÚSCULAS, sin acentos ni espacios, del tema"],
  "promesas": ["32 promesas bíblicas cortas (máx 5 palabras), distintas entre sí"],
  "fe": [{"q":"pregunta","options":["a","b","c"],"correct":0}],
  "bienestar": [{"q":"pregunta de ánimo","options":["sana","intermedia","alerta"]}],
  "emociones": { "cargas": ["5 emociones a soltar"], "sanas": ["5 emociones a recibir"] }
}
"fe" con EXACTAMENTE 10 preguntas del tema. "bienestar" con 4 preguntas suaves (sueño, ganas, soledad, pensamientos de daño).
Todo debe ser NUEVO para la variante indicada y coherente con el tema y el sexo/enfoque del camino.`;

        const userMsg = `Camino: "${body.caminoTitle ?? "Sanar la raíz"}" (id: ${body.camino ?? "general"})
Etapa diaria ${body.day ?? 1} de 8: "${body.dayTitle ?? "Primer paso"}"
Enfoque del día: ${body.focus ?? "sanidad emocional"}
Variante única: ${body.variant ?? new Date().toISOString().slice(0, 10)}`;

        try {
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
              response_format: { type: "json_object" },
            }),
          });
          if (!r.ok) return Response.json(FALLBACK);
          const j = await r.json();
          const p = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
          const words = (Array.isArray(p.words) ? p.words : [])
            .map((w: string) => String(w).toUpperCase().normalize("NFD").replace(/[^A-Z]/g, ""))
            .filter((w: string) => w.length >= 3 && w.length <= 9);
          const arr = (v: unknown, min: number, max: number, fb: unknown[]) =>
            Array.isArray(v) && v.length >= min ? v.slice(0, max) : fb;
          return Response.json({
            leccion: typeof p.leccion === "string" && p.leccion.length > 40 ? p.leccion : FALLBACK.leccion,
            soluciones: arr(p.soluciones, 3, 4, FALLBACK.soluciones),
            tareas: arr(p.tareas, 3, 4, FALLBACK.tareas),
            afirmacion: typeof p.afirmacion === "string" && p.afirmacion.length > 8 ? p.afirmacion : FALLBACK.afirmacion,
            oracion: typeof p.oracion === "string" && p.oracion.length > 30 ? p.oracion : FALLBACK.oracion,
            resumen: typeof p.resumen === "string" && p.resumen.length > 20 ? p.resumen : FALLBACK.resumen,
            cargas: arr(p.cargas, 8, 15, FALLBACK.cargas),
            words: words.length >= 5 ? words.slice(0, 8) : FALLBACK.words,
            promesas: arr(p.promesas, 20, 32, FALLBACK.promesas),
            fe: arr(p.fe, 5, 10, FALLBACK.fe),
            bienestar: arr(p.bienestar, 3, 4, FALLBACK.bienestar),
            emociones: {
              cargas: arr(p.emociones?.cargas, 3, 5, FALLBACK.emociones.cargas),
              sanas: arr(p.emociones?.sanas, 3, 5, FALLBACK.emociones.sanas),
            },
          });
        } catch {
          return Response.json(FALLBACK);
        }
      },
    },
  },
});
