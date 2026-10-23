import { createFileRoute } from "@tanstack/react-router";
import { CHRISTIAN_LANGUAGE_RULE, hasIncompatibleSpiritualLanguage } from "@/lib/christian-language";

type Body = {
  stageId?: number;
  title?: string;
  focus?: string;
  variant?: string;
};

const FALLBACK = {
  cargas: ["Culpa", "Rencor", "Tristeza", "Dolor", "Enojo", "Miedo", "Vergüenza", "Rechazo", "Soledad", "Ansiedad", "Control", "Silencio", "Abandono", "Orgullo", "Cansancio"],
  words: ["PERDON", "LIBERTAD", "PAZ", "SANAR", "FE", "AMOR", "LUZ", "SOLTAR"],
  promesas: [
    "Dios me ama", "No temas, yo estoy contigo", "Eres mi hijo amado", "Yo te sostengo", "Mi paz te dejo",
    "Todo obra para bien", "Te di libertad", "Nada te falta", "Yo sano tu corazón", "Descansa en mí",
    "Te llamé por tu nombre", "Yo peleo por ti", "Hago nuevas todas las cosas", "Tu llanto tiene fin", "Estoy cerca del quebrantado",
    "Te di un futuro", "No estás sola", "Yo te levanto", "Te cubro con mi mano", "Escucho tu oración",
    "Eres mi obra maestra", "Te libro del temor", "Renuevo tus fuerzas", "Guío tus pasos", "Te doy sabiduría",
    "Perdono tu pasado", "Te doy un corazón nuevo", "Rompo tus cadenas", "Bendigo tu casa", "Camino contigo",
    "Yo soy tu refugio", "Tu valor no cambia",
  ],
  fe: [
    { q: "¿Quién sana las heridas del alma?", options: ["Yo mismo", "Dios", "El tiempo"], correct: 1 },
    { q: "¿Qué necesita una herida para sanar?", options: ["Ser negada", "Ser reconocida", "Ser olvidada"], correct: 1 },
    { q: "¿Qué haces con lo que no puedes controlar?", options: ["Lo entrego", "Lo cargo", "Lo repito"], correct: 0 },
    { q: "Cuando perdonas, ¿quién queda libre primero?", options: ["El otro", "Tú", "Nadie"], correct: 1 },
    { q: "Un patrón familiar deja de repetirse cuando…", options: ["Se esconde", "Se nombra y se cierra", "Se hereda"], correct: 1 },
    { q: "¿Qué haces con lo que no es tuyo?", options: ["Lo cargo", "Lo devuelvo con respeto", "Lo escondo"], correct: 1 },
    { q: "Tu identidad se define por…", options: ["Lo que te dijeron", "Lo que Dios dice de ti", "Tus errores"], correct: 1 },
    { q: "La oración es sobre todo…", options: ["Un trámite", "Una relación", "Un premio"], correct: 1 },
    { q: "Poner un límite sano es…", options: ["Egoísmo", "Amor con verdad", "Rechazo"], correct: 1 },
    { q: "El primer paso de tu restauración es…", options: ["Reconocer la verdad", "Aparentar bien", "Esperar sin actuar"], correct: 0 },
  ],
  bienestar: [
    { q: "¿Con qué frecuencia te sentiste sin ganas de nada esta semana?", options: ["Casi nunca", "Algunos días", "Casi todos los días"] },
    { q: "¿Cómo has dormido últimamente?", options: ["Bien", "Regular", "Muy mal"] },
    { q: "¿Sientes que puedes hablar con alguien de lo que te pasa?", options: ["Sí, tengo con quién", "A veces", "Me siento sola/o"] },
    { q: "¿Has tenido pensamientos de hacerte daño?", options: ["No", "Pensamientos pasajeros", "Sí, con frecuencia"] },
  ],
  solutions: [
    "Observa. Reconoce con calma lo que sientes respecto al tema de hoy.",
    "Escribe. Pon en palabras concretas lo que descubriste.",
    "Habla. Dilo en voz alta como una declaración o una oración corta.",
    "Decide. Elige una acción pequeña y concreta para hoy.",
  ],
  tasks: [
    "Escribe ahora una nota breve sobre cómo te sientes con este tema.",
    "Identifica una situación concreta relacionada y descríbela.",
    "Ora ahora una oración corta sobre esto y confirma cuando termines.",
    "Declara en voz alta una frase que refuerce lo trabajado hoy.",
  ],
};

