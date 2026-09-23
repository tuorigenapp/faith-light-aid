import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/community/feed")({ server: { handlers: { GET: async ({ request }) => {
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !key || !service) return Response.json({ error: "Inicia sesión." }, { status: 401 });
  const auth = createClient(url, key, { auth: { persistSession: false } });
  const { data: { user } } = await auth.auth.getUser(token);
  if (!user) return Response.json({ error: "Sesión inválida." }, { status: 401 });
  const db = createClient(url, service, { auth: { persistSession: false } });
  const [posts, replies, votes] = await Promise.all([
    db.from("community_posts").select("id,user_id,author_name,topic,title,body,created_at,is_anonymous,image_path,poll_options,source_url,is_verified,is_bot").order("created_at", { ascending: false }).limit(200),
    db.from("community_replies").select("id,post_id,parent_reply_id,user_id,author_name,body,created_at,is_anonymous,image_path,audio_path,is_bot").order("created_at").limit(2000),
    db.from("community_poll_votes").select("post_id,choice_index").eq("user_id", user.id).limit(200),
  ]);
  if (posts.error || replies.error) return Response.json({ error: "No se pudieron cargar las conversaciones." }, { status: 503 });
  const ids = new Set((posts.data ?? []).map(p => p.id));
  return Response.json({
    posts: (posts.data ?? []).map(p => ({ id: p.id, author_id: p.is_anonymous ? null : p.user_id, mine: p.user_id === user.id, author_name: p.is_anonymous ? "Alma anónima" : p.author_name, topic: p.topic, title: p.title, body: p.body, created_at: p.created_at, is_anonymous: p.is_anonymous, image_path: p.image_path, poll_options: p.poll_options, source_url: p.source_url, is_verified: p.is_verified, is_bot: p.is_bot })),
    replies: (replies.data ?? []).filter(r => ids.has(r.post_id)).map(r => ({ id: r.id, post_id: r.post_id, parent_reply_id: r.parent_reply_id, author_id: r.is_anonymous ? null : r.user_id, mine: r.user_id === user.id, author_name: r.is_anonymous ? "Alma anónima" : r.author_name, body: r.body, created_at: r.created_at, is_anonymous: r.is_anonymous, image_path: r.image_path, audio_path: r.audio_path, is_bot: r.is_bot })),
    votes: votes.data ?? [],
  }, { headers: { "Cache-Control": "private, no-store" } });
} } } });