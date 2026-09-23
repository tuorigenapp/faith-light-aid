import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const send = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/community/bot")({ server: { handlers: { POST: async ({ request }) => {
  try {
    const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
    const url = process.env.SUPABASE_URL; const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY; const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!token || !url || !publicKey || !secret) return send({ error: "Sesión no disponible." }, 401);
    const authClient = createClient(url, publicKey, { auth: { persistSession: false } });
    const { data: auth } = await authClient.auth.getUser(token);
    if (!auth.user) return send({ error: "Inicia sesión." }, 401);
    const admin = createClient(url, secret, { auth: { persistSession: false } });
    const { postId, replyId } = await request.json() as { postId?: string; replyId?: string };
    const { data: setting } = await admin.from("community_settings").select("value").eq("key", "auto_reply").maybeSingle();
    if (setting && setting.value === false) return send({ ok: true, manual: true });
    if (!postId || !/^[0-9a-f-]{36}$/i.test(postId)) return send({ error: "Pregunta inválida." }, 400);
    const { data: post } = await admin.from("community_posts").select("id,user_id,title,body,topic").eq("id", postId).maybeSingle();
    if (!post) return send({ error: "Pregunta no encontrada." }, 404);
    let question = `${post.title}\n${post.body ?? ""}`; let parent: string | null = null;
    if (replyId) {
      if (!/^[0-9a-f-]{36}$/i.test(replyId)) return send({ error: "Respuesta inválida." }, 400);
      const { data: rep, error: replyError } = await admin.from("community_replies").select("id,user_id,body,post_id,parent_reply_id").eq("id", replyId).maybeSingle();
      if (replyError) return send({ error: "No se pudo revisar esta respuesta." }, 503);
      if (!rep || rep.post_id !== post.id || rep.user_id !== auth.user.id || !rep.body?.trim()) return send({ ok: true });
      // A conversation between people is theirs: never join a reply to another reply.
      if (rep.parent_reply_id) return send({ ok: true, conversation: true });
      const { data: replies, error: repliesError } = await admin.from("community_replies").select("id,user_id,parent_reply_id,is_bot,bot_target_user_id").eq("post_id", post.id).limit(3000);
      if (repliesError) return send({ error: "No se pudo revisar la conversación." }, 503);
      const rows = replies ?? [];
      const mine = new Set(rows.filter(row => row.user_id === auth.user.id).map(row => row.id));
      const alreadyAnswered = rows.some(row => row.is_bot && (row.bot_target_user_id === auth.user.id || (row.parent_reply_id && mine.has(row.parent_reply_id))));
      const humanConversation = rows.some(row => !row.is_bot && row.parent_reply_id === rep.id);
      if (alreadyAnswered || humanConversation) return send({ ok: true });
      question = `Publicación: ${post.title}\nComentario de la persona: ${rep.body}`; parent = rep.id;
    } else {
      if (post.user_id !== auth.user.id) return send({ error: "Pregunta no encontrada." }, 404);
      const { data: existing } = await admin.from("community_replies").select("id").eq("post_id", postId).eq("is_bot", true).is("parent_reply_id", null).limit(1);
      if (existing?.length) return send({ ok: true });
    }
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return send({ error: "La guía automática no está disponible; la comunidad sí puede responder." }, 503);
    const r = await fetch("https://ai.gateway.lovable.dev/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" }, body: JSON.stringify({ model: "openai/gpt-6-astra", input: [{ role: "system", content: [{ type: "input_text", text: "Eres el asistente ORÍGEN. Ofrece una respuesta empática y útil de 2-4 frases, en español, a una pregunta de comunidad. No diagnostiques, no prometas curas, no culpes ni atribuyas revelaciones divinas. Si hay señales de peligro, recomienda ayuda profesional inmediata. Invita a otros usuarios a compartir experiencias. Nunca inventes fuentes." }] }, { role: "user", content: [{ type: "input_text", text: `Tema: ${post.topic}; ${question.slice(0, 1500)}` }] }], stream: true, reasoning: { effort: "low" }, store: false }) });
    if (!r.ok || !r.body) return send({ error: "La guía automática no está disponible ahora." }, 503);
    const reader = r.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let answer = "";
    for (;;) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() ?? ""; for (const line of lines) if (line.startsWith("data:")) { try { const evt = JSON.parse(line.slice(5)); if (evt.type === "response.output_text.delta") answer += evt.delta ?? ""; } catch { /* incomplete */ } } }
    if (answer.trim().length < 15) return send({ error: "La respuesta de ORÍGEN no pudo generarse." }, 503);
    if (replyId) {
      const { data: latest, error: latestError } = await admin.from("community_replies").select("id,user_id,parent_reply_id,is_bot,bot_target_user_id").eq("post_id", post.id).limit(3000);
      if (latestError) return send({ error: "No se pudo revisar la conversación." }, 503);
      const mine = new Set((latest ?? []).filter(row => row.user_id === auth.user.id).map(row => row.id));
      if ((latest ?? []).some(row => row.is_bot && (row.bot_target_user_id === auth.user.id || (row.parent_reply_id && mine.has(row.parent_reply_id)))) || (latest ?? []).some(row => !row.is_bot && row.parent_reply_id === replyId)) return send({ ok: true });
    }
    const { error } = await admin.from("community_replies").insert({ post_id: post.id, parent_reply_id: parent, author_kind: "ai", user_id: null, bot_target_user_id: replyId ? auth.user.id : null, author_name: "ORÍGEN · asistente", body: answer.trim().slice(0, 1600), is_bot: true });
    if (error?.code === "23505") return send({ ok: true });
    if (error) return send({ error: "No se pudo guardar la respuesta." }, 500);
    return send({ ok: true });
  } catch { return send({ error: "La guía automática no está disponible ahora." }, 503); }
} } } });