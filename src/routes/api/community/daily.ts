import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const TOPICS = ["general", "familia", "pareja", "ansiedad", "fe", "logros"];
const QUIZZES = [
  [
    { title: "Si una conversación se vuelve difícil, ¿qué ayuda a escuchar mejor?", options: ["Interrumpir", "Escuchar y preguntar", "Cambiar de tema", "Suponer lo que siente"], answer: 1 },
    { title: "Cuando alguien comparte algo personal, ¿qué respuesta cuida su confianza?", options: ["Divulgarlo", "Juzgarlo", "Preguntar cómo desea ser acompañado", "Cambiar de tema"], answer: 2 },
    { title: "Si no sabes cómo ayudar a alguien, ¿qué puedes hacer?", options: ["Prometer resolverlo todo", "Escuchar y preguntar qué necesita", "Decidir por esa persona", "Minimizar lo que siente"], answer: 1 },
  ],
  [
    { title: "Al expresar un límite con tu familia, ¿cuál frase es más clara?", options: ["Nunca me entienden", "Haré todo aunque no pueda", "Hoy necesito descansar", "No importa lo que yo quiera"], answer: 2 },
    { title: "¿Cuál es una forma respetuosa de iniciar una conversación familiar difícil?", options: ["Escuchar y hablar desde mi experiencia", "Acusar a todos", "Gritar para ser escuchado", "Suponer las intenciones"], answer: 0 },
    { title: "Cuando un familiar no respeta tu tiempo, ¿qué puedes expresar?", options: ["Que nunca volverás a hablar", "Que tus necesidades no importan", "Un límite concreto y amable", "Que harás todo por obligación"], answer: 2 },
  ],
  [
    { title: "¿Qué ayuda a expresar una necesidad en una relación?", options: ["Guardar silencio siempre", "Hablar desde lo que siento", "Adivinar lo que piensa", "Culpar a la otra persona"], answer: 1 },
    { title: "Ante un desacuerdo de pareja, ¿qué favorece una conversación sana?", options: ["Escuchar antes de responder", "Amenazar para ganar", "Evitar siempre el tema", "Revisar el teléfono ajeno"], answer: 0 },
    { title: "¿Qué es importante al decir que no en una relación?", options: ["Pedir permiso para sentir", "Respetar mis límites y los de la otra persona", "Aceptar por miedo", "Sentir culpa siempre"], answer: 1 },
  ],
  [
    { title: "Cuando la ansiedad se intensifica, ¿qué acción puede ayudar a volver al presente?", options: ["Exigirme más", "Ignorar mis señales", "Respirar y buscar apoyo", "Aislarme sin avisar"], answer: 2 },
    { title: "¿Cuál es una pausa sencilla para atenderte en un momento difícil?", options: ["Notar mi respiración y mi entorno", "Exigirme respuestas inmediatas", "Compararme con otros", "Ocultar siempre lo que siento"], answer: 0 },
    { title: "Si el malestar persiste e interfiere con tu vida, ¿qué opción puede ayudarte?", options: ["Enfrentarlo siempre a solas", "Buscar apoyo profesional", "Ignorar los síntomas", "Culparme por sentirlo"], answer: 1 },
  ],
  [
    { title: "Ante una duda sobre tu fe, ¿qué forma de conversar respeta a los demás?", options: ["Escuchar sin imponer", "Burlarse de otras ideas", "Evitar todas las preguntas", "Exigir una respuesta inmediata"], answer: 0 },
    { title: "Si alguien vive su espiritualidad de otra manera, ¿qué muestra respeto?", options: ["Imponer mis creencias", "Escuchar con curiosidad y amabilidad", "Descalificar su historia", "Terminar toda conversación"], answer: 1 },
    { title: "Al compartir una experiencia de fe, ¿qué cuida a los demás?", options: ["Hablar desde mi experiencia sin presionar", "Afirmar que todos deben sentir lo mismo", "No aceptar preguntas", "Ridiculizar las dudas"], answer: 0 },
  ],
  [
    { title: "¿Cómo reconocer un avance pequeño de forma saludable?", options: ["Compararme con todos", "Restarle importancia", "Esperar a ser perfecto", "Nombrar lo que hice"], answer: 3 },
    { title: "Si hoy avanzaste menos de lo esperado, ¿qué pensamiento te acompaña mejor?", options: ["Nada cuenta si no es perfecto", "Puedo valorar lo que sí hice", "Debo compararme", "Ya no debo intentarlo"], answer: 1 },
    { title: "¿Cómo puedes celebrar un logro sin compararte con otras personas?", options: ["Recordar el esfuerzo que hubo detrás", "Esperar aprobación de todos", "Negar que costó trabajo", "Medirlo solo por resultados ajenos"], answer: 0 },
  ],
];
const COVER_QUESTIONS = [
  ["¿Qué gesto pequeño te ayuda a volver a ti?", "¿Qué necesitas soltar esta tarde sin juzgarte?", "¿Qué aprendiste de ti en un día difícil?"],
  ["¿Qué límite familiar te gustaría expresar con calma?", "¿Qué recuerdo familiar merece ser escuchado?", "¿Qué conversación pendiente te gustaría tener?"],
  ["¿Cómo reconoces que te sientes escuchado en pareja?", "¿Qué necesitas decir con honestidad en tu relación?", "¿Qué te gustaría cuidar en tu próximo vínculo?"],
  ["¿Qué haces para encontrar un momento de calma?", "¿Qué señal te avisa que necesitas descansar?", "¿Qué pequeña pausa te ayudó hoy?"],
  ["¿Qué pregunta sobre la fe quisieras compartir sin temor?", "¿Qué palabra de esperanza te acompaña hoy?", "¿Cómo vives tu espiritualidad sin imposiciones?"],
  ["¿Qué pequeño avance celebras esta mañana?", "¿Qué hiciste hoy que antes te costaba?", "¿Qué paso te gustaría reconocer antes de dormir?"],
];
const REFLECTION_OPTIONS = [
  ["Hacer una pausa", "Pedir ayuda", "Escribirlo", "Tomar aire", "Hablar con alguien", "Todavía lo descubro"],
  ["Hablar con calma", "Poner un límite", "Escuchar primero", "Tomar distancia", "Pedir apoyo", "Necesito tiempo"],
  ["Pedir claridad", "Escuchar mejor", "Decir lo que siento", "Cuidar mis límites", "Darme tiempo", "Buscar apoyo"],
  ["Respirar", "Caminar", "Descansar", "Escribir", "Pedir compañía", "Hacer una pausa"],
  ["Esperanza", "Paciencia", "Paz", "Confianza", "Gratitud", "Preguntar sin miedo"],
  ["Lo intenté de nuevo", "Pedí ayuda", "Puse un límite", "Descansé", "Me escuché", "Di el primer paso"],
];

