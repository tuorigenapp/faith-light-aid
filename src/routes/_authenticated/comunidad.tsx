import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/hooks/use-profile";
import scene01 from "@/assets/community-scenes/scene-01.jpg";
import scene02 from "@/assets/community-scenes/scene-02.jpg";
import scene03 from "@/assets/community-scenes/scene-03.jpg";
import scene04 from "@/assets/community-scenes/scene-04.jpg";
import scene05 from "@/assets/community-scenes/scene-05.jpg";
import scene06 from "@/assets/community-scenes/scene-06.jpg";
import scene07 from "@/assets/community-scenes/scene-07.jpg";
import scene08 from "@/assets/community-scenes/scene-08.jpg";
import scene09 from "@/assets/community-scenes/scene-09.jpg";
import scene10 from "@/assets/community-scenes/scene-10.jpg";
import scene11 from "@/assets/community-scenes/scene-11.jpg";
import scene12 from "@/assets/community-scenes/scene-12.jpg";
import scene13 from "@/assets/community-scenes/scene-13.jpg";
import scene14 from "@/assets/community-scenes/scene-14.jpg";
import scene15 from "@/assets/community-scenes/scene-15.jpg";
import scene16 from "@/assets/community-scenes/scene-16.jpg";
import { ArrowLeft, Bookmark, ChevronRight, ImagePlus, Lock, MessageCircle, Mic, Pause, Play, Search, Send, Share2, ShieldCheck, Trash2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import origenLogo from "@/assets/logo-origen.png";
import avatar01 from "@/assets/community-avatar-01.png";
import avatar02 from "@/assets/community-avatar-02.png";
import avatar03 from "@/assets/community-avatar-03.png";
import avatar04 from "@/assets/community-avatar-04.png";
import avatar05 from "@/assets/community-avatar-05.png";
import avatar06 from "@/assets/community-avatar-06.png";
import avatar07 from "@/assets/community-avatar-07.png";
import avatar08 from "@/assets/community-avatar-08.png";
import avatar09 from "@/assets/community-avatar-09.png";
import avatar10 from "@/assets/community-avatar-10.png";
import avatar11 from "@/assets/community-avatar-11.png";
import avatar12 from "@/assets/community-avatar-12.png";
import reactionHeart from "@/assets/community-reactions/heart.png";
import reactionPrayer from "@/assets/community-reactions/prayer.png";
import reactionLeaf from "@/assets/community-reactions/leaf.png";
import reactionTouched from "@/assets/community-reactions/touched.png";
import reactionApplause from "@/assets/community-reactions/applause.png";
import reactionLove from "@/assets/community-reactions/love.png";
import { useCommunityNotifications, useMarkCommunityRead } from "@/hooks/use-community-notifications";

export const Route = createFileRoute("/_authenticated/comunidad")({
  head: () => ({ meta: [{ title: "Comunidad ORÍGEN — un lugar para acompañarnos" }, { name: "description", content: "Comparte preguntas y conversa con respeto. Comunidad abierta a todas las membresías." }, { property: "og:title", content: "Comunidad ORÍGEN" }, { property: "og:description", content: "Preguntas y conversaciones para acompañarnos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Comunidad,
});

const TOPICS = [
  { key: "general", label: "Para ti", image: scene01, detail: "Preguntas y compañía para cada día" },
  { key: "familia", label: "Familia", image: scene04, detail: "Historias, raíces y límites" },
  { key: "pareja", label: "Relaciones", image: scene07, detail: "Amor, vínculos y decisiones" },
  { key: "ansiedad", label: "Bienestar", image: scene10, detail: "Calma y cuidado emocional" },
  { key: "fe", label: "Fe", image: scene13, detail: "Reflexiones de fe" },
  { key: "logros", label: "Avances", image: scene16, detail: "Celebremos cada paso" },
];
const EMOJIS = ["💜", "🙏", "🌿", "🥹", "👏", "❤️"];
const REACTION_IMAGES = [reactionHeart, reactionPrayer, reactionLeaf, reactionTouched, reactionApplause, reactionLove];
const TOPIC_SCENES: Record<string, string[]> = {
  general: [scene01, scene02, scene03],
  familia: [scene04, scene05, scene06],
  pareja: [scene07, scene08, scene09],
  ansiedad: [scene10, scene11, scene12],
  fe: [scene13, scene14],
  logros: [scene15, scene16],
};
const AVATARS = [avatar01, avatar02, avatar03, avatar04, avatar05, avatar06, avatar07, avatar08, avatar09, avatar10, avatar11, avatar12];
function botScene(topic: string, id: string) {
  const scenes = TOPIC_SCENES[topic] ?? TOPIC_SCENES.general;
  return scenes[parseInt(id.replaceAll("-", "").slice(0, 8), 16) % scenes.length];
}
function relativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((start - target) / 86400000);
  if (days === 0) return "Hoy";
  if (days === -1) return "Mañana";
  if (days === -2) return "Pasado mañana";
  if (days === 1) return "Ayer";
  if (days === 2) return "Antier";
  if (days < 0) return new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(date);
  if (days < 7) return `Hace ${days} días`;
  if (days < 35) { const weeks = Math.floor(days / 7); return `Hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`; }
  if (days < 365) { const months = Math.floor(days / 30); return `Hace ${months} ${months === 1 ? "mes" : "meses"}`; }
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
type Post = { id: string; author_id: string | null; mine: boolean; author_name: string; topic: string; title: string; body: string; created_at: string; is_anonymous: boolean; image_path: string | null; poll_options: string[] | null; source_url: string | null; is_verified: boolean; is_bot: boolean; bot_kind: string | null; author_kind: string; author_level: number };
type Reply = { id: string; post_id: string; parent_reply_id: string | null; author_id: string | null; mine: boolean; author_name: string; body: string; created_at: string; is_anonymous: boolean; image_path: string | null; audio_path: string | null; is_bot: boolean; author_kind: string; author_level: number };
type Reaction = { id: string; user_id: string; target_type: string; target_id: string; emoji: string };

function displayName(value: string, anonymous: boolean, bot = false) {
  if (bot) return "ORÍGEN";
  if (anonymous) return "Alma anónima";
  const parts = value.trim().split(/\s+/);
  return `${parts[0] || "Persona"}${parts[1] ? ` ${parts[1]}` : ""}`;
}
function postName(post: Post) {
  return post.is_bot ? TOPICS.find(t => t.key === post.topic)?.label ?? post.author_name : displayName(post.author_name, post.is_anonymous);
}
function Avatar({ name, bot, identity, topic }: { name: string; bot?: boolean; identity?: string; topic?: string }) {
  const index = [...(identity ?? name)].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) >>> 0, 7) % AVATARS.length;
  const topicImage = topic && TOPIC_SCENES[topic] ? botScene(topic, identity ?? name) : null;
  return <span className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full ${topicImage ? "bg-muted" : "bg-gradient-to-br from-[#dfb8fa] via-[#f9c9ce] to-[#b6e5d8] p-1 shadow-sm"}`}><img src={topicImage ?? (bot ? origenLogo : AVATARS[index])} alt={topicImage ? `Imagen del tema ${TOPICS.find(t => t.key === topic)?.label}` : bot ? "Logo ORÍGEN" : `Avatar ilustrado de ${name}`} className={`h-full w-full ${topicImage ? "object-cover" : "object-contain"}`} /></span>;
}
const LEVEL_STYLES: Record<number, string> = { 1: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700", 2: "border-sky-500/40 bg-sky-500/10 text-sky-700", 3: "border-amber-500/40 bg-amber-500/10 text-amber-700" };
function LevelBadge({ level }: { level?: number }) {
  if (!level || !LEVEL_STYLES[level]) return null;
  return <span className={`ml-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${LEVEL_STYLES[level]}`}>Nivel {level}</span>;
}
function authorRole(kind: string, bot: boolean) {
  if (kind === "admin") return "Administración";
  if (kind === "ai" || bot) return "Asistente automático";
  return "Comunidad";
}
function SuspensionNotice({ suspension, name }: { suspension: { reason: string; kind: string | null; expires_at: string | null; user_message: string | null }; name: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!suspension.expires_at) return;
    const tick = () => {
      const ms = Date.parse(suspension.expires_at!) - Date.now();
      if (ms <= 0) { setRemaining("Tu suspensión terminó. Actualiza la página."); return; }
      const hours = Math.floor(ms / 3600000), minutes = Math.floor((ms % 3600000) / 60000);
      setRemaining(`${hours} h ${minutes} min restantes`);
    };
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, [suspension.expires_at]);
  return <div className="fixed inset-0 z-[60] grid place-items-center px-5 backdrop-blur-xl" role="alertdialog" aria-modal="true" aria-label="Participación suspendida">
    <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elev">
      <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10"><img src={origenLogo} alt="ORÍGEN" className="h-8 w-8 object-contain" /></span><div><p className="text-sm font-bold">{name}</p><p className="text-xs text-muted-foreground">Administración de ORÍGEN</p></div></div>
      <h2 className="mt-4 font-display text-xl font-extrabold">{suspension.kind === "permanent" ? "Suspensión definitiva" : suspension.kind === "indefinite" ? "Suspensión por tiempo indefinido" : "Suspensión temporal"}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{suspension.user_message || suspension.reason}</p>
      {suspension.expires_at && <p className="mt-4 rounded-xl bg-secondary/60 p-3 text-sm font-bold" role="status">{remaining}</p>}
      <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed">⚠️ Si la conducta se repite, la administración de ORÍGEN puede suspender tu acceso de forma definitiva. Cuidamos la salud mental de cada persona de esta comunidad.</p>
      <Link to="/dashboard" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white">Volver al inicio</Link>
    </section>
  </div>;
}
function PremiumInvite() {
  return <aside className="mt-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-pink-100/70 p-4"><div className="flex items-center gap-2 text-primary"><Lock className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wide">Acompañamiento ORÍGEN</span></div><p className="mt-2 text-sm text-foreground/80">Esta conversación es gratuita. Si quieres profundizar, explora nuestros recursos de membresía.</p><Link to="/membresia" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white">Ver planes de pago <ChevronRight className="h-4 w-4" /></Link></aside>;
}

function Comunidad() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const { data: notifications = [] } = useCommunityNotifications(user?.id);
  const markRead = useMarkCommunityRead(user?.id);
  const notificationKeys = notifications.map(n => n.id).join(",");
  useEffect(() => { if (notificationKeys) void qc.invalidateQueries({ queryKey: ["comunidad"] }); }, [notificationKeys, qc]);
  const [acknowledged, setAcknowledged] = useState<Record<string, true>>({});
  const [justRead, setJustRead] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<"feed" | "topics" | "saved" | "mine" | "following" | "comments">("feed");
  const [topic, setTopic] = useState("todos");
  const [blockTopic, setBlockTopic] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
   const [page, setPage] = useState(0);
  const [openPost, setOpenPost] = useState<string | null>(null);
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);
  const toast = {
    error: (message: string) => setNotice({ message, error: true }),
    success: (message: string) => setNotice({ message, error: false }),
  };
  useEffect(() => {
    document.body.classList.toggle("community-reading", Boolean(openPost));
    return () => document.body.classList.remove("community-reading");
  }, [openPost]);
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [newTopic, setNewTopic] = useState("general");
  const [anonymous, setAnonymous] = useState(false); const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [postImage, setPostImage] = useState<File | null>(null); const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyText, setReplyText] = useState(""); const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sort, setSort] = useState<"top" | "recent">("top"); const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false); const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioMode, setAudioMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [micState, setMicState] = useState<"requesting" | "ready" | "denied" | null>(null);
  const discardAudio = useRef(false);
  const recorder = useRef<MediaRecorder | null>(null); const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { if (!recording || recordingPaused) return; const ticker = window.setInterval(() => setSeconds(s => Math.min(s + 1, 299)), 1000); return () => clearInterval(ticker); }, [recording, recordingPaused]);
  const duration = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  useEffect(() => { if (!audioFile) { setPreviewUrl(null); return; } const url = URL.createObjectURL(audioFile); setPreviewUrl(url); return () => URL.revokeObjectURL(url); }, [audioFile]);
  const author = (profile?.full_name || profile?.display_name || "Persona del camino").trim();

  useEffect(() => { const timer = setTimeout(() => { setPage(0); setSearchTerm(search.trim()); }, 350); return () => clearTimeout(timer); }, [search]);
   const scope = tab === "topics" ? "feed" : tab === "feed" && topic !== "todos" ? "topic" : tab;
   const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["comunidad", user?.id, page, searchTerm, scope, scope === "topic" ? topic : "todos"], enabled: !!user, queryFn: async () => {
     const [posts, reactions, saves, follows, blocks, suspension] = await Promise.all([
       supabase.auth.getSession().then(async ({ data: session }) => {
          const res = await fetch(`/api/community/feed?page=${page}&q=${encodeURIComponent(searchTerm)}&scope=${scope}&topic=${encodeURIComponent(topic)}`, { headers: { Authorization: `Bearer ${session.session?.access_token ?? ""}` } });
         if (!res.ok) throw new Error("No se pudo abrir la comunidad.");
          return res.json() as Promise<{ posts: Post[]; replies: Reply[]; votes: { post_id: string; choice_index: number }[]; totals: { post_id: string; choice_index: number; vote_count: number }[]; hasMore: boolean }>;
       }),
      supabase.from("community_reactions").select("id,user_id,target_type,target_id,emoji").limit(4000),
      supabase.from("community_saves").select("post_id"), supabase.from("community_follows").select("topic"),
       supabase.from("community_blocks").select("topic"),
      supabase.from("community_suspensions").select("reason,kind,expires_at,user_message").eq("user_id", user!.id).maybeSingle(),
    ]);
     if (reactions.error || saves.error || follows.error || blocks.error) throw reactions.error || saves.error || follows.error || blocks.error;
      return { posts: posts.posts, replies: posts.replies, votes: new Map(posts.votes.map(v => [v.post_id, v.choice_index])), totals: posts.totals, hasMore: posts.hasMore, reactions: (reactions.data ?? []) as Reaction[], saves: new Set((saves.data ?? []).map(s => s.post_id)), follows: new Set((follows.data ?? []).map(f => f.topic)), blocks: new Set((blocks.data ?? []).map(b => b.topic)), suspension: suspension.data && (!suspension.data.expires_at || Date.parse(suspension.data.expires_at) > Date.now()) ? suspension.data : null, suspended: suspension.data && (!suspension.data.expires_at || Date.parse(suspension.data.expires_at) > Date.now()) ? suspension.data.reason : null };
  } });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["comunidad"] });
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
   const mediaRef = useRef<Record<string, string>>({});
  useEffect(() => () => { Object.values(mediaRef.current).forEach(URL.revokeObjectURL); mediaRef.current = {}; }, []);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void supabase.auth.getSession().then(async ({ data: session }) => {
      const response = await fetch("/api/community/daily", { method: "POST", headers: { Authorization: `Bearer ${session.session?.access_token ?? ""}` } });
      if (alive && response.ok && (await response.json()).created) refresh();
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [user?.id]);
  useEffect(() => {
    if (!data) return;
    let alive = true;
    const paths = [...new Set([...data.posts.map(p => p.image_path), ...data.replies.flatMap(r => [r.image_path, r.audio_path])].filter((x): x is string => !!x))];
     void (async () => {
       const { data: session } = await supabase.auth.getSession();
       const token = session.session?.access_token ?? "";
        const media = await Promise.all(paths.filter(path => !mediaRef.current[path]).map(async path => { const [id, type, kind] = path.split(":"); if (!id || !["post", "reply"].includes(type) || !["image", "audio"].includes(kind)) return null; const response = await fetch(`/api/community/media?type=${type}&id=${id}&kind=${kind}`, { headers: { Authorization: `Bearer ${token}` } }); return response.ok ? [path, URL.createObjectURL(await response.blob())] as const : null; }));
       if (!alive) { media.forEach(item => { if (item) URL.revokeObjectURL(item[1]); }); return; }
        const next = { ...mediaRef.current, ...Object.fromEntries(media.filter((v): v is readonly [string, string] => !!v)) };
        for (const path of Object.keys(next)) if (!paths.includes(path)) { URL.revokeObjectURL(next[path]); delete next[path]; }
       mediaRef.current = next;
       setMediaUrls(next);
    })();
     return () => { alive = false; };
  }, [data]);

    const active = data?.posts.find(p => p.id === openPost);
    const unreadIn = (bucket: string, id?: string) => notifications.filter(n => n.bucket === bucket && (!id || n.post_id === id) && !acknowledged[n.id]);
    const visible = useMemo(() => {
       const posts = (data?.posts ?? []).filter(p => (tab !== "feed" || topic === "todos" || p.topic === topic) && searchTerm === search.trim() && (tab !== "feed" || topic !== "todos" || !data?.blocks.has(p.topic)));
      if (!["mine", "comments", "following", "feed"].includes(tab) || searchTerm) return posts;
      const newest = new Map<string, number>();
      for (const n of notifications) if (n.bucket === tab && !acknowledged[n.id]) newest.set(n.post_id, Math.max(newest.get(n.post_id) ?? 0, Date.parse(n.created_at)));
      for (const [postId, timestamp] of Object.entries(justRead)) newest.set(postId, Math.max(newest.get(postId) ?? 0, timestamp));
      return [...posts].sort((a, b) => (newest.get(b.id) ?? 0) - (newest.get(a.id) ?? 0) || Date.parse(b.created_at) - Date.parse(a.created_at));
    }, [data, topic, tab, search, searchTerm, notifications, acknowledged, justRead]);
    function openConversation(id: string) {
      setOpenPost(id);
       setOpenThread(null);
      window.history.replaceState(null, "", `/comunidad?post=${id}`);
     const ids = notifications.filter(n => n.post_id === id).map(n => n.id);
      if (ids.length) {
       setJustRead(previous => ({ ...previous, [id]: Math.max(...notifications.filter(n => n.post_id === id).map(n => Date.parse(n.created_at))) }));
        setAcknowledged(previous => ({ ...previous, ...Object.fromEntries(ids.map(item => [item, true as const])) }));
        void markRead(id).catch(() => { setAcknowledged(previous => { const next = { ...previous }; ids.forEach(item => delete next[item]); return next; }); toast.error("No se pudo marcar la actividad como leída."); });
      }
     }
     function showThread(id: string) {
       if (!openPost) return;
       const seen = new Set<string>();
       let root = id;
       while (repliesById.get(root)?.parent_reply_id && !seen.has(root)) {
         seen.add(root);
         root = repliesById.get(root)?.parent_reply_id ?? root;
       }
       setOpenThread(root);
       setReplyTo(null);
       window.history.pushState(null, "", `/comunidad?post=${openPost}&thread=${root}`);
       window.scrollTo({ top: 0, behavior: "smooth" });
     }
     function closeThread() {
       setOpenThread(null);
       setReplyTo(null);
       if (openPost) window.history.pushState(null, "", `/comunidad?post=${openPost}`);
     }
   const matchedTopics = search.trim() ? TOPICS.filter(t => `${t.label} ${t.detail}`.toLocaleLowerCase("es").includes(search.trim().toLocaleLowerCase("es"))) : [];
   const pollStats = (p: Post) => {
     const counts = (p.poll_options ?? []).map((_, index) => Number(data?.totals?.find(v => v.post_id === p.id && v.choice_index === index)?.vote_count ?? 0));
     return { counts, total: counts.reduce((a, b) => a + b, 0) };
   };
  const replies = useMemo(() => (data?.replies ?? []).filter(r => r.post_id === openPost), [data, openPost]);
  const grouped = useMemo(() => { const map = new Map<string, Reply[]>(); for (const r of replies) { const key = r.parent_reply_id ?? "root"; map.set(key, [...(map.get(key) ?? []), r]); } return map; }, [replies]);
   const repliesById = useMemo(() => new Map(replies.map(r => [r.id, r])), [replies]);
   const focusedReply = openThread ? repliesById.get(openThread) : undefined;
   const threadReplies = useMemo(() => {
     if (!focusedReply) return [];
     const collected: Reply[] = [];
     const seen = new Set<string>([focusedReply.id]);
     const collect = (id: string) => {
       for (const child of grouped.get(id) ?? []) {
         if (seen.has(child.id)) continue;
         seen.add(child.id);
         collected.push(child);
         collect(child.id);
       }
     };
     collect(focusedReply.id);
     return collected.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
   }, [focusedReply, grouped]);
   const reactItems = (type: "post" | "reply", id: string) => EMOJIS.map(emoji => { const list = (data?.reactions ?? []).filter(r => r.target_type === type && r.target_id === id && r.emoji === emoji); return { emoji, count: list.length, mine: list.find(r => r.user_id === user?.id)?.id }; });
   const [reactionPicker, setReactionPicker] = useState<string | null>(null);

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
      const { data: row, error } = await supabase.from("community_posts").insert({ user_id: user.id, author_name: anonymous ? "Alma anónima" : author, is_anonymous: anonymous, topic: newTopic, title: title.trim(), body: body.trim(), image_path }).select("id").single();
      if (error) throw error;
       setTitle(""); setBody(""); setPostImage(null); setCreateOpen(false); setPage(0); setTab("feed"); setTopic("todos"); refresh(); openConversation(row.id);
      toast.success("Tu pregunta ya está publicada.");
      const { data: session } = await supabase.auth.getSession();
      void fetch("/api/community/bot", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token ?? ""}` }, body: JSON.stringify({ postId: row.id }) }).then(() => refresh()).catch(() => undefined);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
   async function reply(sendAudio = false) {
    if (!user || busy || data?.suspended) return;
      if (sendAudio && !audioFile) return toast.error("Primero graba un audio.");
     if (!sendAudio && !replyText.trim() && !replyImage) return toast.error("Escribe o adjunta algo para responder.");
    setBusy(true);
    try {
       const image_path = !sendAudio && replyImage ? await upload(replyImage, "image") : null;
        const audio_path = sendAudio && audioFile ? await upload(audioFile, "audio") : null;
       const { data: saved, error } = await supabase.from("community_replies").insert({ post_id: openPost!, parent_reply_id: replyTo, user_id: user.id, author_name: replyAnonymous ? "Alma anónima" : author, is_anonymous: replyAnonymous, body: sendAudio ? "" : replyText.trim(), image_path, audio_path }).select("id").single();
      if (error) throw error;
       if (saved && !replyTo && !sendAudio && replyText.trim().length > 3) { const postForBot = openPost; void supabase.auth.getSession().then(({ data: ses }) => fetch("/api/community/bot", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${ses.session?.access_token ?? ""}` }, body: JSON.stringify({ postId: postForBot, replyId: saved.id }) })).then(() => refresh()).catch(() => undefined); }
       setReplyText(""); setReplyTo(null); setReplyImage(null); setAudioFile(null); setAudioMode(false); setSeconds(0); refresh(); toast.success(sendAudio ? "Tu audio ya está en la conversación." : "Tu respuesta ya está en la conversación.");
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  async function toggleReaction(type: "post" | "reply", id: string, emoji: string, mine?: string) {
    if (data?.suspended) return toast.error("Tu participación está suspendida.");
     const old = data?.reactions.find(r => r.target_type === type && r.target_id === id && r.user_id === user?.id);
     if (old && old.emoji !== emoji) { const removed = await supabase.from("community_reactions").delete().eq("id", old.id); if (removed.error) return toast.error(removed.error.message); }
      const { error } = old?.emoji === emoji ? await supabase.from("community_reactions").delete().eq("id", old.id) : await supabase.from("community_reactions").insert({ user_id: user!.id, target_type: type, target_id: id, emoji });
    if (error) toast.error(error.message); else refresh();
  }
   async function toggleSave(id: string) { const { error } = data?.saves.has(id) ? await supabase.from("community_saves").delete().eq("post_id", id) : await supabase.from("community_saves").insert({ user_id: user!.id, post_id: id }); if (error) toast.error(error.message); else refresh(); }
   async function toggleFollow(key: string) {
     const following = data?.follows.has(key);
     const { error } = following ? await supabase.from("community_follows").delete().eq("topic", key) : await supabase.from("community_follows").upsert({ user_id: user!.id, topic: key });
     if (error) return toast.error(error.message);
     if (!following && data?.blocks.has(key)) { const removed = await supabase.from("community_blocks").delete().eq("topic", key); if (removed.error) return toast.error(removed.error.message); }
     refresh();
   }
   async function confirmBlock() {
     if (!blockTopic || !user) return;
     const { error } = await supabase.from("community_blocks").upsert({ user_id: user.id, topic: blockTopic });
     if (error) return toast.error(error.message);
     await supabase.from("community_follows").delete().eq("topic", blockTopic);
     setBlockTopic(null); setTopic("todos"); setTab("feed"); refresh(); toast.success("Tema oculto de Descubrir. Sigue visible en Temas.");
   }
  async function share(id: string) { const url = `${window.location.origin}/comunidad?post=${id}`; try { if (navigator.share) await navigator.share({ title: "Comunidad ORÍGEN", url }); else { await navigator.clipboard.writeText(url); toast.success("Enlace copiado"); } } catch { /* cancelled */ } }
   async function remove(id: string) { if (!confirm("¿Borrar tu pregunta y sus respuestas?")) return; const { error } = await supabase.from("community_posts").delete().eq("id", id); if (error) toast.error(error.message); else { setOpenPost(null); refresh(); } }
   async function report(type: "post" | "reply", id: string) {
     const reason = window.prompt("¿Por qué debemos revisar este contenido?");
     if (!reason) return;
     if (reason.trim().length < 5) return toast.error("Describe el motivo con al menos cinco caracteres.");
     const { error } = await supabase.from("community_reports").insert({ reporter_id: user!.id, target_type: type, target_id: id, reason: reason.trim().slice(0, 500) });
     if (error) toast.error(error.message); else toast.success("Enviado al equipo de moderación.");
   }
    const [voteResults, setVoteResults] = useState<Record<string, { correct: boolean | null; answer: number | null }>>({});
    const [voting, setVoting] = useState<string | null>(null);
   async function vote(id: string, choice: number) {
      if (voting || data?.votes.has(id)) return;
      setVoting(id);
      try {
     const { data: session } = await supabase.auth.getSession();
     const res = await fetch("/api/community/vote", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token ?? ""}` }, body: JSON.stringify({ postId: id, choice }) });
      const result = await res.json();
      if (!res.ok) return toast.error(result.error ?? "No se pudo registrar tu respuesta.");
      setVoteResults(v => ({ ...v, [id]: result }));
      qc.setQueriesData<{ votes: Map<string, number>; totals: { post_id: string; choice_index: number; vote_count: number }[] }>( { queryKey: ["comunidad"] }, old => old ? { ...old, votes: new Map(old.votes).set(id, choice), totals: [...old.totals.filter(v => v.post_id !== id), ...(result.totals ?? [])] } : old);
      refresh();
     toast.success(result.correct === null ? "Gracias por participar." : result.correct ? "¡Respuesta correcta!" : "Sigue intentando en la próxima pregunta.");
      } catch { toast.error("No se pudo registrar tu respuesta. Inténtalo de nuevo."); } finally { setVoting(null); }
   }
   async function startRecording() {
     if (recording) return;
    try {
       if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("La grabación necesita un navegador compatible y conexión segura.");
       setMicState("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       setMicState("ready");
      const format = ["audio/webm", "audio/mp4", "audio/ogg"].find(v => MediaRecorder.isTypeSupported(v));
      if (!format) { stream.getTracks().forEach(t => t.stop()); throw new Error("Tu navegador no permite grabar audio aquí."); }
      const chunks: Blob[] = []; const rec = new MediaRecorder(stream, { mimeType: format }); recorder.current = rec;
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        rec.onstop = () => { if (recordingTimer.current) clearTimeout(recordingTimer.current); stream.getTracks().forEach(t => t.stop()); setRecording(false); setRecordingPaused(false); const blob = new Blob(chunks, { type: format }); if (blob.size > 1000 && !discardAudio.current) setAudioFile(new File([blob], `respuesta.${format.split("/")[1]}`, { type: format })); else if (!discardAudio.current) toast.error("No se grabó el audio completo. Inténtalo de nuevo."); discardAudio.current = false; };
       rec.onerror = () => { stream.getTracks().forEach(t => t.stop()); setRecording(false); toast.error("No se pudo continuar la grabación."); };
        discardAudio.current = false; setAudioFile(null); setReplyImage(null); setAudioMode(true); setSeconds(0);
         // Capture one continuous recording. Time-sliced chunks can contain incomplete
         // Opus pages on some browsers, leaving only the final fragment audible.
         rec.start(); setRecording(true); recordingTimer.current = setTimeout(() => { if (rec.state === "paused") rec.resume(); if (rec.state !== "inactive") rec.stop(); }, 4 * 60 * 1000 + 59 * 1000);
     } catch (e) { setMicState("denied"); toast.error((e as Error).name === "NotAllowedError" ? "Permite el acceso al micrófono para grabar un audio." : (e as Error).message); }
  }
     function discardRecording() { discardAudio.current = true; if (recorder.current?.state !== "inactive") recorder.current?.stop(); setRecording(false); setAudioFile(null); setAudioMode(false); setSeconds(0); }
   function togglePause() { const rec = recorder.current; if (!rec) return; if (rec.state === "recording") { rec.pause(); setRecordingPaused(true); } else if (rec.state === "paused") { rec.resume(); setRecordingPaused(false); } }
   useEffect(() => {
     const syncLocation = () => {
       const params = new URLSearchParams(window.location.search);
       const post = params.get("post");
       if (post && data?.posts.some(p => p.id === post)) {
         setOpenPost(post);
         setOpenThread(params.get("thread"));
       } else if (!post) { setOpenPost(null); setOpenThread(null); }
     };
     syncLocation();
     window.addEventListener("popstate", syncLocation);
     return () => window.removeEventListener("popstate", syncLocation);
   }, [data?.posts]);
     useEffect(() => () => { discardAudio.current = true; if (recordingTimer.current) clearTimeout(recordingTimer.current); if (recorder.current?.state !== "inactive") recorder.current?.stop(); }, []);
    useEffect(() => { if (!openPost && recorder.current?.state && recorder.current.state !== "inactive") { discardAudio.current = true; recorder.current.stop(); setRecording(false); setAudioFile(null); setAudioMode(false); } }, [openPost]);

   function renderReactions(type: "post" | "reply", id: string, compact = false) {
      const items = reactItems(type, id);
      const pickerId = `${type}:${id}`;
       const selected = items.find(it => it.mine) ?? [...items].sort((a, b) => b.count - a.count)[0];
       const shown = compact ? (selected?.count ? [selected] : []) : items.filter(it => it.count > 0);
       return <div className="relative flex min-h-11 flex-wrap items-center gap-1" aria-label="Reacciones"><Button type="button" variant="ghost" aria-label="Elegir reacción" aria-expanded={reactionPicker === pickerId} onClick={() => setReactionPicker(current => current === pickerId ? null : pickerId)} className="min-h-11 rounded-full border border-primary/15 px-2 text-xs text-primary">{items.find(it => it.mine) ? <img src={REACTION_IMAGES[items.findIndex(it => it.mine)]} alt="" className="h-6 w-6 object-contain" /> : <img src={reactionHeart} alt="" className="h-6 w-6 object-contain" />}{items.find(it => it.mine) ? "Cambiar" : "Reaccionar"}</Button>{shown.map(it => <span key={it.emoji} aria-label={`${it.emoji}, ${it.count} reacciones`} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-background px-1.5 text-xs"><img src={REACTION_IMAGES[EMOJIS.indexOf(it.emoji)]} alt="" className="h-6 w-6 object-contain" />{it.count}</span>)}{reactionPicker === pickerId && <div role="group" aria-label="Elige una reacción" className="absolute bottom-full left-0 z-30 mb-2 flex max-w-[min(90vw,360px)] gap-1 overflow-x-auto rounded-full border border-border bg-card p-1.5 shadow-elev">{items.map((it, i) => <Button key={it.emoji} type="button" variant="ghost" aria-label={`Reaccionar con ${it.emoji}`} aria-pressed={!!it.mine} onClick={() => { setReactionPicker(null); void toggleReaction(type, id, it.emoji, it.mine); }} className={`h-11 w-11 shrink-0 rounded-full p-1 transition-transform hover:scale-110 ${it.mine ? "bg-primary/10" : ""}`}><img src={REACTION_IMAGES[i]} alt="" className="h-9 w-9 object-contain" /></Button>)}</div>}</div>;
   }
    function PollChoices({ post }: { post: Post }) {
     if (!post.poll_options || post.bot_kind === "cover" || post.image_path) return null;
    const { counts, total } = pollStats(post);
     const voted = data?.votes.has(post.id);
      return <div className="mt-4 space-y-2.5">{post.poll_options.map((option, i) => { const percent = total ? Math.round(counts[i] / total * 100) : 0; const selected = data?.votes.get(post.id) === i; return <Button key={i} type="button" variant="outline" disabled={voted || !!voting} onClick={() => void vote(post.id, i)} className={`relative flex min-h-14 h-auto w-full justify-start overflow-hidden rounded-xl border-0 bg-muted p-0 text-left text-sm font-normal whitespace-normal shadow-none ${selected ? "ring-2 ring-primary text-primary font-semibold" : ""}`}><span className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-300" style={{ width: voted ? `${percent}%` : "0%" }} /><span className="relative flex w-full items-center justify-between gap-3 px-4 py-3"><span className="min-w-0 break-words">{option}{selected && <span className="ml-2 text-xs">· Tu elección</span>}</span>{voted && <strong className="shrink-0">{percent} %</strong>}</span></Button>; })}<p role="status" className="text-xs text-muted-foreground">{voted ? `${total} ${total === 1 ? "voto" : "votos"} · ${voteResults[post.id]?.correct === false ? `La opción correcta era ${post.poll_options[voteResults[post.id].answer ?? 0]}.` : voteResults[post.id]?.correct ? "¡Correcto!" : "Tu elección quedó registrada."}` : "Elige una opción. Solo puedes votar una vez."}</p></div>;
  }
    function descendants(id: string) {
      const found: Reply[] = [];
      const seen = new Set<string>([id]);
      const visit = (parent: string) => {
        for (const child of grouped.get(parent) ?? []) {
          if (seen.has(child.id)) continue;
          seen.add(child.id); found.push(child); visit(child.id);
        }
      };
      visit(id);
      return found.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    }
    function replyCard(r: Reply, focused = false) {
      const referenced = focused && r.parent_reply_id ? repliesById.get(r.parent_reply_id) : undefined;
       return <article key={r.id} className={`min-w-0 rounded-xl p-3.5 ${r.is_bot ? "bg-primary/5" : "bg-secondary/30"}`}>
        <div className="flex items-center gap-2"><Avatar name={r.author_name} bot={r.is_bot} identity={r.author_id ?? r.id} /><div className="min-w-0"><p className="text-sm font-bold">{displayName(r.author_name, r.is_anonymous, r.is_bot)} {r.is_bot && <ShieldCheck className="inline h-4 w-4 text-primary" aria-label="Respuesta verificada de ORÍGEN" />}<LevelBadge level={r.author_level} /></p><p className="text-xs text-muted-foreground">{relativeDate(r.created_at)} · {authorRole(r.author_kind, r.is_bot)}</p></div></div>
        {referenced && <div className="mt-3 rounded-lg border-l-2 border-border bg-muted/80 px-3 py-2 text-xs text-muted-foreground"><span className="font-semibold">En respuesta a {displayName(referenced.author_name, referenced.is_anonymous, referenced.is_bot)}</span><p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words">{referenced.body || (referenced.audio_path ? "Mensaje de audio" : referenced.image_path ? "Imagen adjunta" : "Comentario")}</p></div>}
        {r.body && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{r.body}</p>}{r.image_path && mediaUrls[r.image_path] && <img src={mediaUrls[r.image_path]} alt="Adjunto a la respuesta" className="mt-3 max-h-72 w-full rounded-xl object-contain" />}{r.audio_path && mediaUrls[r.audio_path] && <audio controls preload="metadata" src={mediaUrls[r.audio_path]} className="mt-3 w-full" aria-label="Respuesta de audio" />}
        <div className="mt-2 flex flex-wrap items-center gap-2">{renderReactions("reply", r.id, focused)}<Button variant="ghost" onClick={() => void report("reply", r.id)} className="min-h-11 px-2 text-xs text-muted-foreground">Denunciar</Button><Button variant="ghost" onClick={() => { if (!focused && !openThread) showThread(r.id); setReplyTo(r.id); requestAnimationFrame(() => document.getElementById("community-reply")?.focus()); }} className="min-h-11 px-2 text-xs font-bold text-primary">Responder a {displayName(r.author_name, r.is_anonymous, r.is_bot)}</Button></div>
      </article>;
    }
    function renderThread() {
      const items = [...(grouped.get("root") ?? [])];
      if (sort === "top") items.sort((a, b) => (data?.reactions.filter(r => r.target_id === b.id).length ?? 0) - (data?.reactions.filter(r => r.target_id === a.id).length ?? 0));
      if (sort === "recent") items.reverse();
      return <div className="space-y-5">{items.map(r => { const children = descendants(r.id); return <section key={r.id} className="space-y-2">{replyCard(r)}{children.length > 3 && <Button type="button" variant="ghost" onClick={() => showThread(r.id)} className="ml-3 min-h-11 px-2 text-sm font-bold text-primary sm:ml-8">Ver todos {children.length} respuestas</Button>}{children.slice(0, 3).map(child => <div key={child.id} className="ml-3 sm:ml-8">{replyCard(child)}</div>)}</section>; })}</div>;
    }

  return <div className="mx-auto max-w-3xl px-4 pb-32 pt-6">
      {data?.suspension && <SuspensionNotice suspension={data.suspension} name={displayName(author, false)} />}
      {notice && <div role={notice.error ? "alert" : "status"} className={`mb-4 flex items-start justify-between gap-3 rounded-xl border p-3 text-sm ${notice.error ? "border-destructive/30 bg-destructive/10 text-foreground" : "border-primary/20 bg-primary/10 text-foreground"}`}><span>{notice.message}</span><Button type="button" variant="ghost" size="icon" onClick={() => setNotice(null)} aria-label="Cerrar aviso" className="h-11 w-11 shrink-0"><X className="h-4 w-4" /></Button></div>}
      {createOpen && <div className="fixed inset-0 z-40 bg-foreground/50" onClick={() => setCreateOpen(false)} aria-hidden="true" />}
      {blockTopic && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-5" onClick={() => setBlockTopic(null)}><section role="alertdialog" aria-modal="true" aria-label="Bloquear tema" onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-elev"><h2 className="text-lg font-bold">Bloquear {TOPICS.find(t => t.key === blockTopic)?.label}</h2><p className="mt-3 text-sm text-muted-foreground">Dejarás de ver sus publicaciones en Descubrir. El tema seguirá en Temas y podrás volver a seguirlo cuando quieras.</p><div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setBlockTopic(null)}>Cancelar</Button><Button variant="destructive" onClick={() => void confirmBlock()}>Bloquear</Button></div></section></div>}
       {createOpen && <section role="dialog" aria-modal="true" aria-label="Nueva publicación" className="fixed inset-x-3 top-1/2 z-50 mx-auto max-h-[85vh] max-w-xl -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-elev sm:inset-x-0"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Nueva publicación</h2><Button variant="ghost" aria-label="Cerrar nueva publicación" onClick={() => setCreateOpen(false)} className="h-11 w-11 rounded-full"><X /></Button></div><p className="mt-2 text-xs text-muted-foreground">ORÍGEN y la comunidad podrán acompañarte.</p><select aria-label="Tema" value={newTopic} onChange={e => setNewTopic(e.target.value)} className="mt-3 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm">{TOPICS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select><input value={title} maxLength={200} onChange={e => setTitle(e.target.value)} placeholder="¿Qué te gustaría preguntar?" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" /><textarea value={body} maxLength={10000} onChange={e => setBody(e.target.value)} placeholder="Cuéntanos un poco más (opcional)" rows={4} className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm" /><p className="text-right text-xs text-muted-foreground">{body.length} / 10.000</p><div className="mt-2 flex flex-wrap items-center gap-3 text-xs"><label className="flex items-center gap-1"><input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} /> Publicar anónimamente</label><label className="flex min-h-11 cursor-pointer items-center gap-1 text-primary"><ImagePlus className="h-4 w-4" /> {postImage?.name ?? "Adjuntar JPG/PNG"}<input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={e => setPostImage(e.target.files?.[0] ?? null)} /></label></div><Button disabled={busy} onClick={() => void publish()} className="mt-3 min-h-12 rounded-xl px-5">{busy ? "Publicando…" : "Publicar pregunta"}</Button></section>}
      {!active && !data?.suspended && <Button type="button" onClick={() => setCreateOpen(true)} className="fixed bottom-40 left-1/2 z-20 min-h-12 -translate-x-1/2 rounded-full px-4 text-xs font-bold shadow-elev sm:bottom-28 sm:text-sm"><Plus className="h-4 w-4" /> Nueva publicación</Button>}
     {active ? <>
       <div className="flex min-h-11 items-center gap-3"><Button type="button" variant="ghost" size="icon" onClick={() => { if (openThread) closeThread(); else { setOpenPost(null); setReplyTo(null); window.history.replaceState(null, "", "/comunidad"); } }} aria-label={openThread ? "Volver a las respuestas" : "Volver a la comunidad"} className="h-11 w-11 shrink-0 text-primary"><ArrowLeft className="h-5 w-5" /></Button><h2 className="font-display text-xl font-bold">{openThread ? "Conversación" : "Publicación"}</h2></div>
        <article className="mt-3 rounded-3xl border border-border bg-card p-5 shadow-soft"><div className="flex items-center gap-3"><Avatar name={active.author_name} bot={active.is_bot} topic={active.is_bot ? active.topic : undefined} identity={active.author_id ?? active.id} /><div className="flex-1"><p className="text-sm font-bold">{postName(active)} {active.is_verified && <ShieldCheck className="inline h-4 w-4 text-primary" />}<LevelBadge level={active.author_level} /></p><p className="text-xs text-muted-foreground">{TOPICS.find(t => t.key === active.topic)?.label} · {relativeDate(active.created_at)}</p></div>{(active.is_bot || active.image_path) && <Button type="button" variant="outline" onClick={() => void toggleFollow(active.topic)} className="min-h-11 shrink-0 rounded-full px-3 text-xs">{data?.follows.has(active.topic) ? "Siguiendo" : "Seguir"}</Button>}{active.mine && <button onClick={() => void remove(active.id)} aria-label="Borrar mi pregunta" className="grid h-11 w-11 place-items-center text-muted-foreground"><Trash2 className="h-4 w-4" /></button>}</div>{(active.bot_kind === "cover" || active.image_path) ? <><div className="relative mt-4 grid min-h-56 place-items-center overflow-hidden rounded-xl bg-community-cover px-5 py-8 text-center sm:min-h-64 sm:px-8"><img src={active.image_path ? mediaUrls[active.image_path] : botScene(active.topic, active.id)} alt="" className="absolute inset-0 h-full w-full object-cover" /><span className="absolute inset-0 bg-community-cover-overlay" /><h1 className="relative z-10 max-w-xl break-words font-display text-2xl font-extrabold leading-snug text-community-cover-foreground sm:text-3xl">{active.title}</h1></div>{active.body && <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-foreground/80">{active.body}</p>}</> : <><h1 className="mt-5 font-display text-2xl font-extrabold leading-snug">{active.title}</h1>{active.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{active.body}</p>}</>}<PollChoices post={active} /><div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">{renderReactions("post", active.id)}<button onClick={() => void report("post", active.id)} className="min-h-11 text-xs text-muted-foreground">Denunciar</button><button onClick={() => void share(active.id)} className="inline-flex min-h-11 items-center gap-2 text-sm"><Share2 className="h-4 w-4" /> Compartir</button><button onClick={() => void toggleSave(active.id)} className="inline-flex min-h-11 items-center gap-2 text-sm"><Bookmark className={`h-4 w-4 ${data?.saves.has(active.id) ? "fill-primary text-primary" : ""}`} /> Guardar</button></div></article>
        {openThread ? <section className="mt-6"><h3 className="font-display text-xl font-bold">Respuestas · {threadReplies.length}</h3>{focusedReply ? <div className="mt-4 space-y-3">{replyCard(focusedReply, true)}{threadReplies.map(r => <div key={r.id} className="ml-3 sm:ml-8">{replyCard(r, true)}</div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Esta conversación ya no está disponible.</p>}</section> : <><div className="mt-6 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Respuestas · {replies.length}</h2><div className="flex gap-2 text-xs"><Button variant="ghost" onClick={() => setSort("top")} className={sort === "top" ? "font-bold text-primary" : "text-muted-foreground"}>Principales</Button><Button variant="ghost" onClick={() => setSort("recent")} className={sort === "recent" ? "font-bold text-primary" : "text-muted-foreground"}>Últimas</Button></div></div><div className="mt-4">{renderThread()}</div><PremiumInvite /></>}
       {data?.suspended ? <p className="mt-5 rounded-xl bg-destructive/10 p-4 text-sm">Tu acceso a la comunidad está suspendido: {data.suspended}</p> : <div className="sticky bottom-24 z-20 mt-5 rounded-2xl border border-border bg-card p-3 shadow-xl sm:bottom-2">
          {replyTo && <div className="mb-3 flex items-start justify-between gap-2 rounded-lg border-l-2 border-border bg-muted/80 px-3 py-2 text-xs text-muted-foreground"><div className="min-w-0"><p className="font-semibold">Respondiendo a {repliesById.get(replyTo) ? displayName(repliesById.get(replyTo)?.author_name ?? "", repliesById.get(replyTo)?.is_anonymous ?? false, repliesById.get(replyTo)?.is_bot) : "un comentario"}</p><p className="mt-1 line-clamp-2 break-words">{repliesById.get(replyTo)?.body || (repliesById.get(replyTo)?.audio_path ? "Mensaje de audio" : "Imagen adjunta")}</p></div><Button variant="ghost" onClick={() => setReplyTo(null)} className="h-11 w-11 shrink-0 p-0" aria-label="Dejar de responder a este comentario"><X className="h-4 w-4" /></Button></div>}
          {audioMode ? <div className="rounded-2xl border border-primary/20 bg-secondary/50 p-4" aria-label="Grabadora de audio">
            <div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full bg-destructive ${recording && !recordingPaused ? "animate-pulse" : ""}`} /><span className="font-mono text-base tabular-nums">{duration}</span><div className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <span key={i} className={`w-1 rounded-full bg-primary/60 ${recording && !recordingPaused ? "animate-pulse" : ""}`} style={{ height: `${8 + ((i * 17) % 24)}px`, animationDelay: `${i * 35}ms` }} />)}</div><Mic className="h-5 w-5 text-primary" /></div>
            {previewUrl && <audio controls preload="metadata" src={previewUrl} className="mt-4 w-full" aria-label="Escuchar audio antes de enviarlo" />}
             <div className="mt-4 flex items-center justify-between gap-2"><Button type="button" variant="ghost" onClick={discardRecording} aria-label="Borrar audio" className="h-12 w-12 rounded-full"><Trash2 /></Button><Button type="button" variant="secondary" onClick={togglePause} disabled={!recording} aria-label={recordingPaused ? "Continuar grabación" : "Pausar grabación"} className="h-12 w-12 rounded-full">{recordingPaused ? <Play /> : <Pause />}</Button><Button type="button" disabled={busy || (!recording && !audioFile)} onClick={() => { if (recording) { if (recorder.current?.state === "paused") recorder.current.resume(); recorder.current?.stop(); } else void reply(true); }} className="min-h-12 rounded-full px-4 text-xs font-bold">{recording ? "Terminar grabación" : busy ? "Enviando…" : "Enviar Audio"}</Button></div>
            <p className="mt-3 text-center text-xs text-muted-foreground">{micState === "requesting" ? "Solicitando acceso al micrófono…" : recording ? "Grabación manos libres · máximo 4:59" : "Escucha tu grabación antes de enviarla"}</p>
          </div> : <><textarea id="community-reply" value={replyText} onChange={e => setReplyText(e.target.value.slice(0, 10000))} maxLength={10000} rows={2} placeholder="Comparte lo que te ayudó. Con respeto y sin juicios…" className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" /><div className="mt-2 flex flex-wrap items-center gap-2"><label className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl border border-border" title="Añadir JPG o PNG"><ImagePlus className="h-5 w-5" /><input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={e => { setReplyImage(e.target.files?.[0] ?? null); setAudioFile(null); }} /></label><button onClick={() => void startRecording()} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border px-2 text-xs font-bold" aria-label="Enviar Audio, grabar hasta cinco minutos"><Mic className="h-4 w-4" /> Enviar Audio</button><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={replyAnonymous} onChange={e => setReplyAnonymous(e.target.checked)} /> Anónimo</label><button disabled={busy} onClick={() => void reply()} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" /> Responder</button></div>{replyImage && <p className="mt-2 text-xs text-primary">{replyImage.name} <button onClick={() => setReplyImage(null)} className="underline">Quitar imagen</button></p>}</>}
       </div>}
    </> : <>
       <section className="relative grid min-h-60 place-items-center overflow-hidden rounded-2xl bg-community-cover px-6 py-8 text-center sm:min-h-72 sm:px-12"><img src={scene07} alt="" className="absolute inset-0 h-full w-full object-cover" /><span className="absolute inset-0 bg-community-cover-overlay" /><div className="relative z-10 max-w-xl text-community-cover-foreground"><span className="text-xs font-semibold uppercase">Un espacio para acompañarnos</span><h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-community-cover-foreground sm:text-4xl">No tienes que vivirlo en soledad.</h1><p className="mt-3 text-sm leading-relaxed text-community-cover-foreground sm:text-base">Pregunta, comparte y encuentra a otras personas que están atravesando caminos parecidos. La comunidad es libre para todos.</p></div></section>
       <div className="mt-5 flex gap-2 overflow-x-auto border-b border-border pb-2">{([ ["feed", "Descubrir"], ["topics", "Temas"], ["mine", "Mis publicaciones"], ["following", "Siguiendo"], ["comments", "Mis comentarios"], ["saved", "Guardados"] ] as const).map(([key, label]) => <Button key={key} type="button" variant={tab === key ? "secondary" : "ghost"} onClick={() => { setTab(key); setTopic("todos"); setPage(0); setJustRead({}); }} className={`min-h-11 shrink-0 rounded-full px-4 text-xs sm:text-sm ${tab === key ? "text-primary" : "text-muted-foreground"}`}>{label}{["feed", "mine", "comments", "following"].includes(key) && unreadIn(key).length > 0 && <span aria-label="Actividad nueva" className="ml-1 inline-block h-2 w-2 rounded-full bg-destructive" />}</Button>)}</div>
       <div className="relative mt-5"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input type="search" aria-label="Buscar preguntas, respuestas y temas" value={search} onChange={e => { setSearch(e.target.value); if (e.target.value.trim()) setTab("feed"); }} placeholder="Busca temas, preguntas o respuestas…" className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm" /></div>
       {tab === "topics" ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{TOPICS.map(t => <article key={t.key} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><img src={t.image} alt="" className="h-full w-full rounded-xl object-cover" /></span><div className="min-w-0 flex-1"><h2 className="font-bold">{t.label} <ShieldCheck className="inline h-4 w-4 text-primary" /></h2><p className="text-xs text-muted-foreground">{t.detail}</p><Button variant="link" onClick={() => { setTopic(t.key); setTab("feed"); setPage(0); }} className="mt-1 min-h-11 px-0 text-xs">Ver conversaciones →</Button></div><div className="flex flex-col gap-1"><Button type="button" variant="outline" onClick={() => void toggleFollow(t.key)} className="min-h-11 rounded-full px-3 text-xs text-primary">{data?.follows.has(t.key) ? "Siguiendo" : "Seguir"}</Button>{!data?.blocks.has(t.key) && <Button type="button" variant="ghost" onClick={() => setBlockTopic(t.key)} className="min-h-11 px-2 text-xs text-muted-foreground">Bloquear</Button>}</div></article>)}</div> : <>
           {tab === "feed" && topic !== "todos" && <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary/40 p-3"><img src={TOPICS.find(t => t.key === topic)?.image} alt="" className="h-11 w-11 rounded-lg object-cover" /><strong className="min-w-0 flex-1 text-sm">{TOPICS.find(t => t.key === topic)?.label}</strong><Button type="button" variant="outline" className="min-h-11 rounded-full px-3 text-xs" onClick={() => void toggleFollow(topic)}>{data?.follows.has(topic) ? "Siguiendo" : "Seguir"}</Button>{!data?.blocks.has(topic) && <Button type="button" variant="ghost" className="min-h-11 px-2 text-xs" onClick={() => setBlockTopic(topic)}>Bloquear</Button>}</div>}
          {matchedTopics.length > 0 && <div className="mt-3"><p className="text-xs font-bold text-primary">Temas relacionados</p><div className="mt-2 flex flex-wrap gap-2">{matchedTopics.map(t => <button key={t.key} onClick={() => { setTopic(t.key); setSearch(""); }} className="flex min-h-10 items-center gap-2 rounded-full border border-border bg-card pr-3 text-xs font-bold"><img src={t.image} alt="" className="h-10 w-10 rounded-full object-cover" />{t.label}</button>)}</div></div>}{search.trim() && <p className="mt-3 text-xs text-muted-foreground">{visible.length} conversaciones relacionadas · incluye preguntas y respuestas</p>}{tab === "feed" && <div className="mt-3 flex gap-2 overflow-x-auto pb-2">{[{ key: "todos", label: "Todos" }, ...TOPICS].map(t => <button key={t.key} onClick={() => { setTopic(t.key); setPage(0); }} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-bold ${topic === t.key ? "border-primary bg-primary text-white" : "border-border bg-card"}`}>{t.label}</button>)}</div>}
         {isLoading && <div className="mt-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />)}</div>}{isError && <Button variant="link" className="mt-6" onClick={() => void refetch()}>No se pudo cargar. Intentar otra vez</Button>}{!isLoading && !isError && visible.length === 0 && <div className="mx-auto mt-16 flex min-h-64 max-w-sm flex-col items-center justify-center text-center"><span className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">{tab === "comments" ? <MessageCircle className="h-10 w-10" /> : tab === "saved" ? <Bookmark className="h-10 w-10" /> : <img src={avatar01} alt="" className="h-16 w-16 object-contain" />}</span><h2 className="mt-5 text-lg font-semibold">{tab === "mine" ? "Tus publicaciones aparecerán aquí" : tab === "comments" ? "Tus conversaciones aparecerán aquí" : tab === "following" ? "Tu selección de temas aparecerá aquí" : tab === "saved" ? "Guarda lo que quieras volver a leer" : "Inicia una conversación"}</h2><p className="mt-2 text-sm text-muted-foreground">{tab === "mine" ? "Cuando publiques una pregunta, podrás encontrarla en este lugar." : tab === "comments" ? "Las publicaciones en las que respondas quedarán reunidas aquí." : tab === "following" ? "Sigue un tema para ver aquí sus preguntas, respuestas y encuestas." : tab === "saved" ? "Toca el marcador de una publicación para conservarla." : "Todavía no hay publicaciones de este tema."}</p>{tab === "following" ? <Button type="button" variant="link" className="mt-4 min-h-11" onClick={() => setTab("topics")}>Ver todos los temas</Button> : tab === "mine" ? <Button type="button" className="mt-4 min-h-11" onClick={() => setCreateOpen(true)}>Nueva publicación</Button> : null}</div>}
            <div className="mt-4 space-y-4">{visible.map(p => <article key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft"><div className="flex items-center gap-3"><Avatar name={p.author_name} bot={p.is_bot} topic={p.is_bot ? p.topic : undefined} identity={p.author_id ?? p.id} /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{postName(p)} {p.is_verified && <ShieldCheck className="inline h-4 w-4 text-primary" />}<LevelBadge level={p.author_level} /></p><p className="text-xs text-muted-foreground">{relativeDate(p.created_at)}</p></div>{(p.is_bot || p.image_path) && <Button type="button" variant="ghost" onClick={() => void toggleFollow(p.topic)} className="min-h-11 shrink-0 px-2 text-xs text-primary">{data?.follows.has(p.topic) ? "Siguiendo" : "Seguir"}</Button>}<Button variant="ghost" onClick={() => void toggleSave(p.id)} aria-label={data?.saves.has(p.id) ? "Quitar guardado" : "Guardar publicación"} className="h-11 w-11 rounded-full p-0"><Bookmark className={`h-5 w-5 ${data?.saves.has(p.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} /></Button></div><span className="mt-3 inline-flex rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">{TOPICS.find(t => t.key === p.topic)?.label}</span>{unreadIn(tab, p.id).length > 0 && <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-destructive" aria-label="Actividad nueva en esta publicación" />}<button onClick={() => openConversation(p.id)} className="mt-3 block w-full text-left">{(p.bot_kind === "cover" || p.image_path) ? <div className="relative grid min-h-52 place-items-center overflow-hidden rounded-xl bg-community-cover px-5 py-8 text-center sm:min-h-60 sm:px-8"><img src={p.image_path ? mediaUrls[p.image_path] : botScene(p.topic, p.id)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /><span className="absolute inset-0 bg-community-cover-overlay" /><span className="relative z-10 block max-w-xl break-words font-display text-2xl font-bold leading-snug text-community-cover-foreground sm:text-3xl">{p.title}</span></div> : <><h2 className="font-display text-lg font-bold leading-snug">{p.title}</h2>{p.body && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.body}</p>}</>}</button>{p.poll_options && p.bot_kind !== "cover" && !p.image_path && <PollChoices post={p} />}{tab === "comments" && <div className="mt-3 rounded-xl bg-muted p-3 text-sm"><p className="text-xs font-semibold text-muted-foreground">Tu respuesta</p><p className="mt-1 line-clamp-3">{data?.replies.filter(r => r.post_id === p.id && r.mine).at(-1)?.body || (data?.replies.some(r => r.post_id === p.id && r.mine && r.audio_path) ? "Respuesta de audio" : "Respuesta con imagen")}</p></div>}<div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">{renderReactions("post", p.id)}<Button variant="ghost" onClick={() => openConversation(p.id)} className="min-h-11 gap-1.5 px-1 text-sm"><MessageCircle className="h-4 w-4" /> {data?.replies.filter(r => r.post_id === p.id).length ?? 0}</Button><Button variant="ghost" onClick={() => void share(p.id)} className="ml-auto min-h-11 gap-1.5 px-1 text-sm"><Share2 className="h-4 w-4" /> Compartir</Button></div></article>)}</div>
         {data?.hasMore && <button onClick={() => setPage(v => v + 1)} className="mt-5 min-h-11 w-full rounded-xl border border-primary/30 font-bold text-primary">Ver más conversaciones</button>}
      </>}
    </>}
  </div>;
}