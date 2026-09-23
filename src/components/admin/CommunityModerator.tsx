import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, Sparkles, Users, Megaphone, Flag, Ban, BadgeCheck } from "lucide-react";

const TOPICS = [
  { key: "general", label: "Para ti" },
  { key: "familia", label: "Familia" },
  { key: "pareja", label: "Relaciones" },
  { key: "ansiedad", label: "Bienestar" },
  { key: "fe", label: "Fe" },
  { key: "logros", label: "Avances" },
];
const topicLabel = (key: string) => TOPICS.find(t => t.key === key)?.label ?? key;
const KIND_LABEL: Record<string, string> = { user: "Usuario", ai: "IA automática", admin: "Administración" };

type Post = { id: string; user_id: string | null; author_name: string; author_kind: string; topic: string; title: string; body: string; is_anonymous: boolean; is_verified: boolean; is_bot: boolean; bot_kind: string | null; source_url: string | null; image_path: string | null; poll_options: string[] | null; created_at: string; reply_count: number };
type Reply = { id: string; post_id: string; user_id: string | null; author_name: string; author_kind: string; body: string; is_anonymous: boolean; created_at: string; post_title: string; post_topic: string; post_author_kind: string };
type Report = { id: string; target_type: string; target_id: string; target_kind: string; target_user_id: string | null; target_excerpt: string; post_title: string | null; reason: string; status: string; created_at: string };
type Suspension = { user_id: string; reason: string; kind: string | null; expires_at: string | null; target_excerpt: string | null; admin_note: string | null; user_message: string | null; created_at: string; name: string; email: string | null; active: boolean };
type Member = { id: string; name: string | null; email: string | null; level: number; paid: boolean };
type ModData = { posts: Post[]; replies: Reply[]; reports: Report[]; suspensions: Suspension[]; members: Member[] };

