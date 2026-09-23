import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type ModData = {
  posts: { id: string; user_id: string | null; title: string; body: string; topic: string; is_anonymous: boolean; is_verified: boolean; is_bot: boolean; source_url: string | null; created_at: string }[];
  replies: { id: string; post_id: string; user_id: string | null; body: string; created_at: string }[];
  reports: { id: string; target_type: string; target_id: string; reason: string; status: string; created_at: string }[];
  suspensions: { user_id: string; reason: string; created_at: string }[];
};

export function CommunityModerator() {
  const qc = useQueryClient();
  const [topic, setTopic] = useState("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [options, setOptions] = useState(["", "", ""]);
  const [publishing, setPublishing] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-community"], queryFn: async () => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/community", { headers: { Authorization: `Bearer ${auth.session?.access_token ?? ""}` } });
    if (!res.ok) throw new Error("No se pudo cargar la moderación.");
    return res.json() as Promise<ModData>;
  } });
  async function act(action: string, id?: string, userId?: string) {
    if (["delete-post", "delete-reply", "suspend"].includes(action) && !window.confirm("¿Confirmas esta acción de moderación?")) return;
    const reason = action === "suspend" ? window.prompt("Motivo de la suspensión") : undefined;
    if (action === "suspend" && !reason?.trim()) return;
    const sourceUrl = action === "verify" ? window.prompt("URL de la fuente comprobada (opcional)") : undefined;
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/community", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.session?.access_token ?? ""}` }, body: JSON.stringify({ action, id, userId, reason, sourceUrl }) });
    const result = await res.json();
    if (!res.ok) toast.error(result.error ?? "No se pudo completar la acción.");
    else { toast.success("Moderación actualizada"); void qc.invalidateQueries({ queryKey: ["admin-community"] }); }
  }
  async function publishPoll() {
    setPublishing(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/community", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.session?.access_token ?? ""}` }, body: JSON.stringify({ action: "create-poll", topic, title, body, options }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "No se pudo publicar la encuesta.");
      setTitle(""); setBody(""); setOptions(["", "", ""]);
      void qc.invalidateQueries({ queryKey: ["admin-community"] });
      toast.success("Encuesta publicada en Comunidad.");
    } catch (error) { toast.error((error as Error).message); } finally { setPublishing(false); }
  }
  if (isLoading) return <p className="mt-5 text-sm">Cargando comunidad…</p>;
  if (error) return <p className="mt-5 text-sm text-destructive">No se pudo cargar la moderación.</p>;
  return <div className="mt-5 space-y-6 text-sm">
    <section className="rounded-2xl border bg-card p-5"><h2 className="text-lg font-bold">Nueva encuesta</h2><p className="mt-1 text-muted-foreground">La comunidad verá sus porcentajes y su elección después de votar.</p><label className="mt-4 block text-xs font-semibold">Tema<select aria-label="Tema de la encuesta" value={topic} onChange={e => setTopic(e.target.value)} className="mt-1 h-12 w-full rounded-xl border bg-background px-3 text-sm"><option value="general">Para ti</option><option value="familia">Familia</option><option value="pareja">Relaciones</option><option value="ansiedad">Bienestar</option><option value="fe">Fe</option><option value="logros">Avances</option></select></label><input aria-label="Pregunta de la encuesta" value={title} maxLength={200} onChange={e => setTitle(e.target.value)} placeholder="Escribe la pregunta de la encuesta" className="mt-3 h-12 w-full rounded-xl border bg-background px-3" /><textarea aria-label="Contexto de la encuesta" value={body} maxLength={10000} onChange={e => setBody(e.target.value)} placeholder="Contexto (opcional)" className="mt-3 min-h-20 w-full rounded-xl border bg-background p-3" /><div className="mt-3 space-y-2">{options.map((value, index) => <div key={index} className="flex gap-2"><input aria-label={`Opción ${index + 1}`} maxLength={100} value={value} onChange={e => setOptions(previous => previous.map((item, position) => position === index ? e.target.value : item))} placeholder={`Opción ${index + 1}`} className="h-12 min-w-0 flex-1 rounded-xl border bg-background px-3" />{options.length > 3 && <Button type="button" variant="ghost" onClick={() => setOptions(previous => previous.filter((_, position) => position !== index))} aria-label={`Quitar opción ${index + 1}`}>Quitar</Button>}</div>)}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><Button type="button" variant="secondary" disabled={options.length >= 6} onClick={() => setOptions(previous => [...previous, ""])}>Añadir opción</Button><Button type="button" disabled={publishing || title.trim().length < 6 || options.some(value => !value.trim())} onClick={() => void publishPoll()}>{publishing ? "Publicando…" : "Publicar encuesta"}</Button></div></section>
    <section className="rounded-2xl border bg-card p-5"><h2 className="text-lg font-bold">Denuncias pendientes</h2><div className="mt-3 space-y-3">{data?.reports.filter(r => r.status === "pending").map(r => <div key={r.id} className="rounded-xl bg-secondary/40 p-3"><p>{r.target_type === "post" ? "Pregunta" : "Respuesta"} · {r.reason}</p><button onClick={() => void act("review", r.id)} className="mt-2 text-primary underline">Marcar revisada</button></div>)}{!data?.reports.some(r => r.status === "pending") && <p className="text-muted-foreground">Sin denuncias pendientes.</p>}</div></section>
    <section className="rounded-2xl border bg-card p-5"><h2 className="text-lg font-bold">Publicaciones y noticias</h2><p className="text-muted-foreground">Verifica solo contenido contrastado. ORÍGEN no marca noticias externas como verificadas automáticamente.</p><div className="mt-3 max-h-[500px] space-y-3 overflow-auto">{data?.posts.map(p => <article key={p.id} className="rounded-xl border p-3"><p className="font-bold">{p.title} {p.is_verified && <span className="text-primary">· Verificado</span>}</p><p className="mt-1 line-clamp-3 text-muted-foreground">{p.body}</p><p className="mt-1 text-xs">{p.topic} · {p.is_anonymous ? "Anónimo" : "Público"} · {new Date(p.created_at).toLocaleDateString("es")}</p><div className="mt-2 flex flex-wrap gap-3 text-primary">{!p.is_bot && <button onClick={() => void act(p.is_verified ? "unverify" : "verify", p.id)}>{p.is_verified ? "Quitar verificación" : "Verificar"}</button>}<button onClick={() => void act("delete-post", p.id)}>Eliminar</button>{p.user_id && <button onClick={() => void act("suspend", undefined, p.user_id ?? undefined)}>Suspender autor</button>}</div></article>)}</div></section>
    <section className="rounded-2xl border bg-card p-5"><h2 className="text-lg font-bold">Respuestas</h2><div className="mt-3 max-h-[380px] space-y-2 overflow-auto">{data?.replies.map(r => <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border p-3"><p className="line-clamp-3">{r.body}</p><button onClick={() => void act("delete-reply", r.id)} className="shrink-0 text-destructive">Eliminar</button></div>)}</div></section>
    <section className="rounded-2xl border bg-card p-5"><h2 className="text-lg font-bold">Suspensiones</h2>{data?.suspensions.map(s => <div key={s.user_id} className="mt-2 flex justify-between gap-3 rounded-xl border p-3"><p>{s.reason}</p><button onClick={() => void act("unsuspend", undefined, s.user_id)} className="text-primary">Restablecer</button></div>)}{!data?.suspensions.length && <p className="mt-2 text-muted-foreground">Sin suspensiones.</p>}</section>
  </div>;
}