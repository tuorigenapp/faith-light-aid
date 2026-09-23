import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { ArrowLeft, Bookmark, Check, ChevronRight, Heart, ImagePlus, Lock, MessageCircle, Mic, Search, Send, Share2, ShieldCheck, Sparkles, Trash2, Users, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comunidad")({
  head: () => ({ meta: [{ title: "Comunidad ORÍGEN — un lugar para acompañarnos" }, { name: "description", content: "Comparte preguntas y conversa con respeto. Comunidad abierta a todas las membresías." }, { property: "og:title", content: "Comunidad ORÍGEN" }, { property: "og:description", content: "Preguntas y conversaciones para acompañarnos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Comunidad,
});

const TOPICS = [
  { key: "general", label: "Para ti", icon: "✦", detail: "Preguntas y compañía para cada día" },
  { key: "familia", label: "Familia", icon: "⌂", detail: "Historias, raíces y límites" },
  { key: "pareja", label: "Relaciones", icon: "♡", detail: "Amor, vínculos y decisiones" },
  { key: "ansiedad", label: "Bienestar", icon: "❋", detail: "Calma y cuidado emocional" },
  { key: "fe", label: "Fe", icon: "✝", detail: "Reflexiones de fe" },
  { key: "logros", label: "Avances", icon: "✧", detail: "Celebremos cada paso" },
];
const EMOJIS = ["💜", "🙏", "🌿", "🥹", "👏", "❤️"];
type Post = { id: string; author_id: string | null; mine: boolean; author_name: string; topic: string; title: string; body: string; created_at: string; is_anonymous: boolean; image_path: string | null; poll_options: string[] | null; source_url: string | null; is_verified: boolean; is_bot: boolean };
type Reply = { id: string; post_id: string; parent_reply_id: string | null; author_id: string | null; mine: boolean; author_name: string; body: string; created_at: string; is_anonymous: boolean; image_path: string | null; audio_path: string | null; is_bot: boolean };
type Reaction = { id: string; user_id: string; target_type: string; target_id: string; emoji: string };

function displayName(value: string, anonymous: boolean, bot = false) {
  if (bot) return "ORÍGEN";
  if (anonymous) return "Alma anónima";
  const parts = value.trim().split(/\s+/);
  return `${parts[0] || "Persona"}${parts[1] ? ` ${parts[1][0].toUpperCase()}.` : ""}`;
}
function Avatar({ name, bot, image }: { name: string; bot?: boolean; image?: string }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-pink-200 text-sm font-bold text-primary">{image ? <img src={image} alt="" className="h-full w-full object-cover" /> : bot ? <Sparkles className="h-5 w-5" /> : name.slice(0, 1).toUpperCase()}</span>;
}

function Comunidad() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"feed" | "topics" | "saved">("feed");
  const [topic, setTopic] = useState("todos");
  const [search, setSearch] = useState("");
  const [openPost, setOpenPost] = useState<string | null>(null);
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [newTopic, setNewTopic] = useState("general");
  const [anonymous, setAnonymous] = useState(false); const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [poll, setPoll] = useState(false); const [options, setOptions] = useState(["", ""]);
  const [postImage, setPostImage] = useState<File | null>(null); const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyText, setReplyText] = useState(""); const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sort, setSort] = useState<"top" | "recent">("top"); const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false); const [audioFile, setAudioFile] = useState<File | null>(null);
  const recorder = useRef<MediaRecorder | null>(null); const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const author = (profile?.full_name || profile?.display_name || "Persona del camino").trim();

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["comunidad", user?.id], enabled: !!user, queryFn: async () => {
     const [posts, reactions, saves, follows, suspension] = await Promise.all([
       supabase.auth.getSession().then(async ({ data: session }) => {
         const res = await fetch("/api/community/feed", { headers: { Authorization: `Bearer ${session.session?.access_token ?? ""}` } });
         if (!res.ok) throw new Error("No se pudo abrir la comunidad.");
         return res.json() as Promise<{ posts: Post[]; replies: Reply[] }>;
       }),
      supabase.from("community_reactions").select("id,user_id,target_type,target_id,emoji").limit(4000),
      supabase.from("community_saves").select("post_id"), supabase.from("community_follows").select("topic"),
      supabase.from("community_suspensions").select("reason").eq("user_id", user!.id).maybeSingle(),
    ]);
     if (reactions.error || saves.error || follows.error) throw reactions.error || saves.error || follows.error;
     return { posts: posts.posts, replies: posts.replies, reactions: (reactions.data ?? []) as Reaction[], saves: new Set((saves.data ?? []).map(s => s.post_id)), follows: new Set((follows.data ?? []).map(f => f.topic)), suspended: suspension.data?.reason ?? null };
  } });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["comunidad"] });
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!data) return;
    let alive = true;
    const paths = [...new Set([...data.posts.map(p => p.image_path), ...data.replies.flatMap(r => [r.image_path, r.audio_path])].filter((x): x is string => !!x))];
    const ids = [...new Set([...data.posts.map(p => p.author_id), ...data.replies.map(r => r.author_id)].filter((x): x is string => !!x))];
    void (async () => {
      const [signed, profiles] = await Promise.all([paths.length ? supabase.storage.from("community-media").createSignedUrls(paths, 3600) : Promise.resolve({ data: [] }), ids.length ? supabase.from("profiles").select("id,avatar_url").in("id", ids.slice(0, 200)) : Promise.resolve({ data: [] })]);
      if (!alive) return;
      setMediaUrls(Object.fromEntries((signed.data ?? []).filter(v => v.signedUrl).map(v => [v.path, v.signedUrl])));
      const av = (profiles.data ?? []).filter(v => v.avatar_url) as { id: string; avatar_url: string }[];
      const avatarPaths = av.filter(v => !v.avatar_url.startsWith("http")).map(v => v.avatar_url);
      const { data: avatarSigned } = avatarPaths.length ? await supabase.storage.from("avatars").createSignedUrls(avatarPaths, 3600) : { data: [] };
      const urls = Object.fromEntries((avatarSigned ?? []).map(v => [v.path, v.signedUrl]));
      if (alive) setAvatars(Object.fromEntries(av.map(v => [v.id, urls[v.avatar_url] ?? v.avatar_url])));
    })();
    return () => { alive = false; };
  }, [data]);

  const active = data?.posts.find(p => p.id === openPost);
  const visible = useMemo(() => (data?.posts ?? []).filter(p => (topic === "todos" || p.topic === topic) && (tab !== "saved" || data?.saves.has(p.id)) && `${p.title} ${p.body}`.toLowerCase().includes(search.toLowerCase())), [data, topic, tab, search]);
  const replies = useMemo(() => (data?.replies ?? []).filter(r => r.post_id === openPost), [data, openPost]);
  const grouped = useMemo(() => { const map = new Map<string, Reply[]>(); for (const r of replies) { const key = r.parent_reply_id ?? "root"; map.set(key, [...(map.get(key) ?? []), r]); } return map; }, [replies]);
  const reactItems = (type: "post" | "reply", id: string) => EMOJIS.map(emoji => { const list = (data?.reactions ?? []).filter(r => r.target_type === type && r.target_id === id && r.emoji === emoji); return { emoji, count: list.length, mine: list.find(r => r.user_id === user?.id)?.id }; });

  async function upload(file: File, type: "image" | "audio") {
    if (file.size > (type === "image" ? 8 : 12) * 1024 * 1024) throw new Error("Archivo demasiado grande.");
    if (type === "image" && !["image/jpeg", "image/png"].includes(file.type)) throw new Error("Solo imágenes JPG o PNG.");
    if (type === "audio" && !["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg"].includes(file.type)) throw new Error("Formato de audio no compatible.");
    const ext = type === "image" ? (file.type === "image/png" ? "png" : "jpg") : ({ "audio/webm": "webm", "audio/mp4": "m4a", "audio/ogg": "ogg", "audio/mpeg": "mp3" } as Record<string, string>)[file.type];
    const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("community-media").upload(path, file, { contentType: file.type });
    if (error) throw error;
    return path;
  }
  async function publish() {
    if (!user || busy || data?.suspended) return;
    if (title.trim().length < 6) return toast.error("Escribe una pregunta más clara.");
    setBusy(true);
    try {
      const image_path = postImage ? await upload(postImage, "image") : null;
      const poll_options = poll ? options.map(o => o.trim()).filter(Boolean) : null;
      if (poll && (poll_options?.length ?? 0) < 2) throw new Error("Agrega al menos dos opciones.");
      const { data: row, error } = await supabase.from("community_posts").insert({ user_id: user.id, author_name: anonymous ? "Alma anónima" : author, is_anonymous: anonymous, topic: newTopic, title: title.trim(), body: body.trim(), image_path, poll_options }).select("id").single();
      if (error) throw error;
      setTitle(""); setBody(""); setPostImage(null); setPoll(false); setOptions(["", ""]); refresh(); setOpenPost(row.id);
      toast.success("Tu pregunta ya está publicada.");
      const { data: session } = await supabase.auth.getSession();
      void fetch("/api/community/bot", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token ?? ""}` }, body: JSON.stringify({ postId: row.id }) }).then(() => refresh()).catch(() => undefined);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  async function reply() {
    if (!user || busy || data?.suspended) return;
    if (!replyText.trim() && !audioFile && !replyImage) return toast.error("Escribe, graba o adjunta algo para responder.");
    setBusy(true);
    try {
      const [image_path, audio_path] = await Promise.all([replyImage ? upload(replyImage, "image") : null, audioFile ? upload(audioFile, "audio") : null]);
      const { error } = await supabase.from("community_replies").insert({ post_id: openPost!, parent_reply_id: replyTo, user_id: user.id, author_name: replyAnonymous ? "Alma anónima" : author, is_anonymous: replyAnonymous, body: replyText.trim() || "Te comparto esto.", image_path, audio_path });
      if (error) throw error;
      setReplyText(""); setReplyTo(null); setReplyImage(null); setAudioFile(null); refresh(); toast.success("Tu respuesta ya está en la conversación.");
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  async function toggleReaction(type: "post" | "reply", id: string, emoji: string, mine?: string) {
    if (data?.suspended) return toast.error("Tu participación está suspendida.");
    const { error } = mine ? await supabase.from("community_reactions").delete().eq("id", mine) : await supabase.from("community_reactions").insert({ user_id: user!.id, target_type: type, target_id: id, emoji });
    if (error) toast.error(error.message); else refresh();
  }
  async function toggleSave(id: string) { const { error } = data?.saves.has(id) ? await supabase.from("community_saves").delete().eq("post_id", id) : await supabase.from("community_saves").insert({ user_id: user!.id, post_id: id }); if (error) toast.error(error.message); else refresh(); }
  async function toggleFollow(key: string) { const { error } = data?.follows.has(key) ? await supabase.from("community_follows").delete().eq("topic", key) : await supabase.from("community_follows").insert({ user_id: user!.id, topic: key }); if (error) toast.error(error.message); else refresh(); }
  async function share(id: string) { const url = `${window.location.origin}/comunidad?post=${id}`; try { if (navigator.share) await navigator.share({ title: "Comunidad ORÍGEN", url }); else { await navigator.clipboard.writeText(url); toast.success("Enlace copiado"); } } catch { /* cancelled */ } }
  async function remove(id: string) { if (!confirm("¿Borrar tu pregunta y sus respuestas?")) return; const { error } = await supabase.from("community_posts").delete().eq("id", id); if (error) toast.error(error.message); else { setOpenPost(null); refresh(); } }
  async function startRecording() {
    if (recording) { recorder.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const format = ["audio/webm", "audio/mp4", "audio/ogg"].find(v => MediaRecorder.isTypeSupported(v));
      if (!format) { stream.getTracks().forEach(t => t.stop()); throw new Error("Tu navegador no permite grabar audio aquí."); }
      const chunks: Blob[] = []; const rec = new MediaRecorder(stream, { mimeType: format }); recorder.current = rec;
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => { if (recordingTimer.current) clearTimeout(recordingTimer.current); stream.getTracks().forEach(t => t.stop()); setRecording(false); if (chunks.length) setAudioFile(new File(chunks, `respuesta.${format.split("/")[1]}`, { type: format })); };
       rec.start(); setRecording(true); recordingTimer.current = setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 4 * 60 * 1000 + 59 * 1000);
    } catch (e) { toast.error((e as Error).message); }
  }
  useEffect(() => { const query = new URLSearchParams(window.location.search).get("post"); if (query && data?.posts.some(p => p.id === query)) setOpenPost(query); }, [data?.posts]);
  useEffect(() => () => { if (recordingTimer.current) clearTimeout(recordingTimer.current); if (recorder.current?.state === "recording") recorder.current.stop(); }, []);

  function ReactionBar({ type, id }: { type: "post" | "reply"; id: string }) {
    const [expanded, setExpanded] = useState(false); const items = reactItems(type, id); const total = items.reduce((s, v) => s + v.count, 0);
    return <div className="flex flex-wrap items-center gap-1.5"><button type="button" aria-label="Elegir reacción" onClick={() => setExpanded(!expanded)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-sm text-muted-foreground"><Heart className="h-4 w-4" /> {total || "Me gusta"}</button>{expanded && <span className="flex flex-wrap gap-1">{items.map(it => <button key={it.emoji} aria-label={`Reaccionar ${it.emoji}`} onClick={() => { void toggleReaction(type, id, it.emoji, it.mine); setExpanded(false); }} className={`min-h-11 min-w-11 rounded-full border px-2 ${it.mine ? "border-primary bg-primary/10" : "border-border"}`}>{it.emoji}{it.count ? ` ${it.count}` : ""}</button>)}</span>}</div>;
  }
  function Thread({ parent = null, depth = 0 }: { parent?: string | null; depth?: number }) {
    const items = [...(grouped.get(parent ?? "root") ?? [])];
    if (sort === "top" && !parent) items.sort((a, b) => (Number(b.is_bot) - Number(a.is_bot)) || (data?.reactions.filter(r => r.target_id === b.id).length ?? 0) - (data?.reactions.filter(r => r.target_id === a.id).length ?? 0));
    if (sort === "recent" && !parent) items.reverse();
    return <div className="space-y-3">{items.map(r => <div key={r.id} className={`rounded-2xl border border-border/70 p-3.5 ${r.is_bot ? "bg-primary/5" : "bg-secondary/30"}`}><div className="flex items-center gap-2"><Avatar name={r.author_name} bot={r.is_bot} image={r.author_id ? avatars[r.author_id] : undefined} /><div><p className="text-sm font-bold">{displayName(r.author_name, r.is_anonymous, r.is_bot)} {r.is_bot && <ShieldCheck className="inline h-4 w-4 text-primary" aria-label="Respuesta verificada de ORÍGEN" />}</p><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })} · {r.is_bot ? "Asistente automático" : "Comunidad"}</p></div></div><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>{r.image_path && mediaUrls[r.image_path] && <img src={mediaUrls[r.image_path]} alt="Adjunto a la respuesta" className="mt-3 max-h-72 w-full rounded-xl object-contain" />}{r.audio_path && mediaUrls[r.audio_path] && <audio controls preload="none" src={mediaUrls[r.audio_path]} className="mt-3 w-full" aria-label="Respuesta de audio" />}<div className="mt-3 flex flex-wrap items-center gap-3"><ReactionBar type="reply" id={r.id} /><button onClick={() => { setReplyTo(r.id); document.getElementById("community-reply")?.focus(); }} className="min-h-11 text-xs font-bold text-primary">Responder a {displayName(r.author_name, r.is_anonymous, r.is_bot)}</button></div>{depth < 8 && grouped.has(r.id) && <div className="mt-3 border-l-2 border-primary/20 pl-3"><Thread parent={r.id} depth={depth + 1} /></div>}</div>)}</div>;
  }

  return <div className="mx-auto max-w-3xl px-4 pb-32 pt-6">
    {active ? <>
      <button onClick={() => { setOpenPost(null); setReplyTo(null); window.history.replaceState(null, "", "/comunidad"); }} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary"><ArrowLeft className="h-5 w-5" /> Volver a la comunidad</button>
      <article className="mt-3 rounded-3xl border border-border bg-card p-5 shadow-soft"><div className="flex items-center gap-3"><Avatar name={active.author_name} bot={active.is_bot} image={active.author_id ? avatars[active.author_id] : undefined} /><div className="flex-1"><p className="text-sm font-bold">{displayName(active.author_name, active.is_anonymous, active.is_bot)} {active.is_verified && <ShieldCheck className="inline h-4 w-4 text-primary" />}</p><p className="text-xs text-muted-foreground">{TOPICS.find(t => t.key === active.topic)?.label} · {new Date(active.created_at).toLocaleDateString("es")}</p></div>{active.mine && <button onClick={() => void remove(active.id)} aria-label="Borrar mi pregunta" className="grid h-11 w-11 place-items-center text-muted-foreground"><Trash2 className="h-4 w-4" /></button>}</div><h1 className="mt-5 font-display text-2xl font-extrabold leading-snug">{active.title}</h1>{active.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{active.body}</p>}{active.image_path && mediaUrls[active.image_path] && <img src={mediaUrls[active.image_path]} alt="Imagen de la pregunta" className="mt-4 max-h-96 w-full rounded-2xl object-cover" />}{active.poll_options && <div className="mt-4 space-y-2">{active.poll_options.map((o, i) => <div key={i} className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">{o}</div>)}<p className="text-xs text-muted-foreground">Encuesta para conversar; las respuestas se comparten en los comentarios.</p></div>}<div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3"><ReactionBar type="post" id={active.id} /><button onClick={() => void share(active.id)} className="inline-flex min-h-11 items-center gap-2 text-sm"><Share2 className="h-4 w-4" /> Compartir</button><button onClick={() => void toggleSave(active.id)} className="inline-flex min-h-11 items-center gap-2 text-sm"><Bookmark className={`h-4 w-4 ${data?.saves.has(active.id) ? "fill-primary text-primary" : ""}`} /> Guardar</button></div></article>
      <div className="mt-6 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Respuestas · {replies.length}</h2><div className="flex gap-2 text-xs"><button onClick={() => setSort("top")} className={sort === "top" ? "font-bold text-primary" : "text-muted-foreground"}>Principales</button><button onClick={() => setSort("recent")} className={sort === "recent" ? "font-bold text-primary" : "text-muted-foreground"}>Últimas</button></div></div><div className="mt-4"><Thread /></div>
      {data?.suspended ? <p className="mt-5 rounded-xl bg-destructive/10 p-4 text-sm">Tu acceso a la comunidad está suspendido: {data.suspended}</p> : <div className="sticky bottom-2 z-20 mt-5 rounded-2xl border border-border bg-card p-3 shadow-xl">{replyTo && <button onClick={() => setReplyTo(null)} className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Respondiendo a un comentario <X className="h-3 w-3" /></button>}<textarea id="community-reply" value={replyText} onChange={e => setReplyText(e.target.value.slice(0, 1600))} rows={2} placeholder="Comparte lo que te ayudó. Con respeto y sin juicios…" className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" /><div className="mt-2 flex flex-wrap items-center gap-2"><label className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl border border-border" title="Añadir JPG o PNG"><ImagePlus className="h-5 w-5" /><input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={e => setReplyImage(e.target.files?.[0] ?? null)} /></label><button onClick={() => void startRecording()} className={`grid h-11 w-11 place-items-center rounded-xl border ${recording ? "border-red-500 text-red-500 animate-pulse" : "border-border"}`} aria-label={recording ? "Detener grabación" : "Grabar audio, máximo cinco minutos"}><Mic className="h-5 w-5" /></button><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={replyAnonymous} onChange={e => setReplyAnonymous(e.target.checked)} /> Anónimo</label><button disabled={busy} onClick={() => void reply()} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" /> Responder</button></div>{(replyImage || audioFile || recording) && <p className="mt-2 text-xs text-primary">{recording ? "Grabando… pulsa para detener (máximo 4:59)" : [replyImage?.name, audioFile?.name].filter(Boolean).join(" · ")} {!recording && <button onClick={() => { setReplyImage(null); setAudioFile(null); }} className="underline">Quitar</button>}</p>}</div>}
    </> : <>
      <section className="rounded-3xl bg-gradient-to-br from-[#423075] via-primary to-[#df92be] p-7 text-white shadow-glow"><span className="text-xs font-semibold uppercase tracking-widest">Un espacio para acompañarnos</span><h1 className="mt-3 font-display text-3xl font-extrabold">No tienes que vivirlo en soledad.</h1><p className="mt-2 max-w-lg text-sm leading-relaxed text-white/90">Pregunta, comparte y encuentra a otras personas que están atravesando caminos parecidos. La comunidad es libre para todos.</p></section>
      <div className="mt-5 flex gap-2 border-b border-border pb-2">{([ ["feed", "Descubrir"], ["topics", "Temas"], ["saved", "Guardados"] ] as const).map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`min-h-11 flex-1 rounded-xl text-sm font-bold ${tab === key ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>{label}</button>)}</div>
      {tab === "topics" ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{TOPICS.map(t => <article key={t.key} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"><span className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-2xl text-primary">{t.icon}</span><div className="flex-1"><h2 className="font-bold">{t.label} <ShieldCheck className="inline h-4 w-4 text-primary" /></h2><p className="text-xs text-muted-foreground">{t.detail}</p><button onClick={() => { setTopic(t.key); setTab("feed"); }} className="mt-2 text-xs font-bold text-primary">Ver conversaciones →</button></div><button onClick={() => void toggleFollow(t.key)} className="min-h-11 rounded-full border border-primary/30 px-3 text-xs font-bold text-primary">{data?.follows.has(t.key) ? "Siguiendo" : "Seguir"}</button></article>)}</div> : <>
        {tab === "feed" && <section className="mt-5 rounded-2xl border border-border bg-card p-4"><h2 className="font-display text-lg font-bold">Haz una pregunta</h2><p className="text-xs text-muted-foreground">ORÍGEN responderá automáticamente cuando esté disponible y otras personas podrán seguir la conversación.</p>{data?.suspended ? <p className="mt-3 text-sm text-destructive">Tu acceso está suspendido: {data.suspended}</p> : <><select value={newTopic} onChange={e => setNewTopic(e.target.value)} className="mt-3 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">{TOPICS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select><input value={title} maxLength={200} onChange={e => setTitle(e.target.value)} placeholder="¿Qué te gustaría preguntar?" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" /><textarea value={body} maxLength={1600} onChange={e => setBody(e.target.value)} placeholder="Cuéntanos un poco más (opcional)" rows={3} className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm" /><div className="mt-2 flex flex-wrap items-center gap-3 text-xs"><label className="flex items-center gap-1"><input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} /> Publicar como alma anónima</label><label className="flex min-h-11 cursor-pointer items-center gap-1 text-primary"><ImagePlus className="h-4 w-4" /> {postImage?.name ?? "Adjuntar JPG/PNG"}<input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={e => setPostImage(e.target.files?.[0] ?? null)} /></label><label className="flex items-center gap-1"><input type="checkbox" checked={poll} onChange={e => setPoll(e.target.checked)} /> Añadir encuesta</label></div>{poll && <div className="mt-2 space-y-2">{options.map((o, i) => <input key={i} value={o} maxLength={100} onChange={e => setOptions(v => v.map((item, index) => index === i ? e.target.value : item))} placeholder={`Opción ${i + 1}`} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />)}{options.length < 4 && <button onClick={() => setOptions(v => [...v, ""])} className="text-xs font-bold text-primary">+ Otra opción</button>}</div>}<button disabled={busy} onClick={() => void publish()} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Publicando…" : "Publicar pregunta"} <Send className="h-4 w-4" /></button></>}</section>}
        <div className="relative mt-5"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversaciones" className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm" /></div><div className="mt-3 flex gap-2 overflow-x-auto pb-2">{[{ key: "todos", label: "Todos" }, ...TOPICS].map(t => <button key={t.key} onClick={() => setTopic(t.key)} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-bold ${topic === t.key ? "border-primary bg-primary text-white" : "border-border bg-card"}`}>{t.label}</button>)}</div>
        {isLoading && <p className="mt-6 text-center text-sm text-muted-foreground">Cargando conversaciones…</p>}{isError && <button className="mt-6 text-primary underline" onClick={() => void refetch()}>No se pudo cargar. Intentar otra vez</button>}{!isLoading && !isError && visible.length === 0 && <div className="mt-5 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Aún no hay preguntas aquí. Puedes iniciar la conversación.</div>}
        <div className="mt-4 space-y-4">{visible.map(p => <article key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft"><div className="flex items-center gap-3"><Avatar name={p.author_name} bot={p.is_bot} image={p.author_id ? avatars[p.author_id] : undefined} /><div className="flex-1"><p className="text-sm font-bold">{displayName(p.author_name, p.is_anonymous, p.is_bot)} {p.is_verified && <ShieldCheck className="inline h-4 w-4 text-primary" />}</p><p className="text-xs text-muted-foreground">{TOPICS.find(t => t.key === p.topic)?.label} · {new Date(p.created_at).toLocaleDateString("es")}</p></div><button onClick={() => void toggleSave(p.id)} aria-label={data?.saves.has(p.id) ? "Quitar guardado" : "Guardar publicación"} className="grid h-11 w-11 place-items-center"><Bookmark className={`h-5 w-5 ${data?.saves.has(p.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} /></button></div><button onClick={() => { setOpenPost(p.id); window.history.replaceState(null, "", `/comunidad?post=${p.id}`); }} className="mt-3 block w-full text-left"><h2 className="font-display text-lg font-bold leading-snug">{p.title}</h2>{p.body && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.body}</p>}{p.image_path && mediaUrls[p.image_path] && <img src={mediaUrls[p.image_path]} alt="Imagen adjunta" className="mt-3 max-h-64 w-full rounded-xl object-cover" />}{p.poll_options && <p className="mt-2 text-xs font-bold text-primary">Encuesta · {p.poll_options.length} opciones</p>}</button><div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3"><ReactionBar type="post" id={p.id} /><button onClick={() => setOpenPost(p.id)} className="inline-flex min-h-11 items-center gap-1.5 text-sm"><MessageCircle className="h-4 w-4" /> {data?.replies.filter(r => r.post_id === p.id).length ?? 0}</button><button onClick={() => void share(p.id)} className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-sm"><Share2 className="h-4 w-4" /> Compartir</button></div></article>)}</div>
      </>}
      <aside className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5"><div className="flex items-center gap-2 text-primary"><Lock className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wide">Explora más con ORÍGEN</span></div><h2 className="mt-2 font-display text-lg font-bold">Acompañamiento para profundizar</h2><p className="mt-1 text-sm text-muted-foreground">Las conversaciones son gratuitas. Si deseas acceder a contenido y herramientas de los planes de pago, elige tu membresía cuando estés listo.</p><Link to="/membresia" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white">Ver planes de pago <ChevronRight className="h-4 w-4" /></Link></aside>
    </>}
  </div>;
}