import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Headphones, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Audio = {
  id: string;
  category_id: string;
  day_index: number;
  title: string;
  affirmation: string;
  audio_url: string | null;
  cover_url: string | null;
  duration_seconds: number | null;
  lesson: string | null;
  exercise: string | null;
  pdf_url: string | null;
};

type Cat = {
  id: string;
  title: string;
  subtitle: string | null;
  group_key: string;
  program_group: string;
  sort_order: number;
};

const BUCKET = "manifest-audios";

/** Nombre visible de cada grupo madre del panel. */
const GROUP_LABELS: Record<string, string> = {
  abundancia: "Manifiesta con Música (Abundancia)",
  limpieza: "Limpieza Espiritual",
  identidad: "Salto de Identidad",
  cristo: "Método de Cristo 3·6·9",
  "nino-interior": "Sanar a tu niño o niña interior",
  "glowup-mujer": "Glow Up: Mujer de alto valor",
  "glowup-hombre": "Glow Up: Hombre de alto valor",
  magnetico: "Vuélvete magnético o magnética",
  "permiso-mujer": "Deja de pedir permiso para existir (Mujer)",
  "permiso-hombre": "Deja de pedir permiso para existir (Hombre)",
};

const GROUP_ORDER = [
  "abundancia",
  "limpieza",
  "identidad",
  "cristo",
  "nino-interior",
  "glowup-mujer",
  "glowup-hombre",
  "magnetico",
  "permiso-mujer",
  "permiso-hombre",
];

const schema = z.object({
  category_id: z.string().trim().min(1, "Elige una práctica o playlist"),
  day_index: z.number().int().min(1, "El día empieza en 1").max(365),
  title: z.string().trim().min(3, "El título necesita al menos 3 letras").max(140),
  affirmation: z.string().trim().min(3, "Escribe la afirmación del audio").max(600),
  audio_url: z.string().trim().min(4, "Falta el MP3: sube el archivo o pega el enlace").max(800),
  cover_url: z.string().trim().max(800).optional().or(z.literal("")),
  lesson: z.string().trim().max(4000).optional().or(z.literal("")),
  exercise: z.string().trim().max(2000).optional().or(z.literal("")),
  pdf_url: z.string().trim().max(800).optional().or(z.literal("")),
});

const emptyForm = {
  category_id: "",
  day_index: 1,
  title: "",
  affirmation: "",
  audio_url: "",
  cover_url: "",
  lesson: "",
  exercise: "",
  pdf_url: "",
};