const fecha = (value: string) => new Date(value).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Section({ icon: Icon, title, hint, children }: { icon: typeof Users; title: string; hint?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-card p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><Icon className="h-5 w-5 text-primary" /> {title}</h2>{hint && <p className="mt-1 text-muted-foreground">{hint}</p>}{children}</section>;
}
function KindTag({ kind }: { kind: string }) {
  const style = kind === "admin" ? "bg-primary/10 text-primary" : kind === "ai" ? "bg-sky-500/10 text-sky-700" : "bg-muted text-muted-foreground";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>{KIND_LABEL[kind] ?? kind}</span>;
}

export function CommunityModerator() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [view, setView] = useState<"publicar" | "preguntas" | "automatizacion" | "publicaciones" | "denuncias" | "suspensiones" | "verificados">("publicar");
  const [mode, setMode] = useState<"texto" | "encuesta">("texto");
  const [topic, setTopic] = useState("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [options, setOptions] = useState(["", "", ""]);
  const [publishing, setPublishing] = useState(false);
  const [search, setSearch] = useState("");
  const [answerFor, setAnswerFor] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [suspendFor, setSuspendFor] = useState<{ userId: string; targetType?: string; targetId?: string; reportId?: string } | null>(null);
  const [suspendKind, setSuspendKind] = useState<"temporal" | "permanent" | "indefinite">("temporal");
  const [suspendDays, setSuspendDays] = useState(7);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendNote, setSuspendNote] = useState("");

  const { data, isLoading, error } = useQuery({ queryKey: ["admin-community"], queryFn: async () => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/community", { headers: { Authorization: `Bearer ${auth.session?.access_token ?? ""}` } });
    if (!res.ok) throw new Error("No se pudo cargar la moderación.");
    return res.json() as Promise<ModData>;
  } });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin-community"] });

  async function send(payload: Record<string, unknown>) {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/community", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.session?.access_token ?? ""}` }, body: JSON.stringify(payload) });
    const result = await res.json() as { error?: string };
    if (!res.ok) throw new Error(result.error ?? "No se pudo completar la acción.");
    refresh();
  }
  async function act(payload: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    try { await send(payload); toast.success("Moderación actualizada"); }
    catch (e) { toast.error((e as Error).message); }
  }
  async function publish() {
    setPublishing(true);
    try {
      let imagePath: string | null = null;
      if (mode === "texto" && image) {
        if (!["image/jpeg", "image/png"].includes(image.type)) throw new Error("Solo imágenes JPG o PNG.");
        if (image.size > 8 * 1024 * 1024) throw new Error("La imagen es demasiado grande.");
        const path = `${user!.id}/${crypto.randomUUID()}.${image.type === "image/png" ? "png" : "jpg"}`;
        const { error: uploadError } = await supabase.storage.from("community-media").upload(path, image, { contentType: image.type });
        if (uploadError) throw uploadError;
        imagePath = path;
      }
      await send(mode === "encuesta"
        ? { action: "create-poll", topic, title, content: body, options }
        : { action: "create-post", topic, title, content: body, imagePath });
      setTitle(""); setBody(""); setImage(null); setOptions(["", "", ""]);
      toast.success(mode === "encuesta" ? "Encuesta publicada y verificada." : "Publicación creada y verificada.");
    } catch (e) { toast.error((e as Error).message); } finally { setPublishing(false); }
  }
  async function sendAnswer(postId: string) {
    try { await send({ action: "admin-reply", id: postId, content: answer }); setAnswer(""); setAnswerFor(null); toast.success("La comunidad verá la respuesta de ORÍGEN."); }
    catch (e) { toast.error((e as Error).message); }
  }
  async function confirmSuspend() {
    if (!suspendFor) return;
    try {
      await send({ action: "suspend", userId: suspendFor.userId, kind: suspendKind, days: suspendDays, reason: suspendReason, note: suspendNote, targetType: suspendFor.targetType, targetId: suspendFor.targetId });
      if (suspendFor.reportId) await send({ action: "review", id: suspendFor.reportId });
      setSuspendFor(null); setSuspendReason(""); setSuspendNote(""); setSuspendKind("temporal"); setSuspendDays(7);
      toast.success("Suspensión aplicada. La persona verá el aviso al entrar a la comunidad.");
    } catch (e) { toast.error((e as Error).message); }
  }

  const term = search.trim().toLocaleLowerCase("es");
  const filtered = useMemo(() => (data?.posts ?? []).filter(p => !term || `${p.title} ${p.body} ${p.author_name} ${topicLabel(p.topic)}`.toLocaleLowerCase("es").includes(term)), [data, term]);
  const adminThreads = useMemo(() => (data?.posts ?? []).filter(p => p.author_kind === "admin"), [data]);
  const aiThreads = useMemo(() => (data?.posts ?? []).filter(p => p.author_kind === "ai"), [data]);
  const repliesOf = (postId: string) => (data?.replies ?? []).filter(r => r.post_id === postId).slice().reverse();

  if (isLoading) return <p className="mt-5 text-sm">Cargando comunidad…</p>;
  if (error) return <p className="mt-5 text-sm text-destructive">No se pudo cargar la moderación.</p>;

  const VIEWS = [["publicar", "Publicar"], ["preguntas", "Preguntas y respuestas"], ["automatizacion", "Automatización IA"], ["publicaciones", "Publicaciones y noticias"], ["denuncias", "Denuncias"], ["suspensiones", "Suspensiones"], ["verificados", "Verificados"]] as const;

  function Thread({ post, empty }: { post: Post; empty: string }) {
    const list = repliesOf(post.id);
    return <article className="rounded-xl border p-3">
      <div className="flex flex-wrap items-center gap-2"><KindTag kind={post.author_kind} /><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{topicLabel(post.topic)}</span>{post.poll_options && <span className="text-xs text-primary">Encuesta</span>}{post.is_verified && <ShieldCheck className="h-4 w-4 text-primary" aria-label="Verificada" />}<span className="text-xs text-muted-foreground">{fecha(post.created_at)}</span></div>
      <p className="mt-2 font-bold">{post.title}</p>
      {post.body && <p className="mt-1 line-clamp-2 text-muted-foreground">{post.body}</p>}
      <div className="mt-3 space-y-2 border-l-2 border-primary/20 pl-3">
        {list.length === 0 && <p className="text-xs text-muted-foreground">{empty}</p>}
        {list.map(r => <div key={r.id} className="rounded-lg bg-secondary/40 p-2.5">
          <div className="flex flex-wrap items-center gap-2"><KindTag kind={r.author_kind} /><span className="text-xs font-semibold">{r.is_anonymous ? "Alma anónima" : r.author_name}</span><span className="text-xs text-muted-foreground">{fecha(r.created_at)}</span></div>
          <p className="mt-1 whitespace-pre-wrap">{r.body || "Respuesta con adjunto"}</p>
          <div className="mt-1 flex flex-wrap gap-3 text-xs">
            <button onClick={() => void act({ action: "delete-reply", id: r.id }, "¿Eliminar esta respuesta?")} className="text-destructive">Eliminar</button>
            {r.user_id && r.author_kind === "user" && <button onClick={() => setSuspendFor({ userId: r.user_id!, targetType: "reply", targetId: r.id })} className="text-destructive">Suspender autor</button>}
          </div>
        </div>)}
      </div>
      {answerFor === post.id
        ? <div className="mt-3"><textarea aria-label="Respuesta de la administración" value={answer} maxLength={4000} onChange={e => setAnswer(e.target.value)} placeholder="Responde como ORÍGEN · Administración" className="min-h-20 w-full rounded-xl border bg-background p-3" /><div className="mt-2 flex gap-2"><Button type="button" disabled={answer.trim().length < 2} onClick={() => void sendAnswer(post.id)}>Enviar como ORÍGEN</Button><Button type="button" variant="ghost" onClick={() => { setAnswerFor(null); setAnswer(""); }}>Cancelar</Button></div></div>
        : <Button type="button" variant="secondary" className="mt-3" onClick={() => { setAnswerFor(post.id); setAnswer(""); }}>Responder como ORÍGEN</Button>}
    </article>;
  }

  return <div className="mt-5 space-y-6 text-sm">
    {suspendFor && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 px-5" onClick={() => setSuspendFor(null)}>
      <section role="dialog" aria-modal="true" aria-label="Aplicar suspensión" onClick={e => e.stopPropagation()} className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-6 shadow-elev">
        <h2 className="text-lg font-bold">Suspender participación</h2>
        <p className="mt-1 text-muted-foreground">ORÍGEN redactará el aviso que verá la persona con base en el motivo y tu nota.</p>
        <label className="mt-4 block text-xs font-semibold">Tipo de suspensión<select aria-label="Tipo de suspensión" value={suspendKind} onChange={e => setSuspendKind(e.target.value as typeof suspendKind)} className="mt-1 h-12 w-full rounded-xl border bg-background px-3 text-sm"><option value="temporal">Temporal (1 a 30 días)</option><option value="indefinite">Indefinida</option><option value="permanent">Permanente</option></select></label>
        {suspendKind === "temporal" && <label className="mt-3 block text-xs font-semibold">Días de suspensión: {suspendDays}<input type="range" min={1} max={30} value={suspendDays} onChange={e => setSuspendDays(Number(e.target.value))} className="mt-1 w-full" /></label>}
        <textarea aria-label="Motivo visible" value={suspendReason} maxLength={500} onChange={e => setSuspendReason(e.target.value)} placeholder="Motivo de la suspensión (lo verá la persona)" className="mt-3 min-h-20 w-full rounded-xl border bg-background p-3" />
        <textarea aria-label="Nota para ORÍGEN" value={suspendNote} maxLength={1000} onChange={e => setSuspendNote(e.target.value)} placeholder="Nota para orientar el aviso: tono usado, conducta a corregir…" className="mt-3 min-h-20 w-full rounded-xl border bg-background p-3" />
        <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setSuspendFor(null)}>Cancelar</Button><Button variant="destructive" disabled={suspendReason.trim().length < 5} onClick={() => void confirmSuspend()}>Aplicar suspensión</Button></div>
      </section>
    </div>}

    <div className="flex gap-2 overflow-x-auto pb-1">{VIEWS.map(([key, label]) => <Button key={key} type="button" variant={view === key ? "secondary" : "ghost"} onClick={() => setView(key)} className={`min-h-11 shrink-0 rounded-full px-4 text-xs ${view === key ? "text-primary" : "text-muted-foreground"}`}>{label}</Button>)}</div>

    {view === "publicar" && <Section icon={Megaphone} title="Nueva publicación de la administración" hint="Publica texto, imagen o encuesta. Todo lo publicado desde el panel queda verificado automáticamente.">
      <div className="mt-4 flex gap-2">{([["texto", "Texto e imagen"], ["encuesta", "Encuesta"]] as const).map(([key, label]) => <Button key={key} type="button" variant={mode === key ? "secondary" : "ghost"} onClick={() => setMode(key)} className="min-h-11 rounded-full px-4 text-xs">{label}</Button>)}</div>
      <label className="mt-4 block text-xs font-semibold">Tema<select aria-label="Tema" value={topic} onChange={e => setTopic(e.target.value)} className="mt-1 h-12 w-full rounded-xl border bg-background px-3 text-sm">{TOPICS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select></label>
      <input aria-label="Título o pregunta" value={title} maxLength={200} onChange={e => setTitle(e.target.value)} placeholder={mode === "encuesta" ? "Escribe la pregunta de la encuesta" : "Título de la publicación o promoción"} className="mt-3 h-12 w-full rounded-xl border bg-background px-3" />
      <textarea aria-label="Texto" value={body} maxLength={10000} onChange={e => setBody(e.target.value)} placeholder={mode === "encuesta" ? "Contexto (opcional)" : "Cuerpo de la publicación"} className="mt-3 min-h-24 w-full rounded-xl border bg-background p-3" />
      {mode === "texto"
        ? <label className="mt-3 flex min-h-12 cursor-pointer items-center gap-2 text-primary">Imagen JPG o PNG (opcional): {image?.name ?? "Adjuntar"}<input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={e => setImage(e.target.files?.[0] ?? null)} /></label>
        : <><div className="mt-3 space-y-2">{options.map((value, index) => <div key={index} className="flex gap-2"><input aria-label={`Opción ${index + 1}`} maxLength={100} value={value} onChange={e => setOptions(previous => previous.map((item, position) => position === index ? e.target.value : item))} placeholder={`Opción ${index + 1}`} className="h-12 min-w-0 flex-1 rounded-xl border bg-background px-3" />{options.length > 3 && <Button type="button" variant="ghost" onClick={() => setOptions(previous => previous.filter((_, position) => position !== index))} aria-label={`Quitar opción ${index + 1}`}>Quitar</Button>}</div>)}</div><Button type="button" variant="secondary" className="mt-3" disabled={options.length >= 6} onClick={() => setOptions(previous => [...previous, ""])}>Añadir opción</Button></>}
      <div className="mt-4"><Button type="button" disabled={publishing || title.trim().length < 6 || (mode === "encuesta" && options.some(value => !value.trim()))} onClick={() => void publish()}>{publishing ? "Publicando…" : mode === "encuesta" ? "Publicar encuesta" : "Publicar"}</Button></div>
    </Section>}

    {view === "preguntas" && <Section icon={Users} title="Preguntas de la administración y respuestas recibidas" hint="Cada pregunta del panel con las respuestas de la comunidad debajo. Tu respuesta aparece como ORÍGEN · Administración.">
      <div className="mt-4 space-y-4">{adminThreads.length === 0 ? <p className="text-muted-foreground">Todavía no has publicado preguntas desde el panel.</p> : adminThreads.map(p => <Thread key={p.id} post={p} empty="Nadie ha respondido esta pregunta todavía." />)}</div>
    </Section>}

    {view === "automatizacion" && <Section icon={Sparkles} title="Automatización de la IA" hint="Publicaciones con portada, encuestas y respuestas generadas automáticamente. Puedes responder como Administración.">
      <div className="mt-4 space-y-4">{aiThreads.length === 0 ? <p className="text-muted-foreground">La IA todavía no ha publicado contenido.</p> : aiThreads.slice(0, 40).map(p => <Thread key={p.id} post={p} empty="Sin respuestas de la comunidad todavía." />)}</div>
    </Section>}

    {view === "publicaciones" && <Section icon={ShieldCheck} title="Publicaciones y noticias" hint="Separadas por origen para que sepas qué publicó cada quién.">
      <div className="relative mt-4"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input type="search" aria-label="Buscar publicaciones" value={search} onChange={e => setSearch(e.target.value)} placeholder="Busca por título, texto, autor o tema…" className="h-12 w-full rounded-xl border bg-background pl-10 pr-3" /></div>
      {(["user", "ai", "admin"] as const).map(kind => {
        const list = filtered.filter(p => p.author_kind === kind);
        return <div key={kind} className="mt-5">
          <h3 className="flex items-center gap-2 font-bold"><KindTag kind={kind} /> {list.length} publicaciones</h3>
          <div className="mt-2 max-h-[420px] space-y-3 overflow-auto">
            {list.length === 0 && <p className="text-muted-foreground">Sin publicaciones en este grupo.</p>}
            {list.map(p => <article key={p.id} className="rounded-xl border p-3">
              <p className="font-bold">{p.title} {p.is_verified && <ShieldCheck className="inline h-4 w-4 text-primary" />}</p>
              <p className="mt-1 line-clamp-2 text-muted-foreground">{p.body}</p>
              <p className="mt-1 text-xs">{topicLabel(p.topic)} · {p.is_anonymous ? "Anónimo" : p.author_name} · {p.reply_count} respuestas · {fecha(p.created_at)}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-primary">
                {kind === "user" && <button onClick={() => void act({ action: p.is_verified ? "unverify" : "verify", id: p.id, sourceUrl: p.is_verified ? undefined : window.prompt("URL de la fuente comprobada (opcional)") ?? undefined })}>{p.is_verified ? "Quitar verificación" : "Verificar"}</button>}
                <button onClick={() => void act({ action: "delete-post", id: p.id }, "¿Eliminar esta publicación y sus respuestas?")} className="text-destructive">Eliminar</button>
                {p.user_id && <button onClick={() => setSuspendFor({ userId: p.user_id!, targetType: "post", targetId: p.id })} className="text-destructive">Suspender autor</button>}
              </div>
            </article>)}
          </div>
        </div>;
      })}
    </Section>}

    {view === "denuncias" && <Section icon={Flag} title="Denuncias pendientes" hint="Agrupadas por origen del contenido para no borrar lo nuestro por error.">
      {(["user", "ai", "admin", "eliminado"] as const).map(kind => {
        const list = (data?.reports ?? []).filter(r => r.status === "pending" && r.target_kind === kind);
        if (!list.length) return null;
        return <div key={kind} className="mt-5"><h3 className="flex items-center gap-2 font-bold"><KindTag kind={kind} /> {list.length}</h3><div className="mt-2 space-y-3">{list.map(r => <div key={r.id} className="rounded-xl bg-secondary/40 p-3">
          <p className="text-xs text-muted-foreground">{r.target_type === "post" ? "Publicación" : "Respuesta"} · {fecha(r.created_at)}</p>
          <p className="mt-1 font-semibold">Motivo: {r.reason}</p>
          <p className="mt-1 line-clamp-3 text-muted-foreground">{r.target_excerpt}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {r.target_user_id && kind === "user" && <button onClick={() => setSuspendFor({ userId: r.target_user_id!, targetType: r.target_type, targetId: r.target_id, reportId: r.id })} className="font-bold text-destructive">Pasar a suspensión</button>}
            <button onClick={() => void act({ action: "review", id: r.id, status: "dismissed" })} className="text-primary">Descartar denuncia</button>
            <button onClick={() => void act({ action: r.target_type === "post" ? "delete-post" : "delete-reply", id: r.target_id }, "¿Eliminar el contenido denunciado?")} className="text-destructive">Eliminar contenido</button>
          </div>
        </div>)}</div></div>;
      })}
      {!data?.reports.some(r => r.status === "pending") && <p className="mt-4 text-muted-foreground">Sin denuncias pendientes.</p>}
    </Section>}

    {view === "suspensiones" && <Section icon={Ban} title="Personas suspendidas" hint="Con el contenido que originó la sanción, el plazo y el aviso que ve la persona.">
      <div className="mt-4 space-y-3">
        {!data?.suspensions.length && <p className="text-muted-foreground">Sin suspensiones activas.</p>}
        {(data?.suspensions ?? []).map(s => <article key={s.user_id} className="rounded-xl border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold">{s.name}</p><p className="text-xs text-muted-foreground">{s.email}</p></div><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.active ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{s.kind === "permanent" ? "Permanente" : s.kind === "indefinite" ? "Indefinida" : s.expires_at ? `Hasta ${fecha(s.expires_at)}` : "Temporal"}{!s.active && " · cumplida"}</span></div>
          <p className="mt-2"><strong>Motivo:</strong> {s.reason}</p>
          {s.target_excerpt && <p className="mt-1 rounded-lg bg-muted p-2 text-xs">Contenido: {s.target_excerpt}</p>}
          {s.admin_note && <p className="mt-1 text-xs text-muted-foreground">Nota interna: {s.admin_note}</p>}
          {s.user_message && <p className="mt-2 rounded-lg bg-secondary/40 p-2 text-xs">Aviso que ve la persona: {s.user_message}</p>}
          <Button type="button" variant="ghost" className="mt-2 text-primary" onClick={() => void act({ action: "unsuspend", userId: s.user_id }, "¿Restablecer la participación?")}>Restablecer</Button>
        </article>)}
      </div>
    </Section>}

    {view === "verificados" && <Section icon={BadgeCheck} title="Usuarios verificados por nivel" hint="Solo las membresías de pago pueden recibir Nivel 1, 2 o 3.">
      <div className="mt-4 space-y-2">
        {!data?.members.length && <p className="text-muted-foreground">Todavía no hay membresías de pago activas.</p>}
        {(data?.members ?? []).map(m => <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
          <div><p className="font-bold">{m.name ?? "Persona del camino"}</p><p className="text-xs text-muted-foreground">{m.email} · {m.paid ? "Membresía activa" : "Sin membresía activa"}</p></div>
          <label className="text-xs font-semibold">Nivel<select aria-label={`Nivel de ${m.email ?? m.id}`} value={m.level} onChange={e => void act({ action: "set-level", userId: m.id, level: Number(e.target.value) })} className="ml-2 h-11 rounded-xl border bg-background px-3 text-sm"><option value={0}>Sin verificar</option><option value={1}>Nivel 1</option><option value={2}>Nivel 2</option><option value={3}>Nivel 3</option></select></label>
        </div>)}
      </div>
    </Section>}
  </div>;
}
