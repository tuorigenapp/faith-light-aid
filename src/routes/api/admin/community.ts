import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const connect = async (request: Request) => {
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !key || !service) return null;
  const auth = createClient(url, key, { auth: { persistSession: false } });
  const { data: { user } } = await auth.auth.getUser(token);
  if (!user) return null;
  const db = createClient(url, service, { auth: { persistSession: false } });
  const { data: role } = await db.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  return role ? { db, user } : null;
};

export const Route = createFileRoute("/api/admin/community")({ server: { handlers: {
  GET: async ({ request }) => {
    const ctx = await connect(request);
    if (!ctx) return Response.json({ error: "Solo administradores." }, { status: 403 });
    const [posts, replies, reports, suspensions] = await Promise.all([
      ctx.db.from("community_posts").select("id,user_id,author_name,topic,title,body,is_anonymous,is_bot,is_verified,source_url,created_at").order("created_at", { ascending: false }).limit(200),
      ctx.db.from("community_replies").select("id,post_id,user_id,body,is_bot,created_at").order("created_at", { ascending: false }).limit(300),
      ctx.db.from("community_reports").select("*").order("created_at", { ascending: false }).limit(100),
      ctx.db.from("community_suspensions").select("user_id,reason,created_at").limit(100),
    ]);
    if (posts.error || replies.error || reports.error || suspensions.error) return Response.json({ error: "No se pudo cargar la moderación." }, { status: 503 });
    return Response.json({ posts: posts.data, replies: replies.data, reports: reports.data, suspensions: suspensions.data }, { headers: { "Cache-Control": "private, no-store" } });
  },
  POST: async ({ request }) => {
    const ctx = await connect(request);
    if (!ctx) return Response.json({ error: "Solo administradores." }, { status: 403 });
    const { action, id, userId, reason, sourceUrl, topic, title, body, options } = await request.json() as { action?: string; id?: string; userId?: string; reason?: string; sourceUrl?: string; topic?: string; title?: string; body?: string; options?: string[] };
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (id && !uuid.test(id) || userId && !uuid.test(userId)) return Response.json({ error: "Identificador inválido." }, { status: 400 });
    let error: { message: string } | null = null;
    if (action === "create-poll") {
      const choices = Array.isArray(options) ? options.map(o => typeof o === "string" ? o.trim() : "") : [];
      if (!topic || !["general", "familia", "pareja", "ansiedad", "fe", "logros"].includes(topic) || !title?.trim() || title.trim().length < 6 || title.trim().length > 200 || !Array.isArray(options) || choices.length < 3 || choices.length > 6 || choices.some(o => !o || o.length > 100) || new Set(choices.map(o => o.toLocaleLowerCase("es"))).size !== choices.length || (body?.length ?? 0) > 10000) return Response.json({ error: "Revisa el tema, la pregunta y las 3 a 6 opciones diferentes." }, { status: 400 });
       const topicName = { general: "Para ti", familia: "Familia", pareja: "Relaciones", ansiedad: "Bienestar", fe: "Fe", logros: "Avances" }[topic as "general" | "familia" | "pareja" | "ansiedad" | "fe" | "logros"];
       ({ error } = await ctx.db.from("community_posts").insert({ user_id: null, author_name: topicName, topic, title: title.trim(), body: body?.trim() ?? "", poll_options: choices, is_anonymous: false, is_bot: true, bot_kind: "poll" }));
    }
    else if (action === "delete-post" && id) ({ error } = await ctx.db.from("community_posts").delete().eq("id", id));
    else if (action === "delete-reply" && id) ({ error } = await ctx.db.from("community_replies").delete().eq("id", id));
    else if (action === "verify" && id) {
      const source = sourceUrl?.trim();
      if (source && (!/^https:\/\//i.test(source) || source.length > 800)) return Response.json({ error: "La fuente debe ser un enlace HTTPS válido." }, { status: 400 });
      ({ error } = await ctx.db.from("community_posts").update({ is_verified: true, source_url: source || null }).eq("id", id));
    }
    else if (action === "unverify" && id) ({ error } = await ctx.db.from("community_posts").update({ is_verified: false, source_url: null }).eq("id", id));
    else if (action === "suspend" && userId && userId !== ctx.user.id && reason?.trim()) ({ error } = await ctx.db.from("community_suspensions").upsert({ user_id: userId, suspended_by: ctx.user.id, reason: reason.trim().slice(0, 500) }));
    else if (action === "unsuspend" && userId) ({ error } = await ctx.db.from("community_suspensions").delete().eq("user_id", userId));
    else if (action === "review" && id) ({ error } = await ctx.db.from("community_reports").update({ status: "reviewed" }).eq("id", id));
    else return Response.json({ error: "Acción inválida." }, { status: 400 });
    return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ ok: true });
  },
} } });