/** Alta, edición y baja de audios y prácticas de Visualízalo y Vívelo, organizadas por categoría y subcategoría. */
export function AudiosManager() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"audio" | "cover" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["abundancia"]));
  const [filter, setFilter] = useState<string>("");

  const { data: cats } = useQuery({
    queryKey: ["admin-manifest-cats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manifest_categories")
        .select("id, title, subtitle, group_key, program_group, sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Cat[];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["admin-manifest-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manifest_audios").select("category_id").limit(20000);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of data ?? []) map[r.category_id] = (map[r.category_id] ?? 0) + 1;
      return map;
    },
  });

  /** Categorías agrupadas: grupo madre → subcategorías reales de la app. */
  const groups = useMemo(() => {
    const byGroup = new Map<string, Cat[]>();
    for (const c of cats ?? []) {
      const key = c.group_key || c.program_group || "otros";
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push(c);
    }
    const keys = [...byGroup.keys()].sort(
      (a, b) => (GROUP_ORDER.indexOf(a) + 1 || 99) - (GROUP_ORDER.indexOf(b) + 1 || 99),
    );
    return keys.map((key) => ({
      key,
      label: GROUP_LABELS[key] ?? key,
      items: byGroup.get(key)!.sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [cats]);

  const { data: audios, isLoading } = useQuery({
    queryKey: ["admin-manifest-audios", filter],
    queryFn: async () => {
      let q = supabase
        .from("manifest_audios")
        .select(
          "id, category_id, day_index, title, affirmation, audio_url, cover_url, duration_seconds, lesson, exercise, pdf_url",
        )
        .order("day_index")
        .limit(400);
      if (filter) q = q.eq("category_id", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Audio[];
    },
  });

  async function upload(kind: "audio" | "cover", file: File) {
    const max = kind === "audio" ? 40 : 5;
    if (file.size > max * 1024 * 1024) {
      toast.error(`El archivo supera ${max} MB.`);
      return;
    }
    setUploading(kind);
    const ext =
      file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (kind === "audio" ? "mp3" : "jpg");
    const path = `${kind}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
    setUploading(null);
    if (error) {
      toast.error("No pudimos subir el archivo. Revisa tu conexión.");
      return;
    }
    setForm((f) => ({ ...f, [kind === "audio" ? "audio_url" : "cover_url"]: path }));
    toast.success(kind === "audio" ? "MP3 subido" : "Portada subida");
  }

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const d = parsed.data;
      const row = {
        category_id: d.category_id,
        day_index: d.day_index,
        title: d.title,
        affirmation: d.affirmation,
        audio_url: d.audio_url,
        cover_url: d.cover_url || null,
        lesson: d.lesson || null,
        exercise: d.exercise || null,
        pdf_url: d.pdf_url || null,
      };
      const res = editing
        ? await supabase.from("manifest_audios").update(row).eq("id", editing)
        : await supabase.from("manifest_audios").insert(row);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(editing ? "Práctica actualizada" : "Práctica publicada");
      setEditing(null);
      setOpen(false);
      setForm({ ...emptyForm, category_id: form.category_id, day_index: form.day_index + 1 });
      void qc.invalidateQueries({ queryKey: ["admin-manifest-audios"] });
      void qc.invalidateQueries({ queryKey: ["admin-manifest-counts"] });
      void qc.invalidateQueries({ queryKey: ["sonidos_home"] });
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos guardar la práctica"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("manifest_audios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Práctica eliminada");
      void qc.invalidateQueries({ queryKey: ["admin-manifest-audios"] });
      void qc.invalidateQueries({ queryKey: ["admin-manifest-counts"] });
      void qc.invalidateQueries({ queryKey: ["sonidos_home"] });
    },
    onError: () => toast.error("No pudimos eliminar la práctica"),
  });

  function startEdit(a: Audio) {
    setEditing(a.id);
    setForm({
      category_id: a.category_id,
      day_index: a.day_index,
      title: a.title,
      affirmation: a.affirmation,
      audio_url: a.audio_url ?? "",
      cover_url: a.cover_url ?? "",
      lesson: a.lesson ?? "",
      exercise: a.exercise ?? "",
      pdf_url: a.pdf_url ?? "",
    });
    setOpen(true);
  }

  function toggleGroup(key: string) {
    setOpenGroups((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const activeCat = (cats ?? []).find((c) => c.id === filter);

  return (
    <section className="mt-4 rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 font-display text-[17px] font-bold">
          <Headphones className="h-4.5 w-4.5 text-primary" /> Música, prácticas y programas
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            setForm((f) => ({ ...f, category_id: filter || f.category_id }));
            setOpen((v) => !v);
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-[12px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
        >
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {open ? "Cerrar" : "Agregar"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Árbol de categorías y subcategorías */}
        <nav className="rounded-[12px] border border-border/60 bg-background p-2">
          <button
            onClick={() => setFilter("")}
            className={cn(
              "mb-1 block w-full rounded-[10px] px-3 py-2 text-left text-[13px] font-semibold",
              filter === "" ? "bg-primary/10 text-primary" : "text-muted-foreground",
            )}
          >
            Todo el contenido
          </button>
          {groups.map((g) => {
            const isOpen = openGroups.has(g.key);
            return (
              <div key={g.key} className="mb-1">
                <button
                  onClick={() => toggleGroup(g.key)}
                  className="flex w-full items-center gap-1.5 rounded-[10px] px-2 py-2 text-left text-[12.5px] font-bold"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{g.label}</span>
                  <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{g.items.length}</span>
                </button>
                {isOpen && (
                  <ul className="ml-4 space-y-0.5 border-l border-border pl-2">
                    {g.items.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => setFilter(c.id)}
                          className={cn(
                            "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[12.5px]",
                            filter === c.id ? "bg-primary/10 font-bold text-primary" : "text-foreground",
                          )}
                        >
                          <span className="truncate">{c.title}</span>
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {counts?.[c.id] ?? 0}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-muted-foreground">
            {activeCat ? `${activeCat.title} · ${activeCat.subtitle ?? ""}` : "Todas las categorías y subcategorías"}
          </p>

          {open && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
              className="mt-3 grid gap-3 rounded-[12px] border border-border/60 bg-background p-4 sm:grid-cols-2"
            >
              <Field label="Categoría / subcategoría">
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Elige dónde aparecerá</option>
                  {groups.map((g) => (
                    <optgroup key={g.key} label={g.label}>
                      {g.items.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label="Día / nivel">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.day_index}
                  onChange={(e) => setForm({ ...form, day_index: Number(e.target.value) })}
                  className={inputCls}
                />
              </Field>
              <Field label="Título">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputCls}
                  maxLength={140}
                />
              </Field>
              <Field label="Afirmación">
                <input
                  value={form.affirmation}
                  onChange={(e) => setForm({ ...form, affirmation: e.target.value })}
                  className={inputCls}
                  maxLength={600}
                />
              </Field>

              <Field label="MP3 (enlace o archivo subido)">
                <input
                  value={form.audio_url}
                  onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
                  placeholder="https://… o sube el archivo"
                  className={inputCls}
                  maxLength={800}
                />
                <span className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-primary/10 text-[13px] font-semibold text-primary">
                  {uploading === "audio" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Subir MP3
                  <input
                    type="file"
                    accept="audio/mpeg,audio/mp3,audio/wav,audio/m4a"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload("audio", f);
                    }}
                  />
                </span>
              </Field>

              <Field label="Portada (enlace o archivo)">
                <input
                  value={form.cover_url}
                  onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                  placeholder="https://… o sube la imagen"
                  className={inputCls}
                  maxLength={800}
                />
                <span className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-primary/10 text-[13px] font-semibold text-primary">
                  {uploading === "cover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Subir portada
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload("cover", f);
                    }}
                  />
                </span>
              </Field>

              <Field label="Lección / contenido del día">
                <textarea
                  value={form.lesson}
                  onChange={(e) => setForm({ ...form, lesson: e.target.value })}
                  rows={4}
                  maxLength={4000}
                  className="w-full rounded-[10px] border-[1.5px] border-border bg-card p-3 text-[14px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                />
              </Field>
              <Field label="Ejercicio / receta">
                <textarea
                  value={form.exercise}
                  onChange={(e) => setForm({ ...form, exercise: e.target.value })}
                  rows={4}
                  maxLength={2000}
                  className="w-full rounded-[10px] border-[1.5px] border-border bg-card p-3 text-[14px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                />
              </Field>

              <Field label="PDF de apoyo (enlace)">
                <input
                  value={form.pdf_url}
                  onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
                  placeholder="https://…"
                  className={inputCls}
                  maxLength={800}
                />
              </Field>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={save.isPending || uploading !== null}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-60"
                >
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Guardar cambios" : "Publicar"}
                </button>
              </div>
            </form>
          )}

          {isLoading && <div className="mt-4 h-20 animate-pulse rounded-[12px] bg-muted" />}

          {!isLoading && (audios?.length ?? 0) === 0 && (
            <p className="mt-4 rounded-[12px] border border-dashed border-border p-6 text-center text-[13px] text-muted-foreground">
              Esta práctica todavía no tiene días publicados. Agrega el día 1 para que tus usuarios puedan empezar.
            </p>
          )}

          <ul className="mt-4 space-y-2">
            {(audios ?? []).map((a) => (
              <li
                key={a.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] border border-border/60 p-2.5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-[12px] font-bold text-primary">
                  {a.day_index}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold leading-tight">{a.title}</p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {cats?.find((c) => c.id === a.category_id)?.title ?? a.category_id} ·{" "}
                    {a.audio_url ? "con MP3" : "sin audio"}
                    {a.pdf_url ? " · con PDF" : ""}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => startEdit(a)}
                    aria-label={`Editar ${a.title}`}
                    className="grid h-11 w-11 place-items-center rounded-[10px] bg-primary/10 text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar "${a.title}"?`)) remove.mutate(a.id);
                    }}
                    aria-label={`Eliminar ${a.title}`}
                    className="grid h-11 w-11 place-items-center rounded-[10px] bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const inputCls =
  "h-12 w-full rounded-[10px] border-[1.5px] border-border bg-card px-3 text-[14px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
