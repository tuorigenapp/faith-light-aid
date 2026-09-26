import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCreateLimpieza,
  adminCreateVisualizaCategory,
  adminCreateVisualizaSubtopic,
  adminListLimpieza,
  adminToggleLimpieza,
  adminUpdateSubtopic,
} from "@/lib/content-admin.functions";
import { Loader2, Plus, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "temas" | "subtemas" | "limpieza";

const TABS: { id: Tab; label: string }[] = [
  { id: "temas", label: "Temas principales" },
  { id: "subtemas", label: "Subtemas" },
  { id: "limpieza", label: "Limpieza espiritual" },
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
                ? "border-[#7C5CFF] bg-[#7C5CFF]/15 text-foreground"
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
              : "border-[#3FBE8F]/40 bg-[#3FBE8F]/10 text-[#8FE3C4]",
          )}
        >
          {note.text}
        </p>
      )}

      {tab === "temas" && <MainTopics onNote={setNote} />}
      {tab === "subtemas" && <Subtopics onNote={setNote} />}
      {tab === "limpieza" && <Limpieza onNote={setNote} />}
    </div>
  );
}

type Notify = (n: { text: string; error?: boolean } | null) => void;

function useCategories() {
  return useQuery({
    queryKey: ["studio-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("manifest_categories")
        .select("id, title, group_key, required_plan, cover_url, is_published, sort_order")
        .order("sort_order");
      return data ?? [];
    },
  });
}

function MainTopics({ onNote }: { onNote: Notify }) {
  const qc = useQueryClient();
  const create = useServerFn(adminCreateVisualizaCategory);
  const { data: categories = [], isLoading } = useCategories();
  const [title, setTitle] = useState("");
  const [groupKey, setGroupKey] = useState("abundancia");
  const [notes, setNotes] = useState("");
  const [withCover, setWithCover] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (title.trim().length < 3) return onNote({ text: "Escribe un título más largo.", error: true });
    setBusy(true);
    onNote(null);
    try {
      const result = await create({
        data: { title: title.trim(), groupKey, notes, withCover, programGroup: "visualiza", requiredPlan: "camino" },
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
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#7C5CFF] px-4 text-[15px] font-bold text-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear tema con IA
        </button>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-5">
        <h3 className="font-display text-[17px] font-bold text-foreground">Temas existentes</h3>
        {isLoading && <div className="mt-3 h-24 animate-pulse rounded-[12px] bg-muted" />}
        <ul className="mt-3 space-y-2">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-[12px] border border-border bg-muted/40 p-3">
              {c.cover_url ? (
                <img src={c.cover_url} alt="" className="h-12 w-12 shrink-0 rounded-[10px] object-cover" />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-muted text-foreground/50">
                  <Sparkles className="h-4 w-4" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-foreground">{c.title}</span>
                <span className="block text-[11.5px] text-foreground/55">{c.group_key}</span>
              </span>
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", c.is_published ? "bg-[#3FBE8F]/20 text-[#8FE3C4]" : "bg-muted text-foreground/60")}>
                {c.is_published ? "Visible" : "Oculto"}
              </span>
            </li>
          ))}
        </ul>
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
  const [withCover, setWithCover] = useState(true);
  const [busy, setBusy] = useState(false);
  const selected = categoryId || categories[0]?.id || "";

  const { data: subtopics = [] } = useQuery({
    queryKey: ["studio-subtopics", selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data } = await supabase
        .from("manifest_audios")
        .select("id, day_index, title, audio_url, pdf_url, is_published")
        .eq("category_id", selected)
        .order("day_index");
      return data ?? [];
    },
  });

  async function submit() {
    if (!selected) return onNote({ text: "Primero crea un tema principal.", error: true });
    if (title.trim().length < 3) return onNote({ text: "Escribe un título más largo.", error: true });
    setBusy(true);
    onNote(null);
    try {
      const result = await create({ data: { categoryId: selected, title: title.trim(), notes, withCover } });
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
      await update({ data: { id, audioUrl } });
      onNote({ text: "Audio guardado." });
      qc.invalidateQueries({ queryKey: ["studio-subtopics"] });
    } catch {
      onNote({ text: "No pudimos guardar el audio.", error: true });
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
              <option key={c.id} value={c.id} className="text-black">
                {c.title}
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
        <label className="flex min-h-11 items-center gap-2 text-[13px] font-semibold text-foreground/80">
          <input type="checkbox" checked={withCover} onChange={(e) => setWithCover(e.target.checked)} className="h-5 w-5" />
          Generar la portada con IA
        </label>
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#7C5CFF] px-4 text-[15px] font-bold text-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear subtema con IA
        </button>
        <p className="text-[12px] leading-snug text-foreground/55">
          La IA lo coloca en el siguiente día libre y escribe lección, ejercicio con pasos, tareas, sopa de letras, preguntas y afirmación. Tú subes el audio.
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
                    s.is_published ? "bg-[#3FBE8F]/20 text-[#8FE3C4]" : "bg-muted text-foreground/60",
                  )}
                >
                  {s.is_published ? "Visible" : "Oculto"}
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  defaultValue={s.audio_url ?? ""}
                  onBlur={(e) => {
                    if (e.target.value !== (s.audio_url ?? "")) saveAudio(s.id, e.target.value.trim());
                  }}
                  placeholder="Enlace del audio (mp3)"
                  className={inputClass}
                />
              </div>
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
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState(1);
  const [notes, setNotes] = useState("");
  const [withCover, setWithCover] = useState(true);
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
      await create({ data: { title: title.trim(), level, notes, withCover } });
      onNote({ text: "Práctica creada con portada, materiales y pasos. Ya se ve en la app." });
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
        <label className="flex min-h-11 items-center gap-2 text-[13px] font-semibold text-foreground/80">
          <input type="checkbox" checked={withCover} onChange={(e) => setWithCover(e.target.checked)} className="h-5 w-5" />
          Generar la portada con IA
        </label>
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#7C5CFF] px-4 text-[15px] font-bold text-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear práctica con IA
        </button>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-5">
        <h3 className="font-display text-[17px] font-bold text-foreground">Prácticas creadas</h3>
        <ul className="mt-3 space-y-2">
          {practices.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-[12px] border border-border bg-muted/40 p-3">
              {p.cover_url && <img src={p.cover_url} alt="" className="h-12 w-12 shrink-0 rounded-[10px] object-cover" />}
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
                  p.is_published ? "bg-[#3FBE8F]/20 text-[#8FE3C4]" : "bg-muted text-foreground/60",
                )}
              >
                {p.is_published ? "Visible" : "Oculta"}
              </button>
            </li>
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
