import { APP_COVERS } from "@/lib/app-cover-catalog";
import { adminListCategories, adminUpdateCategory } from "@/lib/content-admin.functions";
import { useContentOverrides } from "@/hooks/use-content-overrides";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, Loader2, Plus, Save, Search, Trash2, Upload, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCreateCamino,
  adminListCaminos,
  adminSetOverride,
  adminUpdateCamino,
} from "@/lib/content-admin.functions";
import { CAMINOS } from "@/lib/caminos";
import { GAMES } from "@/components/games/DailyGames";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Notify = (n: { text: string; error?: boolean } | null) => void;

const input =
  "w-full min-h-12 rounded-[10px] border-2 border-border bg-card px-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";

function useOverrides() { const { map, isLoading } = useContentOverrides(); return { data: map, isLoading }; }

/** Caminos ORÍGEN: los existentes (ocultar/portada) y nuevos creados por la IA. */
export function CaminosStudio({ onNote }: { onNote: Notify }) {
  const qc = useQueryClient();
  const list = useServerFn(adminListCaminos);
  const create = useServerFn(adminCreateCamino);
  const update = useServerFn(adminUpdateCamino);
  const setOv = useServerFn(adminSetOverride);
  const { data: custom = [] } = useQuery({ queryKey: ["studio-caminos"], queryFn: () => list(), refetchInterval: 20_000 });
  const { data: ov } = useOverrides();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [cover, setCover] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(id);
    try {
      await fn();
      onNote({ text: ok });
      qc.invalidateQueries({ queryKey: ["studio-caminos"] });
      qc.invalidateQueries({ queryKey: ["content-overrides"] });
      qc.invalidateQueries({ queryKey: ["custom-caminos"] });
    } catch (e) {
      onNote({ text: e instanceof Error ? e.message : "No pudimos guardar.", error: true });
    }
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-[16px] border border-border bg-card p-5">
        <h3 className="font-display text-[17px] font-bold">Crear camino nuevo con IA</h3>
        <div className="rounded-[12px] bg-primary/8 p-4">
          <p className="text-[13px] font-bold text-primary">Sale idéntico a CAMINO ORÍGEN</p>
          <div className="mt-2 grid grid-cols-8 gap-1" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="grid h-9 place-items-center rounded-full bg-card text-[12px] font-bold text-primary shadow-soft">{i + 1}</span>
            ))}
          </div>
          <ul className="mt-3 space-y-1 text-[12.5px] text-foreground/80">
            <li>• Mapa con <b>8 etapas diarias</b>: se abre una por día a las 12:00 a. m.</li>
            <li>• Cada etapa se vive en <b>20 pasos</b> (Paso 1 de 20): lección, soluciones, tareas, sopa de letras, preguntas, juegos, oración y premio.</li>
            <li>• Portada sin letras, solo imagen. La IA escribe todo según el nombre y la nota.</li>
          </ul>
        </div>
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título: Sanar la herida de abandono" />
        <textarea className={cn(input, "min-h-24 py-2")} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nota para la IA: a quién va dirigido y qué debe lograr" />
        <input className={input} value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Portada por enlace (vacío = la IA la crea)" />
        <button
          disabled={busy === "new"}
          onClick={() => {
            if (title.trim().length < 3) return onNote({ text: "Escribe un título más largo.", error: true });
            run("new", async () => {
              await create({ data: { title: title.trim(), notes, coverUrl: cover.trim() } });
              setTitle(""); setNotes(""); setCover("");
            }, "Camino creado con 8 etapas diarias de 20 pasos cada una, igual a CAMINO ORÍGEN. Queda oculto hasta que lo hagas visible.");
          }}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Crear camino con IA
        </button>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-5">
        <h3 className="font-display text-[17px] font-bold">Todos los caminos</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAMINOS.map((c) => {
            const o = ov?.get(`camino:${c.id}`);
            return (
              <CoverCard
                key={c.id}
                title={o?.title || c.title}
                image={o?.cover_url || c.banner}
                visible={!o?.is_hidden}
                busy={busy === c.id}
                coverValue={o?.cover_url ?? ""}
                onToggle={() => run(c.id, () => setOv({ data: { key: `camino:${c.id}`, scope: "camino", isHidden: !o?.is_hidden } }), "Visibilidad actualizada.")}
                onSaveCover={(url) => run(c.id, () => setOv({ data: { key: `camino:${c.id}`, scope: "camino", coverUrl: url } }), "Portada guardada.")}
              />
            );
          })}
          {custom.map((c) => <div key={c.id} className="space-y-2"><Button variant="outline" className="w-full" disabled={busy === c.id} onClick={() => run(c.id, () => create({ data: { title: c.title, notes: "Conservar el tema propio con el formato de CAMINO ORÍGEN.", coverUrl: c.cover_url ?? "", existingId: c.id } }), "Camino actualizado al diseño de CAMINO ORÍGEN.")}>Rehacer con IA (8 etapas · 20 pasos)</Button>
            <a href={`/caminos/${c.slug}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center rounded-[10px] border border-border bg-card text-[13px] font-bold">Ver cómo lo ve la persona</a>
            <ol className="rounded-[10px] bg-muted/40 p-3 text-[12px] text-foreground/80">{(((c.content as { etapas?: { title: string }[] })?.etapas) ?? []).map((e, i) => <li key={i}>Etapa {i + 1}: {e.title}</li>)}</ol>
            <CoverCard
              key={c.id}
              title={c.title}
              image={c.cover_url}
              visible={c.is_published}
              busy={busy === c.id}
              coverValue={c.cover_url ?? ""}
              onToggle={() => run(c.id, () => update({ data: { id: c.id, isPublished: !c.is_published } }), "Visibilidad actualizada.")}
              onSaveCover={(url) => run(c.id, () => update({ data: { id: c.id, coverUrl: url } }), "Portada guardada.")}
              onDelete={() => window.confirm(`¿Eliminar "${c.title}"?`) && run(c.id, () => update({ data: { id: c.id, remove: true } }), "Camino eliminado.")}
            />
          </div>)}
        </div>
      </div>
    </div>
  );
}

/** Named image library; covers only, never background pools. */
export function CoversStudio({ onNote }: { onNote: Notify }) {
  const qc = useQueryClient();
  const setOv = useServerFn(adminSetOverride);
  const listCategories = useServerFn(adminListCategories);
  const updateCategory = useServerFn(adminUpdateCategory);
  const listCaminos = useServerFn(adminListCaminos);
  const updateCamino = useServerFn(adminUpdateCamino);
  const { data: ov } = useOverrides();
  const { data: categories = [] } = useQuery({ queryKey: ["studio-categories"], queryFn: () => listCategories() });
  const { data: caminos = [] } = useQuery({ queryKey: ["studio-caminos"], queryFn: () => listCaminos() });
  const { data: consultas = [] } = useQuery({ queryKey: ["studio-consulta-covers"], queryFn: async () => { const { data, error } = await supabase.from("custom_consultas").select("id,title,slug,cover_url").order("created_at"); if (error) throw error; return data ?? []; } });
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    try { await action(); onNote({ text: "Imagen guardada en su sección." }); await qc.invalidateQueries(); }
    catch (e) { onNote({ text: e instanceof Error ? e.message : "No pudimos guardar la imagen.", error: true }); }
    finally { setBusy(null); }
  }
  type Item = { key: string; section: string; title: string; image: string | null; save: (url: string) => Promise<unknown>; toggle?: () => Promise<unknown>; visible?: boolean };
  const items: Item[] = [
    ...APP_COVERS.map(i => ({ ...i, image: ov?.get(i.key)?.cover_url || i.image, save: (url: string) => setOv({ data: { key: i.key, scope: i.scope, coverUrl: url } }) })),
    ...CAMINOS.map(c => ({ key: `camino:${c.id}`, section: "Caminos y categorías", title: c.title, image: ov?.get(`camino:${c.id}`)?.cover_url || c.banner, save: (url: string) => setOv({ data: { key: `camino:${c.id}`, scope: "camino", coverUrl: url } }) })),
    ...caminos.map(c => ({ key: `custom-camino:${c.id}`, section: "Caminos creados", title: c.title, image: c.cover_url, save: (url: string) => updateCamino({ data: { id: c.id, coverUrl: url } }) })),
    ...categories.filter(c => c.is_custom).map(c => ({ key: `category:${c.id}`, section: "Visualízalo · temas creados", title: c.title, image: c.cover_url, save: (url: string) => updateCategory({ data: { id: c.id, coverUrl: url } }) })),
    ...consultas.map(c => ({ key: `consulta:${c.id}`, section: "Consultas creadas", title: c.title, image: c.cover_url, save: async (url: string) => { const { error } = await supabase.from("custom_consultas").update({ cover_url: url || null }).eq("id", c.id); if (error) throw error; } })),
    ...GAMES.map(g => ({ key: `juego:${g.id}`, section: "Juegos", title: g.title, image: ov?.get(`juego:${g.id}`)?.cover_url || g.img, save: (url: string) => setOv({ data: { key: `juego:${g.id}`, scope: "juego", coverUrl: url } }) })),
  ];
  const sections = [...new Set(items.map(i => i.section))];
  return <section className="space-y-4">
    <div className="flex items-center gap-2 rounded-[10px] border border-border bg-background px-3"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label="Buscar imagen por sección o nombre" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar sección o imagen" className="min-h-12 w-full bg-transparent text-sm outline-none" /></div>
    {sections.map(section => { const shown = items.filter(i => i.section === section && `${i.title} ${section}`.toLowerCase().includes(q.toLowerCase())); if (!shown.length) return null; return <details key={section} open={!!q} className="border-b border-border pb-4"><summary className="flex min-h-12 cursor-pointer items-center gap-3 font-display text-base font-semibold"><ChevronDown className="h-4 w-4 text-primary" />{section}<span className="ml-auto text-sm text-muted-foreground">{shown.length}</span></summary><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shown.map(i => <CoverCard key={`${i.key}:${i.image}`} title={i.title} image={i.image} busy={busy === i.key} visible={true} coverValue={i.image ?? ""} onSaveCover={url => run(i.key, () => i.save(url))} />)}</div></details>; })}
    {q && !items.some(i => `${i.title} ${i.section}`.toLowerCase().includes(q.toLowerCase())) && <p className="py-8 text-center text-sm text-muted-foreground">No encontramos una imagen con ese nombre.</p>}
  </section>;
}

function CoverCard({ title, image, visible, busy, coverValue, onToggle, onSaveCover, onDelete }: {
  title: string; image: string | null; visible: boolean; busy: boolean; coverValue: string;
  onToggle?: () => void; onSaveCover: (url: string) => void | Promise<void>; onDelete?: () => void;
}) {
  const [url, setUrl] = useState(coverValue);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  async function upload(file: File) {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setUploadError("Elige una imagen PNG, JPG o WEBP de hasta 5 MB."); return; }
    setUploading(true); setUploadError("");
    try {
      const path = `manual/${crypto.randomUUID()}.${file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "png"}`;
      const { error } = await supabase.storage.from("content-covers").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const signed = await supabase.storage.from("content-covers").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed.error || !signed.data) throw new Error("No pudimos preparar la imagen.");
      setUrl(signed.data.signedUrl); await onSaveCover(signed.data.signedUrl);
    } catch (error) { setUploadError(error instanceof Error ? error.message : "No pudimos subir la imagen."); }
    finally { setUploading(false); }
  }
  return (
    <article className="overflow-hidden rounded-[14px] border border-border bg-muted/30">
      {image ? (
        <img src={image} alt={title} className="aspect-[4/3] w-full bg-muted/30 object-contain" />
      ) : (
        <div className="grid aspect-[16/9] place-items-center bg-muted text-[12px] text-foreground/50">Sin portada</div>
      )}
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13.5px] font-bold leading-tight">{title}</p>
          {onToggle && <span className="shrink-0 text-xs text-muted-foreground">{visible ? "Visible" : "Oculto"}</span>}
        </div>
        <input className={input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enlace de la portada https://…" />
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-primary/10 text-sm font-semibold text-primary"><Upload className="h-4 w-4" />{uploading ? "Subiendo…" : "Reemplazar con archivo"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy || uploading} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ""; }} /></label>
        {uploadError && <p role="alert" className="text-sm text-destructive">{uploadError}</p>}
        <div className="flex gap-2">
          {busy || uploading ? (
            <Loader2 className="m-3 h-4 w-4 animate-spin" />
          ) : (
            <>
              <Button onClick={() => onSaveCover(url.trim())} className="min-h-11 flex-1 gap-1 rounded-[10px] text-sm">
                <Save className="h-4 w-4" /> Guardar imagen
              </Button>
              {onToggle && <Button variant="outline" size="icon" aria-label={visible ? "Ocultar" : "Hacer visible"} onClick={onToggle} className="grid h-11 w-11 place-items-center rounded-[10px] border border-border bg-card">
                {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>}
              {onDelete && (
                <button aria-label="Eliminar" onClick={onDelete} className="grid h-11 w-11 place-items-center rounded-[10px] border border-border bg-card text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
