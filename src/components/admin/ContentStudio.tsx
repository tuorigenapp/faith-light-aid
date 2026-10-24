import { Button } from "@/components/ui/button";
import { SubtopicIcon } from "@/components/visualiza/SubtopicIcon";
import { Fragment, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminCreateLimpieza,
  adminCreateVisualizaCategory,
  adminCreateVisualizaSubtopic,
  adminListLimpieza,
  adminToggleLimpieza,
  adminUpdateSubtopic,
  adminListCategories,
  adminUpdateCategory,
  adminDeleteCategory,
  adminListSubtopics,
  adminDeleteSubtopic,
  adminRegenerateSubtopic,
  adminUpdateLimpieza,
  adminDeleteLimpieza,
  adminRebuildTopicDesign,
} from "@/lib/content-admin.functions";
import { Copy, Eye, EyeOff, ImageIcon, Loader2, Pencil, Plus, RefreshCw, Search, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
import { CaminosStudio, CoversStudio } from "@/components/admin/CaminosStudio";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { directAudioUrl, mediaError, validAudioAddress } from "@/lib/media-input";
import { confirmDeletion } from "@/lib/deletion-confirmation";
export { directAudioUrl } from "@/lib/media-input";

type Tab = "temas" | "subtemas" | "limpieza" | "caminos" | "portadas";

const TABS: { id: Tab; label: string }[] = [
  { id: "temas", label: "Temas principales" },
  { id: "subtemas", label: "Subtemas" },
  { id: "limpieza", label: "Limpieza espiritual" },
  { id: "caminos", label: "Caminos ORÍGEN" },
  { id: "portadas", label: "Imágenes por sección" },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-bold text-foreground/70">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full min-h-12 rounded-[10px] border-2 border-white/15 bg-card px-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-[#7C5CFF] focus:outline-none";

export function ContentStudio() {
  const [tab, setTab] = useState<Tab>("temas");
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 rounded-full border-2 px-4 text-[13px] font-bold transition",
              tab === t.id
                ? "border-[#7C5CFF] bg-[#7C5CFF]/15 text-[#4B32A8]"
                : "border-white/15 bg-card text-foreground/70",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {note && (
        <p
          className={cn(
            "rounded-[12px] border px-4 py-3 text-[13px] font-semibold",
            note.error
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-[#3FBE8F]/40 bg-[#3FBE8F]/10 text-[#1B6B4F]",
          )}
        >
          {note.text}
        </p>
      )}

      {tab === "temas" && <MainTopics onNote={setNote} />}
      {tab === "subtemas" && <Subtopics onNote={setNote} />}
      {tab === "limpieza" && <Limpieza onNote={setNote} />}
      {tab === "caminos" && <CaminosStudio onNote={setNote} />}
      {tab === "portadas" && <CoversStudio onNote={setNote} />}
    </div>
  );
}

type Notify = (n: { text: string; error?: boolean } | null) => void;

function useCategories() {
  const list = useServerFn(adminListCategories);
  return useQuery({
    queryKey: ["studio-categories"],
    queryFn: () => list(),
    refetchInterval: 20_000,
  });
}

export function IconAction({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-border bg-card transition active:scale-95",
        danger ? "text-destructive" : "text-foreground/70 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function MainTopics({ onNote }: { onNote: Notify }) {
  const qc = useQueryClient();
  const create = useServerFn(adminCreateVisualizaCategory);
  const { data: categories = [], isLoading } = useCategories();
  const [title, setTitle] = useState("");
  const [groupKey, setGroupKey] = useState("abundancia");
  const [notes, setNotes] = useState("");
  const [withCover, setWithCover] = useState(true);
  const [design, setDesign] = useState<"musica" | "audio" | "limpieza">("musica");
  const audioOnly = design === "audio";
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (title.trim().length < 3) return onNote({ text: "Escribe un título más largo.", error: true });
    setBusy(true);
    onNote(null);
    try {
      const result = await create({
        data: { title: title.trim(), groupKey, notes, withCover, audioOnly, design, programGroup: "visualiza", requiredPlan: "camino" },
      });
      onNote({
        text: result.cover
          ? "Tema creado con portada generada. Queda oculto hasta que lo publiques."
          : "Tema creado. No pudimos generar la portada, puedes reintentar creando otro.",
      });
      setTitle("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["studio-categories"] });
    } catch (e) {
      onNote({ text: e instanceof Error ? e.message : "No pudimos crear el tema.", error: true });
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-[16px] border border-border bg-card p-5 space-y-3">
        <h3 className="font-display text-[17px] font-bold text-foreground">
          <Sparkles className="mr-2 inline h-4 w-4 text-[#F58BCB]" />
          Crear tema principal
        </h3>
        <Field label="Título del tema">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Abundancia sin culpa" />
        </Field>
        <Field label="Grupo (dónde se muestra)">
          <input className={inputClass} value={groupKey} onChange={(e) => setGroupKey(e.target.value)} placeholder="abundancia" />
        </Field>
        <Field label="Notas para la IA (opcional)">
          <textarea
            className={cn(inputClass, "min-h-24 py-2")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enfocado en personas que sienten culpa al recibir."
          />
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-[13px] font-semibold text-foreground/80">
          <input type="checkbox" checked={withCover} onChange={(e) => setWithCover(e.target.checked)} className="h-5 w-5" />
          Generar la portada con IA
        </label>
        <Field label="Diseño del tema en Visualízate">
          <div className="grid gap-2">
            {([
              ["musica", "Como \"Manifestando con Música\"", "Toma solo la forma de 3 pasos. La IA escribe todo nuevo sobre tu tema y crea una portada para cada paso."],
              ["audio", "Como \"Sanar al niño interior\" (solo audio)", "Toma solo la forma: página principal y sección de playlists, con textos y portadas nuevas de tu tema."],
              ["limpieza", "Como \"Limpieza espiritual\"", "Toma solo la forma de recetas: la IA crea portada, materiales y pasos de tu tema."],
            ] as const).map(([v, t, d]) => (
              <button key={v} type="button" onClick={() => setDesign(v)} className={cn("rounded-[12px] border p-3 text-left", design === v ? "border-2 border-[#7C5CFF] bg-[#7C5CFF]/5" : "border-border")}>
                <span className="block text-[14px] font-bold text-foreground">{t}</span>
                <span className="block text-[12.5px] text-muted-foreground">{d}</span>
              </button>
            ))}
          </div>
        </Field>
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#7C5CFF] px-4 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear tema con IA
        </button>
      </div>

      <TopicList categories={categories} loading={isLoading} onNote={onNote} />
    </div>
  );
}

type Cat = { id: string; title: string; group_key: string; cover_url: string | null; is_published: boolean | null; is_custom?: boolean | null; subtopics: number };

function TopicList({ categories, loading, onNote }: { categories: Cat[]; loading: boolean; onNote: Notify }) {
  const qc = useQueryClient();
  const update = useServerFn(adminUpdateCategory);
  const remove = useServerFn(adminDeleteCategory);
  const rebuild = useServerFn(adminRebuildTopicDesign);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Cat | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["studio-categories"] });

  async function run(id: string, fn: () => Promise<unknown>, ok: string) {
    setBusyId(id);
    try {
      await fn();
      onNote({ text: ok });
      refresh();
    } catch (e) {
      onNote({ text: ok === "Tema eliminado." ? "No pudimos eliminar el tema. Intenta de nuevo." : e instanceof Error ? e.message : "No pudimos guardar el cambio.", error: true });
    }
    setBusyId(null);
  }

  const shown = categories.filter((c) => c.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="rounded-[16px] border border-border bg-card p-5 lg:col-span-2">
      <h3 className="font-display text-[17px] font-bold text-foreground">Temas existentes ({categories.length})</h3>
      <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-border bg-background px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tema por nombre" className="min-h-11 w-full bg-transparent text-[14px] outline-none" />
      </div>
      {loading && <div className="mt-3 h-24 animate-pulse rounded-[12px] bg-muted" />}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <article key={c.id} className="overflow-hidden rounded-[14px] border border-border bg-muted/30">
            {c.is_custom && c.cover_url ? (
              <img src={c.cover_url} alt={c.title} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/10] w-full place-items-center bg-muted"><SubtopicIcon title={c.title} /></div>
            )}
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-bold leading-tight text-foreground">{c.title}</p>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", c.is_published ? "bg-[#3FBE8F]/20 text-[#1B6B4F]" : "bg-muted text-foreground/60")}>
                  {c.is_published ? "Visible" : "Oculto"}
                </span>
              </div>
              <p className="text-[11.5px] text-foreground/55">{c.group_key} · {c.subtopics} subtemas</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {busyId === c.id ? (
                  <span className="grid h-11 w-11 place-items-center"><Loader2 className="h-4 w-4 animate-spin" /></span>
                ) : (
                  <>
                    <IconAction label={c.is_published ? "Ocultar" : "Hacer visible"} onClick={() => run(c.id, () => update({ data: { id: c.id, isPublished: !c.is_published } }), c.is_published ? "Tema oculto." : "Tema visible en la app.")}>
                      {c.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </IconAction>
                    {c.is_custom && <IconAction label="Rehacer diseño propio con IA (textos y portadas de cada paso)" onClick={() => run(c.id, () => rebuild({ data: { id: c.id } }), "Listo: el tema tiene textos y portadas propias en cada paso.")}>
                      <Sparkles className="h-4 w-4" />
                    </IconAction>}
                    <IconAction label="Editar" onClick={() => setEdit(c)}><Pencil className="h-4 w-4" /></IconAction>
                    {c.is_custom && <IconAction label="Nueva portada con IA" onClick={() => run(c.id, () => update({ data: { id: c.id, regenerateCover: true } }), "Portada nueva generada.")}>
                      <RefreshCw className="h-4 w-4" />
                    </IconAction>}
                    <IconAction danger label="Eliminar" onClick={async () => { if (await confirmDeletion("Este tema y sus subtemas se eliminarán. No podrás recuperarlos.")) await run(c.id, () => remove({ data: { id: c.id } }), "Tema eliminado."); }}>
                      <Trash2 className="h-4 w-4" />
                    </IconAction>
                  </>
                )}
              </div>
              {edit?.id === c.id && (
                <EditTopic
                  cat={c}
                  others={categories.filter((o) => o.id !== c.id && o.cover_url)}
                  onCancel={() => setEdit(null)}
                  onSave={(patch) => run(c.id, async () => { await update({ data: { id: c.id, ...patch } }); setEdit(null); }, "Tema actualizado.")}
                />
              )}
            </div>
          </article>
        ))}
      </div>
      {!loading && shown.length === 0 && <p className="mt-3 text-[13px] text-foreground/60">No encontramos temas con ese nombre.</p>}
    </div>
  );
}