export const Route = createFileRoute("/api/community/daily")({ server: { handlers: { POST: async ({ request }) => {
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  const url = process.env.SUPABASE_URL, publishable = process.env.SUPABASE_PUBLISHABLE_KEY, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !publishable || !service) return Response.json({ error: "Inicia sesión." }, { status: 401 });
  const auth = createClient(url, publishable, { auth: { persistSession: false } });
  const { data: { user } } = await auth.auth.getUser(token);
  if (!user) return Response.json({ error: "Sesión inválida." }, { status: 401 });
  const db = createClient(url, service, { auth: { persistSession: false } });
  const now = new Date();
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santo_Domingo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const parts = Object.fromEntries(local.map(p => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000);
  const slot = Number(parts.hour) < 12 ? 0 : Number(parts.hour) < 18 ? 1 : 2;
  const start = `${date}T04:00:00Z`;
  const end = new Date(Date.parse(start) + 86400000).toISOString();
  const { data: existing, error: existingError } = await db.from("community_posts").select("topic,bot_slot,bot_kind").eq("is_bot", true).gte("created_at", start).lt("created_at", end);
  if (existingError) return Response.json({ error: "Las preguntas no están disponibles ahora." }, { status: 503 });
  const seen = new Set((existing ?? []).map(p => `${p.topic}:${p.bot_slot}:${p.bot_kind}`));
  let created = false;
  for (let moment = 0; moment <= slot; moment++) {
    for (const [index, topic] of TOPICS.entries()) {
      for (const kind of ["cover", "poll"] as const) {
        if (seen.has(`${topic}:${moment}:${kind}`)) continue;
         const quiz = QUIZZES[index][moment];
        const title = kind === "cover" ? COVER_QUESTIONS[index][(moment + day) % 3] : quiz.title;
        const opts = kind === "cover" ? REFLECTION_OPTIONS[index].slice(0, 4 + moment) : quiz.options;
        const { error } = await db.from("community_posts").insert({ user_id: null, author_name: "ORÍGEN", topic, title, body: kind === "poll" ? "Elige una respuesta y descubre el resultado. Comparte tu experiencia con los demás." : "Una pregunta para acompañarnos. Elige una opción y cuéntanos tu experiencia en las respuestas.", poll_options: opts, poll_answer_index: kind === "poll" ? opts.indexOf(quiz.options[quiz.answer]) : null, is_bot: true, is_verified: false, bot_slot: moment, bot_kind: kind });
        if (!error) created = true;
        else if (error.code !== "23505") {
          console.error("Community daily insert failed", error.code, error.message);
          return Response.json({ error: "Las preguntas de hoy no están disponibles. Inténtalo más tarde." }, { status: 503 });
        }
      }
    }
  }
  return Response.json({ created }, { headers: { "Cache-Control": "private, no-store" } });
} } } });