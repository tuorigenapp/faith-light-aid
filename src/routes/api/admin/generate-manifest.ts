import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const Input = z.object({ title: z.string().min(3).max(140), category: z.string().max(140), day: z.number().int().min(1).max(365), context: z.string().max(2000) });
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/admin/generate-manifest")({ server: { handlers: { POST: async ({ request }) => {
  try {
    const bearer = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
    if (!bearer) return reply({ error: "Inicia sesión como administrador." }, 401);
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return reply({ error: "Servicio no disponible." }, 503);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${bearer}` } } });
    const { data: auth, error: authError } = await db.auth.getUser(bearer);
    if (authError || !auth.user) return reply({ error: "Sesión inválida." }, 401);
    const { data: role } = await db.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
    if (!role) return reply({ error: "Solo administradores." }, 403);
    const input = Input.parse(await request.json());
    const aiKey = process.env.LOVABLE_API_KEY;
    if (!aiKey) return reply({ error: "Generación no disponible." }, 503);
    const prompt = `Escribe en español latinoamericano contenido espiritual y educativo para ORÍGEN. Categoría: ${input.category}. Día ${input.day}. Título: ${input.title}. Contexto del editor: ${input.context || "sin contexto adicional"}. Devuelve JSON estricto sin markdown con affirmation (una frase afirmativa, máximo 160 caracteres), lesson (una lección práctica, 90-150 palabras) y exercise (actividad segura y concreta, 70-120 palabras). Si el tema es receta, incluye ingredientes y pasos concretos; evita afirmaciones médicas, peligrosas o recetas sin precauciones. Nunca inventes fuentes ni atribuyas citas bíblicas no verificadas. El editor revisará antes de publicar.`;
    const r = await fetch("https://ai.gateway.lovable.dev/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", "Lovable-API-Key": aiKey, "X-Lovable-AIG-SDK": "fetch" }, body: JSON.stringify({ model: "openai/gpt-6-astra", input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }], stream: true, store: false, reasoning: { effort: "low" } }) });
    if (!r.ok || !r.body) return reply({ error: "No pudimos generar el contenido." }, 502);
    const reader = r.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let text = "";
    for (;;) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() ?? ""; for (const line of lines) { if (!line.startsWith("data:")) continue; try { const evt = JSON.parse(line.slice(5)); if (evt.type === "response.output_text.delta") text += evt.delta ?? ""; } catch { /* incomplete chunk */ } } }
    const start = text.indexOf("{"); const end = text.lastIndexOf("}");
    if (start < 0 || end < start) return reply({ error: "La generación no devolvió contenido legible." }, 502);
    const parsed = z.object({ affirmation: z.string().min(3).max(600), lesson: z.string().min(20).max(4000), exercise: z.string().min(20).max(2000) }).parse(JSON.parse(text.slice(start, end + 1)));
    return reply(parsed);
  } catch { return reply({ error: "Revisa el título y vuelve a intentarlo." }, 400); }
} } } });