import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const Input = z.object({ title: z.string().min(3).max(140), category: z.string().max(140), categoryId: z.string().min(1).max(140), audioId: z.string().uuid().nullable().optional(), day: z.number().int().min(1).max(365), context: z.string().max(2000) });
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/admin/generate-manifest")({ server: { handlers: { POST: async ({ request }) => {
  try {
    const bearer = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
    if (!bearer) return reply({ error: "Inicia sesión como administrador." }, 401);
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return reply({ error: "Servicio no disponible." }, 503);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${bearer}` } } });
    const { data: auth, error: authError } = await db.auth.getUser(bearer);
    if (authError || !auth.user) return reply({ error: "Sesión inválida." }, 401);
    const { data: role } = await db.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
    if (!role) return reply({ error: "Solo administradores." }, 403);
    const input = Input.parse(await request.json());
    let query = db.from("manifest_audios").select("title,affirmation,lesson,exercise,quiz,word_game").eq("category_id", input.categoryId);
    if (input.audioId) query = query.neq("id", input.audioId);
    const { data: previous, error } = await query;
    if (error) throw error;
    const { generateSubtopicContent } = await import("@/lib/subtopic-generation.server");
    const content = await generateSubtopicContent({ category: input.category, description: "", title: input.title, day: input.day, notes: input.context, previous: previous ?? [] });
    return reply({ affirmation: content.affirmation, lesson: content.lesson, exercise: content.exercise, word_game: { words: content.search_words }, quiz: { questions: content.quiz, tasks: content.tasks, recipe_steps: content.recipe_steps, materials: content.materials ?? [] } });
  } catch (error) { return reply({ error: error instanceof z.ZodError ? "Revisa los campos y vuelve a intentarlo; no se guardó contenido incompleto." : error instanceof Error ? error.message : "No pudimos completar el contenido. Intenta otra vez." }, 400); }
} } } });