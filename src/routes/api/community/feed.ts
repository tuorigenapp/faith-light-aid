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
  const query = new URL(request.url).searchParams;
  const search = (query.get("q") ?? "").trim().slice(0, 120);
  const page = Math.min(Math.max(Math.trunc(Number(query.get("page")) || 0), 0), 20);
  const scope = query.get("scope") ?? "feed";
  if (!["feed", "mine", "following", "comments", "saved"].includes(scope)) return Response.json({ error: "Vista inválida." }, { status: 400 });
  const topicNames: Record<string, string> = { "para ti": "general", familia: "familia", relaciones: "pareja", bienestar: "ansiedad", fe: "fe", avances: "logros" };
  const searchValue = topicNames[search.toLocaleLowerCase("es")] ?? search;
  // Keep punctuation, wildcard and PostgREST syntax out of the OR filter.
  const term = searchValue.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  const [matches, followRows, blockRows, commentRows, saveRows] = await Promise.all([
    term ? db.from("community_replies").select("post_id").ilike("body", `%${term}%`).limit(200) : Promise.resolve({ data: [], error: null }),
    scope === "following" ? db.from("community_follows").select("topic").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
    scope === "feed" ? db.from("community_blocks").select("topic").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
    scope === "comments" ? db.from("community_replies").select("post_id").eq("user_id", user.id).limit(5000) : Promise.resolve({ data: [], error: null }),
    scope === "saved" ? db.from("community_saves").select("post_id").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
  ]);
  if (matches.error || followRows.error || blockRows.error || commentRows.error || saveRows.error) return Response.json({ error: "No se pudieron cargar las conversaciones." }, { status: 503 });
  const replyIds = [...new Set((matches.data ?? []).map(r => r.post_id))];
  const scopeIds = scope === "comments" ? [...new Set((commentRows.data ?? []).map(r => r.post_id))] : [...new Set((saveRows.data ?? []).map(r => r.post_id))];
  const followed = (followRows.data ?? []).map(r => r.topic);
  const blocked = (blockRows.data ?? []).map(r => r.topic);
  const noMatches = (scope === "following" && !followed.length) || (["comments", "saved"].includes(scope) && !scopeIds.length);
  const base = db.from("community_posts").select("id,user_id,author_name,topic,title,body,created_at,is_anonymous,image_path,poll_options,source_url,is_verified,is_bot,bot_kind");
  let filtered = term ? base.or(`title.ilike.%${term}%,body.ilike.%${term}%,topic.ilike.%${term}%${replyIds.length ? `,id.in.(${replyIds.join(",")})` : ""}`) : base;
  if (scope === "mine") filtered = filtered.eq("user_id", user.id);
  if (scope === "following" && followed.length) filtered = filtered.in("topic", followed);
  if (["comments", "saved"].includes(scope) && scopeIds.length) filtered = filtered.in("id", scopeIds);
  if (scope === "feed" && blocked.length) filtered = filtered.not("topic", "in", `(${blocked.join(",")})`);
  const limit = (page + 1) * 100;
  const posts = noMatches ? { data: [], error: null } : await filtered.order("created_at", { ascending: false }).range(0, limit);
  if (matches.error || posts.error) return Response.json({ error: "No se pudieron cargar las conversaciones." }, { status: 503 });
  const matchingPosts = (posts.data ?? []).slice(0, limit);
  const ids = new Set(matchingPosts.map(p => p.id));
  const [replies, votes] = await Promise.all([
    ids.size ? db.from("community_replies").select("id,post_id,parent_reply_id,user_id,author_name,body,created_at,is_anonymous,image_path,audio_path,is_bot").in("post_id", [...ids]).order("created_at").limit(3000) : Promise.resolve({ data: [], error: null }),
    db.from("community_poll_votes").select("post_id,choice_index").eq("user_id", user.id).limit(2000),
  ]);
  if (replies.error || votes.error) return Response.json({ error: "No se pudieron cargar las respuestas." }, { status: 503 });
  const totals = ids.size ? await db.rpc("community_vote_totals", { _post_ids: [...ids] }) : { data: [], error: null };
  if (totals.error) return Response.json({ error: "No se pudieron cargar los resultados de las encuestas." }, { status: 503 });
  return Response.json({
    posts: matchingPosts.map(p => ({ id: p.id, author_id: p.is_anonymous || p.is_bot ? null : p.user_id, mine: !p.is_bot && p.user_id === user.id, author_name: p.is_anonymous ? "Alma anónima" : p.author_name, topic: p.topic, title: p.title, body: p.body, created_at: p.created_at, is_anonymous: p.is_anonymous, image_path: p.image_path ? `${p.id}:post:image` : null, poll_options: p.poll_options, source_url: p.source_url, is_verified: p.is_verified, is_bot: p.is_bot, bot_kind: p.bot_kind })),
    replies: (replies.data ?? []).filter(r => ids.has(r.post_id)).map(r => ({ id: r.id, post_id: r.post_id, parent_reply_id: r.parent_reply_id, author_id: r.is_anonymous || r.is_bot ? null : r.user_id, mine: !r.is_bot && r.user_id === user.id, author_name: r.is_anonymous ? "Alma anónima" : r.author_name, body: r.body, created_at: r.created_at, is_anonymous: r.is_anonymous, image_path: r.image_path ? `${r.id}:reply:image` : null, audio_path: !r.image_path && r.audio_path ? `${r.id}:reply:audio` : null, is_bot: r.is_bot })),
    votes: votes.data ?? [],
    totals: totals.data ?? [],
    hasMore: (posts.data?.length ?? 0) === limit + 1,
  }, { headers: { "Cache-Control": "private, no-store" } });
} } } });