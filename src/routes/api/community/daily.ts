import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const TOPICS = ["general", "familia", "pareja", "ansiedad", "fe", "logros"];
const PROMPTS = [
  { title: "¿Qué pequeño paso te ayudó a cuidar de ti esta semana?", options: ["Poner un límite", "Pedir ayuda", "Descansar", "Escribir lo que siento"] },
  { title: "¿Qué conversación te gustaría tener con tu familia?", options: ["Sobre mis necesidades", "Sobre límites", "Sobre recuerdos", "Necesito más tiempo"] },
  { title: "¿Qué te hace sentir escuchado en una relación?", options: ["Atención sin interrumpir", "Respeto a mis límites", "Tiempo juntos", "Preguntas sinceras"] },
  { title: "Cuando necesito calma, ¿qué puedo intentar primero?", options: ["Respirar con pausa", "Salir a caminar", "Hablar con alguien", "Todas pueden ayudar"] },
  { title: "¿Qué palabra te acompaña en un día difícil?", options: ["Esperanza", "Paciencia", "Confianza", "Gratitud"] },
  { title: "¿Qué avance pequeño quieres celebrar hoy?", options: ["Empecé de nuevo", "Pedí compañía", "Tomé un descanso", "Lo escribí"] },
];
const QUIZZES = [
  { title: "Si una conversación se vuelve difícil, ¿qué ayuda a escuchar mejor?", options: ["Interrumpir", "Escuchar y preguntar", "Cambiar de tema", "Suponer lo que siente"], answer: 1 },
  { title: "Al expresar un límite con tu familia, ¿cuál frase es más clara?", options: ["Nunca me entienden", "Haré todo aunque no pueda", "Hoy necesito descansar", "No importa lo que yo quiera"], answer: 2 },
  { title: "¿Qué ayuda a expresar una necesidad en una relación?", options: ["Guardar silencio siempre", "Hablar desde lo que siento", "Adivinar lo que piensa", "Culpar a la otra persona"], answer: 1 },
  { title: "Cuando la ansiedad se intensifica, ¿qué acción puede ayudar a volver al presente?", options: ["Exigirme más", "Ignorar mis señales", "Respirar y buscar apoyo", "Aislarme sin avisar"], answer: 2 },
  { title: "Ante una duda sobre tu fe, ¿qué forma de conversar respeta a los demás?", options: ["Escuchar sin imponer", "Burlarse de otras ideas", "Evitar todas las preguntas", "Exigir una respuesta inmediata"], answer: 0 },
  { title: "¿Cómo reconocer un avance pequeño de forma saludable?", options: ["Compararme con todos", "Restarle importancia", "Esperar a ser perfecto", "Nombrar lo que hice"], answer: 3 },
];

async function generateQuestion(topic: string, fallback: typeof PROMPTS[number] & { answer?: number }, key?: string, quiz = false) {
  if (!key) return fallback;
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({ model: "openai/gpt-6-astra", stream: true, store: false, reasoning: { effort: "low" }, input: [{ role: "user", content: [{ type: "input_text", text: quiz ? `Crea UN juego educativo de selección sobre ${topic}, en español LATAM. Devuelve SOLO JSON {"title":"pregunta de 12 a 110 caracteres","options":["opción 1","opción 2","opción 3","opción 4"],"answer":0}. answer es el índice 0 a 3 de la única respuesta correcta verificable. Opciones breves y claramente diferentes, sin diagnósticos, consejos médicos ni afirmaciones extraordinarias. Si no hay respuesta inequívoca, devuelve el mismo JSON de ejemplo con la pregunta: "¿Qué ayuda a escuchar mejor?", opciones: ["Interrumpir", "Escuchar y preguntar", "Cambiar de tema", "Adivinar lo que piensa"], answer: 1.` : `Crea UNA pregunta comunitaria de reflexión sobre ${topic}, en español LATAM. Devuelve SOLO JSON: {"title":"pregunta de 12 a 110 caracteres","options":["opción 1","opción 2","opción 3","opción 4"]}. Opciones igualmente válidas, breves, diferentes y respetuosas; evita diagnósticos, estadísticas, fuentes inventadas, religión impuesta y consejo médico. No incluyas respuesta correcta.` }] }] }),
    });
    if (!response.ok || !response.body) return fallback;
    let buffer = "", text = "";
    const reader = response.body.getReader(), decoder = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
      for (const line of lines) if (line.startsWith("data:")) {
        try { const event = JSON.parse(line.slice(5)); if (event.type === "response.output_text.delta") text += event.delta ?? ""; } catch { /* partial event */ }
      }
      if (text.length > 2400) { await reader.cancel(); return fallback; }
    }
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as { title?: unknown; options?: unknown; answer?: unknown };
    if (typeof parsed.title !== "string" || parsed.title.length < 12 || parsed.title.length > 110 || !Array.isArray(parsed.options) || parsed.options.length !== 4 || !parsed.options.every(o => typeof o === "string" && o.length > 1 && o.length < 85) || (quiz && (!Number.isInteger(parsed.answer) || Number(parsed.answer) < 0 || Number(parsed.answer) > 3))) return fallback;
    return { title: parsed.title, options: parsed.options as string[], answer: quiz ? Number(parsed.answer) : undefined };
  } catch { return fallback; }
}

export const Route = createFileRoute("/api/community/daily")({ server: { handlers: { POST: async ({ request }) => {
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  const url = process.env.SUPABASE_URL, publishable = process.env.SUPABASE_PUBLISHABLE_KEY, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !publishable || !service) return Response.json({ error: "Inicia sesión." }, { status: 401 });
  const auth = createClient(url, publishable, { auth: { persistSession: false } });
  const { data: { user } } = await auth.auth.getUser(token);
  if (!user) return Response.json({ error: "Sesión inválida." }, { status: 401 });
  const db = createClient(url, service, { auth: { persistSession: false } });
  const today = new Date().toISOString().slice(0, 10);
  const day = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86400000);
  const indices = [day % TOPICS.length, (day + 3) % TOPICS.length];
  let created = false;
  for (const [position, index] of indices.entries()) {
    const topic = TOPICS[index];
    const { data: existing } = await db.from("community_posts").select("id").eq("topic", topic).eq("is_bot", true).gte("created_at", `${today}T00:00:00Z`).limit(1);
    if (existing?.length) continue;
    const quiz = position === 1;
    const question = await generateQuestion(topic, quiz ? QUIZZES[index] : PROMPTS[index], process.env.LOVABLE_API_KEY, quiz);
    const { error } = await db.from("community_posts").insert({ user_id: null, author_name: "ORÍGEN", topic, title: question.title, body: quiz ? "Pon a prueba lo que aprendiste. Elige una respuesta y descubre el resultado." : "Una pausa para compartir lo que piensas. Puedes elegir una opción y contar tu experiencia en las respuestas.", poll_options: question.options, poll_answer_index: question.answer ?? null, is_bot: true, is_verified: false });
    if (!error) created = true;
    else if (error.code !== "23505") {
      console.error("Community daily insert failed", error.code, error.message);
      return Response.json({ error: "Las preguntas de hoy no están disponibles. Inténtalo más tarde." }, { status: 503 });
    }
  }
  return Response.json({ created }, { headers: { "Cache-Control": "private, no-store" } });
} } } });