function EditTopic({ cat, others, onCancel, onSave }: {
  cat: Cat; others: Cat[]; onCancel: () => void;
  onSave: (p: { title?: string; coverUrl?: string; copyFromId?: string }) => void;
}) {
  const [title, setTitle] = useState(cat.title);
  const [cover, setCover] = useState(cat.cover_url ?? "");
  const [copy, setCopy] = useState("");
  return (
    <div className="mt-3 space-y-2 rounded-[12px] border border-border bg-card p-3">
      <Field label="Título"><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      {cat.is_custom && <Field label="Portada (enlace de imagen)"><input className={inputClass} value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://…" /></Field>}
      {cat.is_custom && <Field label="Usar el mismo diseño que otro tema">
        <select className={inputClass} value={copy} onChange={(e) => setCopy(e.target.value)}>
          <option value="">No copiar</option>
          {others.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
      </Field>}
      <div className="flex gap-2">
        <button onClick={onCancel} className="min-h-11 flex-1 rounded-[12px] border border-border text-[14px] font-semibold">Cancelar</button>
        <button
          onClick={() => onSave({ title: title.trim() !== cat.title ? title.trim() : undefined, coverUrl: cover !== (cat.cover_url ?? "") ? cover.trim() : undefined, copyFromId: copy || undefined })}
          className="min-h-11 flex-1 rounded-[12px] bg-[#7C5CFF] text-[14px] font-bold text-white"
        >
          <Copy className="mr-1 inline h-4 w-4" /> Guardar
        </button>
      </div>
    </div>
  );
}

function Subtopics({ onNote }: { onNote: Notify }) {
  const qc = useQueryClient();
  const create = useServerFn(adminCreateVisualizaSubtopic);
  const update = useServerFn(adminUpdateSubtopic);
  const { data: categories = [] } = useCategories();
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [audioOnly, setAudioOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const selected = categoryId || categories[0]?.id || "";

  const listSubs = useServerFn(adminListSubtopics);
  const removeSub = useServerFn(adminDeleteSubtopic);
  const regen = useServerFn(adminRegenerateSubtopic);
  const [working, setWorking] = useState<string | null>(null);
  const { data: subtopics = [] } = useQuery({
    queryKey: ["studio-subtopics", selected],
    enabled: !!selected,
    refetchInterval: 20_000,
    queryFn: () => listSubs({ data: { categoryId: selected } }),
  });

  async function act(id: string, fn: () => Promise<unknown>, ok: string) {
    setWorking(id);
    try {
      await fn();
      onNote({ text: ok });
      qc.invalidateQueries({ queryKey: ["studio-subtopics"] });
      qc.invalidateQueries({ queryKey: ["studio-categories"] });
    } catch (e) {
      onNote({ text: ok === "Subtema eliminado." ? "No pudimos eliminar el subtema. Intenta de nuevo." : e instanceof Error ? e.message : "No pudimos guardar.", error: true });
    }
    setWorking(null);
  }

  async function submit() {
    if (!selected) return onNote({ text: "Primero crea un tema principal.", error: true });
    if (title.trim().length < 3) return onNote({ text: "Escribe un título más largo.", error: true });
    setBusy(true);
    onNote(null);
    try {
      const result = await create({ data: { categoryId: selected, title: title.trim(), notes, audioOnly } });
      onNote({
        text: `Subtema creado como día ${result.dayIndex}, con lección, ejercicio, pasos, tareas, sopa de letras y preguntas. Sube el audio cuando quieras.`,
      });
      setTitle("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["studio-subtopics"] });
    } catch (e) {
      onNote({ text: e instanceof Error ? e.message : "No pudimos crear el subtema.", error: true });
    }
    setBusy(false);
  }

  async function saveAudio(id: string, audioUrl: string) {
    try {
      if (!validAudioAddress(audioUrl)) throw new Error("Pega un enlace completo que empiece con https://");
      await update({ data: { id, audioUrl, isPublished: audioUrl ? true : undefined } });
      onNote({ text: "Audio guardado. El subtema ya está visible." });
      qc.invalidateQueries({ queryKey: ["studio-subtopics"] });
      qc.invalidateQueries({ queryKey: ["cat-full"] });
      qc.invalidateQueries({ queryKey: ["day-audio"] });
    } catch (error) {
      onNote({ text: mediaError(error, "No pudimos guardar el audio."), error: true });
      throw error;
    }
  }

  async function togglePublish(id: string, isPublished: boolean) {
    try {
      await update({ data: { id, isPublished } });
      qc.invalidateQueries({ queryKey: ["studio-subtopics"] });
    } catch {
      onNote({ text: "No pudimos cambiar la visibilidad.", error: true });
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border border-border bg-card p-5 space-y-3">
        <h3 className="font-display text-[17px] font-bold text-foreground">
          <Wand2 className="mr-2 inline h-4 w-4 text-[#F58BCB]" />
          Crear subtema dentro de un tema
        </h3>
        <Field label="Tema principal">
          <select className={inputClass} value={selected} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} {c.is_published ? "" : "(oculto)"} · {c.subtopics} subtemas
              </option>
            ))}
          </select>
        </Field>
        <Field label="Título del subtema">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sanar la relación con el dinero" />
        </Field>
        <Field label="Notas para la IA (opcional)">
          <textarea className={cn(inputClass, "min-h-24 py-2")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <p className="text-sm text-muted-foreground">Ícono temático · sin generación de imágenes</p>
        <label className="flex min-h-11 items-start gap-2 text-[13px] font-semibold text-foreground/80">
          <input type="checkbox" checked={audioOnly} onChange={(e) => setAudioOnly(e.target.checked)} className="mt-0.5 h-5 w-5" />
          <span>Solo audio (como "Sanar tu niño interior"). Si no la marcas, la IA lo arma como subcategoría completa: lección, pasos, tareas, sopa de letras y preguntas.</span>
        </label>
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#7C5CFF] px-4 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear subtema con IA
        </button>
        <p className="text-[12px] leading-snug text-foreground/55">
          No importa el orden: la IA lo coloca en el siguiente día libre y escribe lección, ejercicio con pasos, tareas, sopa de letras, preguntas y afirmación. Tú subes el audio.
        </p>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-5">
        <h3 className="font-display text-[17px] font-bold text-foreground">Subtemas de este tema</h3>
        <ul className="mt-3 space-y-2">
          {subtopics.map((s) => (
            <li key={s.id} className="rounded-[12px] border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-3">
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-foreground/70">
                  Día {s.day_index}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-foreground">{s.title}</span>
                <button
                  onClick={() => togglePublish(s.id, !s.is_published)}
                  className={cn(
                    "min-h-11 shrink-0 rounded-full px-3 text-[11.5px] font-bold",
                    s.is_published ? "bg-[#3FBE8F]/20 text-[#1B6B4F]" : "bg-muted text-foreground/60",
                  )}
                >
                  {s.is_published ? "Visible" : "Oculto"}
                </button>
                {working === s.id ? (
                  <span className="grid h-11 w-11 place-items-center"><Loader2 className="h-4 w-4 animate-spin" /></span>
                ) : (
                  <>
                    <IconAction label="Rehacer todo con IA" onClick={() => act(s.id, () => regen({ data: { id: s.id, notes: "" } }), "La IA reescribió el contenido propio de este subtema, sin generar imágenes.")}>
                      <Wand2 className="h-4 w-4" />
                    </IconAction>
                    <IconAction danger label="Eliminar" onClick={async () => { if (await confirmDeletion("Este subtema se eliminará. No podrás recuperarlo.")) await act(s.id, () => removeSub({ data: { id: s.id } }), "Subtema eliminado."); }}>
                      <Trash2 className="h-4 w-4" />
                    </IconAction>
                  </>
                )}
              </div>
              <AudioInput current={s.audio_url} onSave={(url) => saveAudio(s.id, url)} onNote={onNote} />
            </li>
          ))}
          {subtopics.length === 0 && (
            <li className="rounded-[12px] border border-border bg-muted/40 p-4 text-[13px] text-foreground/60">
              Este tema todavía no tiene subtemas. Crea el primero arriba.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Limpieza({ onNote }: { onNote: Notify }) {
  const qc = useQueryClient();
  const create = useServerFn(adminCreateLimpieza);
  const list = useServerFn(adminListLimpieza);
  const toggle = useServerFn(adminToggleLimpieza);
  const updateL = useServerFn(adminUpdateLimpieza);
  const removeL = useServerFn(adminDeleteLimpieza);
  const [working, setWorking] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; title: string; notes: string } | null>(null);
  async function act(id: string, fn: () => Promise<unknown>, ok: string) {
    setWorking(id);
    try {
      await fn();
      onNote({ text: ok });
      qc.invalidateQueries({ queryKey: ["studio-limpieza"] });
    } catch (e) {
      onNote({ text: ok === "Práctica eliminada." ? "No pudimos eliminar la práctica. Intenta de nuevo." : e instanceof Error ? e.message : "No pudimos guardar.", error: true });
    }
    setWorking(null);
  }
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState(1);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: practices = [] } = useQuery({
    queryKey: ["studio-limpieza"],
    queryFn: () => list({}),
  });

  async function submit() {
    if (title.trim().length < 3) return onNote({ text: "Escribe un título más largo.", error: true });
    setBusy(true);
    onNote(null);
    try {
      await create({ data: { title: title.trim(), level, notes } });
      onNote({ text: "Práctica creada con ícono, materiales y pasos propios del tema." });
      setTitle("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["studio-limpieza"] });
    } catch (e) {
      onNote({ text: e instanceof Error ? e.message : "No pudimos crear la práctica.", error: true });
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-[16px] border border-border bg-card p-5 space-y-3">
        <h3 className="font-display text-[17px] font-bold text-foreground">Crear práctica de limpieza</h3>
        <Field label="Título">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Baño de paz" />
        </Field>
        <Field label="Nivel">
          <select className={inputClass} value={level} onChange={(e) => setLevel(Number(e.target.value))}>
            <option value={1} className="text-black">Nivel 1</option>
            <option value={2} className="text-black">Nivel 2</option>
            <option value={3} className="text-black">Nivel 3</option>
          </select>
        </Field>
        <Field label="Notas para la IA (opcional)">
          <textarea className={cn(inputClass, "min-h-24 py-2")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <SubtopicIcon title={title || "Limpieza Espiritual"} />
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#7C5CFF] px-4 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear práctica con IA
        </button>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-5">
        <h3 className="font-display text-[17px] font-bold text-foreground">Prácticas creadas</h3>
        <ul className="mt-3 space-y-2">
          {practices.map((p) => (
            <Fragment key={p.id}>
            <li className="flex items-center gap-3 rounded-[12px] border border-border bg-muted/40 p-3">
              <SubtopicIcon title={p.title} category="Limpieza Espiritual" className="h-12 w-12 text-2xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-foreground">{p.title}</span>
                <span className="block text-[11.5px] text-foreground/55">
                  Nivel {p.level} · {p.duration}
                </span>
              </span>
              <button
                onClick={async () => {
                  await toggle({ data: { id: p.id, isPublished: !p.is_published } });
                  qc.invalidateQueries({ queryKey: ["studio-limpieza"] });
                }}
                className={cn(
                  "min-h-11 shrink-0 rounded-full px-3 text-[11.5px] font-bold",
                  p.is_published ? "bg-[#3FBE8F]/20 text-[#1B6B4F]" : "bg-muted text-foreground/60",
                )}
              >
                {p.is_published ? "Visible" : "Oculta"}
              </button>
              {working === p.id ? (
                <span className="grid h-11 w-11 place-items-center"><Loader2 className="h-4 w-4 animate-spin" /></span>
              ) : (
                <>
                  <IconAction label="Editar" onClick={() => setEditing({ id: p.id, title: p.title, notes: "" })}><Pencil className="h-4 w-4" /></IconAction>
                  <IconAction danger label="Eliminar" onClick={async () => { if (await confirmDeletion("Esta práctica se eliminará. No podrás recuperarla.")) await act(p.id, () => removeL({ data: { id: p.id } }), "Práctica eliminada."); }}><Trash2 className="h-4 w-4" /></IconAction>
                </>
              )}
            </li>
            {editing?.id === p.id && (
              <li className="space-y-2 rounded-[12px] border border-border bg-card p-3">
                <Field label="Título"><input className={inputClass} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
                <Field label="Nota para la IA"><textarea className={cn(inputClass, "min-h-20 py-2")} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button className="min-h-11 rounded-[12px] border border-border text-[13px] font-semibold" onClick={() => { const e = editing; setEditing(null); act(p.id, () => updateL({ data: { id: p.id, title: e.title.trim() !== p.title ? e.title.trim() : undefined,  notes: e.notes } }), "Práctica guardada."); }}>Guardar cambios</button>
                  <button className="min-h-11 rounded-[12px] bg-[#7C5CFF] text-[13px] font-bold text-white" onClick={() => { const e = editing; setEditing(null); act(p.id, () => updateL({ data: { id: p.id, improve: true, notes: e.notes } }), "La IA mejoró la receta y los pasos."); }}><Wand2 className="mr-1 inline h-4 w-4" />Mejorar con IA</button>
                </div>
              </li>
            )}
            </Fragment>
          ))}
          {practices.length === 0 && (
            <li className="rounded-[12px] border border-border bg-muted/40 p-4 text-[13px] text-foreground/60">
              Todavía no hay prácticas creadas desde el panel.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

/** Upload and link import both require an explicit save and await persistence. */
function AudioInput({ current, onSave, onNote }: { current: string | null; onSave: (url: string) => Promise<void>; onNote: Notify }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState(current ?? "");
  async function saveLink() {
    setBusy(true);
    try { await onSave(url.trim()); } catch { /* onSave reports the error */ }
    finally { setBusy(false); }
  }
  async function upload(file: File) {
    if (file.size > 50 * 1024 * 1024) return onNote({ text: "El audio supera 50 MB.", error: true });
    if (!/audio|mpeg|mp3|m4a|wav/i.test(file.type + file.name)) return onNote({ text: "Elige un archivo de audio (mp3, m4a o wav).", error: true });
    setBusy(true);
    try {
      const path = `subtemas/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from("manifest-audios").upload(path, file, { contentType: file.type || "audio/mpeg" });
      if (up.error) throw up.error;
      const signed = await supabase.storage.from("manifest-audios").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed.error || !signed.data) throw new Error("No pudimos crear el enlace de reproducción.");
      await onSave(signed.data.signedUrl); setUrl(signed.data.signedUrl);
    } catch (e) { onNote({ text: mediaError(e, "No pudimos subir o guardar el audio. Intenta de nuevo."), error: true }); }
    finally { setBusy(false); }
  }
  return <div className="mt-2 space-y-2">
    <input aria-label="Enlace del audio" value={url} onChange={e => setUrl(e.target.value)} placeholder="MP3 directo o enlace compartido de Google Drive" maxLength={8000} className={inputClass} disabled={busy} />
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => void saveLink()} disabled={busy || url.trim() === (current ?? "")}><Upload className="h-4 w-4" />{busy ? "Guardando audio…" : "Guardar enlace"}</Button>
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[12px] bg-primary/10 px-3 text-sm font-semibold text-primary"><Upload className="h-4 w-4" />Subir MP3<input type="file" accept="audio/*,.mp3" className="hidden" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ""; }} /></label>
    </div>
    {current && <audio aria-label="Audio guardado" src={current} controls preload="metadata" className="h-11 w-full" />}
  </div>;
}
