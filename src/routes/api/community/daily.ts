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

async function generateQuestion(topic: string, fallback: typeof PROMPTS[number], key?: string) {
  if (!key) return fallback;
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({ model: "openai/gpt-6-astra", stream: true, store: false, reasoning: { effort: "low" }, input: [{ role: "user", content: [{ type: "input_text", text: `Crea UNA pregunta comunitaria de reflexión sobre ${topic}, en español LATAM. Devuelve SOLO JSON: {"title":"pregunta de 12 a 110 caracteres","options":["opción 1","opción 2","opción 3","opción 4"]}. Opciones igualmente válidas, breves, diferentes y respetuosas; evita diagnósticos, estadísticas, fuentes inventadas, religión impuesta y consejo médico. No incluyas respuesta correcta.` }] }] }),
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
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as { title?: unknown; options?: unknown };
    if (typeof parsed.title !== "string" || parsed.title.length < 12 || parsed.title.length > 110 || !Array.isArray(parsed.options) || parsed.options.length !== 4 || !parsed.options.every(o => typeof o === "string" && o.length > 1 && o.length < 85)) return fallback;
    return { title: parsed.title, options: parsed.options as string[] };
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
  for (const index of indices) {
    const topic = TOPICS[index];
    const { data: existing } = await db.from("community_posts").select("id").eq("topic", topic).eq("is_bot", true).gte("created_at", `${today}T00:00:00Z`).limit(1);
    if (existing?.length) continue;
    const question = await generateQuestion(topic, PROMPTS[index], process.env.LOVABLE_API_KEY);
    const { error } = await db.from("community_posts").insert({ user_id: null, author_name: "ORÍGEN", topic, title: question.title, body: "Una pausa para compartir lo que piensas. Puedes elegir una opción y contar tu experiencia en las respuestas.", poll_options: question.options, is_bot: true, is_verified: false });
    if (!error) created = true;
    else if (error.code !== "23505") {
      console.error("Community daily insert failed", error.code, error.message);
      return Response.json({ error: "Las preguntas de hoy no están disponibles. Inténtalo más tarde." }, { status: 503 });
    }
  }
  return Response.json({ created }, { headers: { "Cache-Control": "private, no-store" } });
} } } });