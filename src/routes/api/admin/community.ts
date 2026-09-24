import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const TOPIC_KEYS = ["general", "familia", "pareja", "ansiedad", "fe", "logros"];
const TOPIC_NAMES: Record<string, string> = { general: "Para ti", familia: "Familia", pareja: "Relaciones", ansiedad: "Bienestar", fe: "Fe", logros: "Avances" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

type Db = NonNullable<Awaited<ReturnType<typeof connect>>>["db"];

async function suspensionMessage(note: string, reason: string, kind: string, until: string | null, name: string) {
  const plazo = kind === "permanent" ? "definitiva" : kind === "indefinite" ? "por tiempo indefinido" : `temporal hasta ${until ? new Date(until).toLocaleString("es") : "el plazo indicado"}`;
  const fallback = `${name}, tu participación en la comunidad quedó ${plazo}. Motivo: ${reason}. En ORÍGEN cuidamos la salud mental de cada persona: te pedimos volver con un lenguaje respetuoso y sin señalar a nadie. ⚠️ Si la situación se repite, la administración puede suspender tu acceso de forma definitiva.`;
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return fallback;
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" }, body: JSON.stringify({ model: "openai/gpt-6-astra", input: [
      { role: "system", content: [{ type: "input_text", text: "Eres la administración de ORÍGEN. Redacta en español, 3-5 frases, un aviso de suspensión para la persona indicada. Sé firme, respetuoso y sin humillar. Explica el motivo con claridad, nombra el tono o conducta que debe cambiar, recuerda que ORÍGEN cuida la salud mental de sus usuarios y cierra con una advertencia de que reincidir puede llevar a una suspensión definitiva. No inventes datos ni menciones notas internas." }] },
      { role: "user", content: [{ type: "input_text", text: `Persona: ${name}. Tipo de suspensión: ${plazo}. Motivo: ${reason.slice(0, 500)}. Observación del equipo para orientar el mensaje: ${note.slice(0, 700) || "sin observaciones"}.` }] },
    ], stream: false, store: false }) });
    if (!r.ok) return fallback;
    const data = await r.json() as { output?: { content?: { text?: string }[] }[]; output_text?: string };
    const text = data.output_text ?? data.output?.flatMap(o => o.content ?? []).map(c => c.text ?? "").join(" ");
    return text && text.trim().length > 40 ? `${text.trim().slice(0, 1200)}` : fallback;
  } catch { return fallback; }
}

async function excerpt(db: Db, type?: string, id?: string) {
  if (!id || !uuid.test(id)) return { text: null as string | null, kind: null as string | null };
  if (type === "reply") {
    const { data } = await db.from("community_replies").select("body,author_kind").eq("id", id).maybeSingle();
    return { text: data?.body?.slice(0, 400) ?? null, kind: data?.author_kind ?? null };
  }
  const { data } = await db.from("community_posts").select("title,body,author_kind").eq("id", id).maybeSingle();
  return { text: data ? `${data.title} — ${data.body ?? ""}`.slice(0, 400) : null, kind: data?.author_kind ?? null };
}

