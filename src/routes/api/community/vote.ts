import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/community/vote")({ server: { handlers: { POST: async ({ request }) => {
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !key || !service) return Response.json({ error: "Inicia sesión." }, { status: 401 });
  const auth = createClient(url, key, { auth: { persistSession: false } });
  const { data: { user } } = await auth.auth.getUser(token);
  if (!user) return Response.json({ error: "Sesión inválida." }, { status: 401 });
  const { postId, choice } = await request.json() as { postId?: string; choice?: number };
  if (!postId || !/^[0-9a-f-]{36}$/i.test(postId) || !Number.isInteger(choice)) return Response.json({ error: "Opción inválida." }, { status: 400 });
  const db = createClient(url, service, { auth: { persistSession: false } });
  const { data: post } = await db.from("community_posts").select("poll_options,poll_answer_index").eq("id", postId).maybeSingle();
  const opts = post?.poll_options;
  if (!post || !Array.isArray(opts) || choice === undefined || choice < 0 || choice >= opts.length) return Response.json({ error: "Pregunta no disponible." }, { status: 404 });
  const { error } = await db.from("community_poll_votes").insert({ post_id: postId, user_id: user.id, choice_index: choice });
  if (error) return Response.json({ error: error.code === "23505" ? "Ya respondiste esta pregunta." : "No se pudo registrar tu respuesta." }, { status: 409 });
  return Response.json({ correct: post.poll_answer_index === null ? null : choice === post.poll_answer_index, answer: post.poll_answer_index }, { headers: { "Cache-Control": "private, no-store" } });
} } } });