export const Route = createFileRoute("/api/stage-pack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        const body = (await request.json().catch(() => ({}))) as Body;
        if (!key) return Response.json(FALLBACK);

        const sys = `Eres generador de contenido para la app cristiana ORIGEN (Método ORIGEN, libro "Reconectando el Espíritu con Dios"). Español LATAM, cálido, humano, sin lenguaje esotérico (prohibido: energía, karma, chakras, akáshico, tarot, vibración, magia).
Devuelve SOLO JSON estricto con este shape:
{
  "cargas": ["15 cargas emocionales de UNA o DOS palabras, específicas del tema de la etapa"],
  "words": ["8 palabras de 3 a 9 letras, SIN acentos ni espacios, MAYÚSCULAS, relacionadas al tema de la etapa (para sopa de letras)"],
  "promesas": ["32 promesas bíblicas cortas (máx 5 palabras) en primera persona, distintas entre sí, alineadas al tema"],
  "fe": [{"q":"pregunta","options":["a","b","c"],"correct":0}],
  "bienestar": [{"q":"pregunta de bienestar emocional","options":["opción sana","opción intermedia","opción de alerta"]}],
  "solutions": ["4 pasos de solución, ver instrucciones abajo"],
  "tasks": ["4 tareas realizables ahora mismo, ver instrucciones abajo"]
}
"fe" debe tener EXACTAMENTE 10 preguntas distintas del tema de la etapa, con 3 opciones y el índice correcto.
"bienestar" debe tener 4 preguntas suaves y respetuosas para detectar ánimo bajo (sueño, ganas, soledad, pensamientos de daño), de menor a mayor alerta.
Agrega también:
"solutions": EXACTAMENTE 4 pasos de solución simples, concretos y accionables sobre el tema de la etapa, en este orden de tipo de acción: 1) observar/reconocer, 2) escribir, 3) hablar en voz alta, 4) decidir/actuar. Cada uno con formato "Verbo. Frase corta." Deben ser coherentes entre sí, sin contradicciones ni frases absurdas (prohibido pedir repetir una acción que ya se hizo, como "ora una oración que ya oraste").
"tasks": EXACTAMENTE 4 tareas espirituales que el usuario pueda completar AHORA MISMO dentro de la app marcando una casilla (nunca asignes tareas "para mañana" ni "para el día X"; todo se hace en este momento).
Todo el contenido debe ser NUEVO y distinto para la variante indicada; no repitas listas típicas.`;

        const userMsg = `Etapa ${body.stageId ?? 1}: "${body.title ?? "Sanidad emocional"}"
Área de enfoque: ${body.focus ?? "sanidad emocional"}
Variante única (no repetir contenido de otras variantes): ${body.variant ?? new Date().toISOString().slice(0, 10)}`;

        try {
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "system", content: `${sys}\n${CHRISTIAN_LANGUAGE_RULE}` }, { role: "user", content: userMsg }],
              response_format: { type: "json_object" },
            }),
          });
          if (!r.ok) return Response.json(FALLBACK);
          const j = await r.json();
          const p = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
          if (hasIncompatibleSpiritualLanguage(JSON.stringify(p))) return Response.json(FALLBACK);
          const words = (Array.isArray(p.words) ? p.words : [])
            .map((w: string) => String(w).toUpperCase().normalize("NFD").replace(/[^A-Z]/g, ""))
            .filter((w: string) => w.length >= 3 && w.length <= 9);
          const isCoherentList = (arr: unknown, n: number) =>
            Array.isArray(arr) &&
            arr.length === n &&
            arr.every((x) => typeof x === "string" && x.trim().length >= 8 && !/ya (or[ée]|hice|dije)/i.test(x)) &&
            !/(día|dia)\s*\d/i.test(JSON.stringify(arr));

          return Response.json({
            cargas: Array.isArray(p.cargas) && p.cargas.length >= 8 ? p.cargas.slice(0, 15) : FALLBACK.cargas,
            words: words.length >= 5 ? words.slice(0, 8) : FALLBACK.words,
            promesas: Array.isArray(p.promesas) && p.promesas.length >= 20 ? p.promesas.slice(0, 32) : FALLBACK.promesas,
            fe: Array.isArray(p.fe) && p.fe.length >= 5 ? p.fe.slice(0, 10) : FALLBACK.fe,
            bienestar: Array.isArray(p.bienestar) && p.bienestar.length >= 3 ? p.bienestar.slice(0, 4) : FALLBACK.bienestar,
            solutions: isCoherentList(p.solutions, 4) ? p.solutions : FALLBACK.solutions,
            tasks: isCoherentList(p.tasks, 4) ? p.tasks : FALLBACK.tasks,
          });
        } catch {
          return Response.json(FALLBACK);
        }
      },
    },
  },
});