export const Route = createFileRoute("/api/admin/community")({ server: { handlers: {
  GET: async ({ request }) => {
    const ctx = await connect(request);
    if (!ctx) return Response.json({ error: "Solo administradores." }, { status: 403 });
    const [posts, replies, reports, suspensions, members] = await Promise.all([
      ctx.db.from("community_posts").select("id,user_id,author_name,author_kind,topic,title,body,is_anonymous,is_bot,is_verified,bot_kind,source_url,image_path,poll_options,created_at").order("created_at", { ascending: false }).limit(300),
      ctx.db.from("community_replies").select("id,post_id,user_id,author_name,author_kind,body,is_anonymous,is_bot,created_at").order("created_at", { ascending: false }).limit(600),
      ctx.db.from("community_reports").select("*").order("created_at", { ascending: false }).limit(150),
      ctx.db.from("community_suspensions").select("user_id,reason,kind,expires_at,target_type,target_id,target_excerpt,admin_note,user_message,created_at").order("created_at", { ascending: false }).limit(200),
      ctx.db.from("profiles").select("id,full_name,email,verified_level").order("created_at", { ascending: false }).limit(400),
    ]);
    if (posts.error || replies.error || reports.error || suspensions.error || members.error) return Response.json({ error: "No se pudo cargar la moderación." }, { status: 503 });
    const profileById = new Map((members.data ?? []).map(m => [m.id, m]));
    const postById = new Map((posts.data ?? []).map(p => [p.id, p]));
    const replyById = new Map((replies.data ?? []).map(r => [r.id, r]));
    const pollIds = (posts.data ?? []).filter(p => Array.isArray(p.poll_options)).map(p => p.id);
    const [{ data: totals }, { data: setting }] = await Promise.all([
      pollIds.length ? ctx.db.rpc("community_vote_totals", { _post_ids: pollIds }) : Promise.resolve({ data: [] as { post_id: string; choice_index: number; vote_count: number }[] }),
      ctx.db.from("community_settings").select("value").eq("key", "auto_reply").maybeSingle(),
    ]);
    const subs = await ctx.db.from("subscriptions").select("user_id,plan,status").in("status", ["active", "trialing"]).limit(1000);
    const paid = new Set((subs.data ?? []).map(s => s.user_id));
    return Response.json({
      autoReply: setting ? setting.value !== false : true,
      votes: totals ?? [],
      posts: (posts.data ?? []).map(p => ({ ...p, author_kind: p.author_kind ?? (p.is_bot ? "ai" : "user"), reply_count: (replies.data ?? []).filter(r => r.post_id === p.id).length })),
      replies: (replies.data ?? []).map(r => ({ ...r, author_kind: r.author_kind ?? (r.is_bot ? "ai" : "user"), post_title: postById.get(r.post_id)?.title ?? "Publicación eliminada", post_topic: postById.get(r.post_id)?.topic ?? "general", post_author_kind: postById.get(r.post_id)?.author_kind ?? "user" })),
      reports: (reports.data ?? []).map(r => {
        const target = r.target_type === "reply" ? replyById.get(r.target_id) : postById.get(r.target_id);
        const post = r.target_type === "reply" ? postById.get((replyById.get(r.target_id)?.post_id ?? "")) : postById.get(r.target_id);
        return { ...r, target_kind: target?.author_kind ?? (target?.is_bot ? "ai" : target ? "user" : "eliminado"), target_user_id: target?.user_id ?? null, target_excerpt: target ? ("title" in target ? `${target.title} — ${target.body ?? ""}` : target.body ?? "").slice(0, 300) : "Contenido eliminado", post_title: post?.title ?? null };
      }),
      suspensions: (suspensions.data ?? []).map(s => ({ ...s, name: profileById.get(s.user_id)?.full_name ?? "Persona de la comunidad", email: profileById.get(s.user_id)?.email ?? null, active: !s.expires_at || Date.parse(s.expires_at) > Date.now() })),
      members: (members.data ?? []).filter(m => paid.has(m.id) || (m.verified_level ?? 0) > 0).map(m => ({ id: m.id, name: m.full_name, email: m.email, level: m.verified_level ?? 0, paid: paid.has(m.id) })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  },
  POST: async ({ request }) => {
    const ctx = await connect(request);
    if (!ctx) return Response.json({ error: "Solo administradores." }, { status: 403 });
    const body = await request.json() as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const id = typeof body.id === "string" ? body.id : undefined;
    const userId = typeof body.userId === "string" ? body.userId : undefined;
    const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
    if ((id && !uuid.test(id)) || (userId && !uuid.test(userId))) return Response.json({ error: "Identificador inválido." }, { status: 400 });
    let error: { message: string } | null = null;

    if (action === "create-post" || action === "create-poll") {
      const topic = text(body.topic); const title = text(body.title); const content = text(body.content ?? body.body);
      const imagePath = text(body.imagePath) || null;
      if (!TOPIC_KEYS.includes(topic) || title.length < 6 || title.length > 200 || content.length > 10000) return Response.json({ error: "Revisa el tema, el título y el texto." }, { status: 400 });
      if (imagePath && !/^[0-9a-f-]{36}\/[\w.-]{6,80}$/i.test(imagePath)) return Response.json({ error: "Imagen no válida." }, { status: 400 });
      let choices: string[] | null = null;
      if (action === "create-poll") {
        const options = Array.isArray(body.options) ? body.options.map(o => typeof o === "string" ? o.trim() : "") : [];
        if (options.length < 3 || options.length > 6 || options.some(o => !o || o.length > 100) || new Set(options.map(o => o.toLocaleLowerCase("es"))).size !== options.length) return Response.json({ error: "Escribe entre 3 y 6 opciones diferentes." }, { status: 400 });
        choices = options;
      }
      ({ error } = await ctx.db.from("community_posts").insert({ user_id: null, author_name: TOPIC_NAMES[topic], author_kind: "admin", topic, title, body: content, poll_options: choices, image_path: choices ? null : imagePath, is_anonymous: false, is_bot: true, is_verified: true, bot_kind: choices ? "poll" : imagePath ? (body.coverMode === true ? "image_cover" : "image") : "cover" }));
    }
    else if (action === "admin-reply") {
      const content = text(body.content);
      const parent = typeof body.parentReplyId === "string" && uuid.test(body.parentReplyId) ? body.parentReplyId : null;
      if (!id || content.length < 2 || content.length > 4000) return Response.json({ error: "Escribe la respuesta de la administración." }, { status: 400 });
      ({ error } = await ctx.db.from("community_replies").insert({ post_id: id, parent_reply_id: parent, user_id: null, author_name: "ORÍGEN", author_kind: "admin", body: content, is_bot: true }));
    }
    else if (action === "auto-reply") ({ error } = await ctx.db.from("community_settings").upsert({ key: "auto_reply", value: body.enabled === true, updated_at: new Date().toISOString() }));
    else if (action === "delete-post" && id) ({ error } = await ctx.db.from("community_posts").delete().eq("id", id));
    else if (action === "delete-reply" && id) ({ error } = await ctx.db.from("community_replies").delete().eq("id", id));
    else if (action === "verify" && id) {
      const source = text(body.sourceUrl);
      if (source && (!/^https:\/\//i.test(source) || source.length > 800)) return Response.json({ error: "La fuente debe ser un enlace HTTPS válido." }, { status: 400 });
      ({ error } = await ctx.db.from("community_posts").update({ is_verified: true, source_url: source || null }).eq("id", id));
    }
    else if (action === "unverify" && id) ({ error } = await ctx.db.from("community_posts").update({ is_verified: false, source_url: null }).eq("id", id));
    else if (action === "set-level" && userId) {
      const level = Number(body.level);
      if (![0, 1, 2, 3].includes(level)) return Response.json({ error: "Nivel inválido." }, { status: 400 });
      ({ error } = await ctx.db.from("profiles").update({ verified_level: level }).eq("id", userId));
    }
    else if (action === "suspend") {
      if (!userId) return Response.json({ error: "Este contenido no tiene una persona asociada para suspender." }, { status: 400 });
      if (userId === ctx.user.id) return Response.json({ error: "No puedes suspender tu propia cuenta de administración." }, { status: 400 });
      const reason = text(body.reason); const note = text(body.note);
      const kind = text(body.kind) || "temporal";
      const days = Math.trunc(Number(body.days) || 0);
      if (reason.length < 5) return Response.json({ error: "Describe el motivo de la suspensión." }, { status: 400 });
      if (!["temporal", "permanent", "indefinite"].includes(kind)) return Response.json({ error: "Tipo de suspensión inválido." }, { status: 400 });
      if (kind === "temporal" && (days < 1 || days > 30)) return Response.json({ error: "El plazo temporal va de 1 a 30 días." }, { status: 400 });
      const expires = kind === "temporal" ? new Date(Date.now() + days * 86400000).toISOString() : null;
      const targetType = text(body.targetType) === "reply" ? "reply" : text(body.targetType) === "post" ? "post" : null;
      const targetId = typeof body.targetId === "string" && uuid.test(body.targetId) ? body.targetId : null;
      const found = await excerpt(ctx.db, targetType ?? undefined, targetId ?? undefined);
      const { data: profile } = await ctx.db.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      const message = await suspensionMessage(note, reason, kind, expires, (profile?.full_name ?? "Persona de la comunidad").split(/\s+/).slice(0, 2).join(" "));
      ({ error } = await ctx.db.from("community_suspensions").upsert({ user_id: userId, suspended_by: ctx.user.id, reason: reason.slice(0, 500), kind, expires_at: expires, target_type: targetType, target_id: targetId, target_excerpt: found.text, admin_note: note.slice(0, 1000) || null, user_message: message }));
    }
    else if (action === "unsuspend" && userId) ({ error } = await ctx.db.from("community_suspensions").delete().eq("user_id", userId));
    else if (action === "review" && id) ({ error } = await ctx.db.from("community_reports").update({ status: text(body.status) === "dismissed" ? "dismissed" : "reviewed" }).eq("id", id));
    else return Response.json({ error: "Acción inválida." }, { status: 400 });
    return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ ok: true });
  },
} } });
