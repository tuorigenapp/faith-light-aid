import { useServerFn } from "@tanstack/react-start";
import { adminImportAudio } from "@/lib/audio-import.functions";
import { googleDriveFileId } from "@/lib/media-input";
import { SubtopicIcon } from "@/components/visualiza/SubtopicIcon";
import { Button } from "@/components/ui/button";
import { directAudioUrl, mediaError, validAudioAddress } from "@/lib/media-input";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { confirmDeletion } from "@/lib/deletion-confirmation";

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
  quiz: unknown;
  word_game: unknown;
};

type Cat = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  group_key: string;
  program_group: string;
  required_plan: string;
  sort_order: number;
};

const AUDIO_BUCKET = "manifest-audios";
const COVERS_BUCKET = "content-covers";

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

const PLAN_OPTIONS = [
  { value: "free", label: "Gratis" },
  { value: "premium", label: "Premium" },
  { value: "vip", label: "VIP" },
];

const schema = z.object({
  category_id: z.string().trim().min(1, "Elige una práctica o playlist"),
  day_index: z.number().int().min(1, "El día empieza en 1").max(365),
  title: z.string().trim().min(3, "El título necesita al menos 3 letras").max(140),
  affirmation: z.string().trim().max(600),
  audio_url: z.string().trim().max(8000).transform((v) => directAudioUrl(v)).refine(validAudioAddress, "Pega un enlace completo que empiece con https://"),
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
  quiz: {} as { tasks?: string[]; recipe_steps?: string[]; materials?: string[]; questions?: { question: string; options: string[]; correctIndex: number; explanation: string }[] },
  word_game: {} as { words?: string[] },
};

const catSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2, "El slug necesita al menos 2 letras")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Usa solo minúsculas, números y guiones"),
  title: z.string().trim().min(3, "El título necesita al menos 3 letras").max(140),
  subtitle: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  cover_url: z.string().trim().max(800).optional().or(z.literal("")),
  required_plan: z.string().trim().min(1),
  sort_order: z.number().int().min(0).max(9999),
});

const emptyCatForm = {
  id: "",
  title: "",
  subtitle: "",
  description: "",
  cover_url: "",
  required_plan: "free",
  sort_order: 0,
};

/** Convierte un título en un slug simple para usar como id de subcategoría. */
function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Alta, edición y baja de audios y prácticas de Visualízalo y Vívelo, organizadas por categoría y subcategoría. */
export function AudiosManager() {
  const qc = useQueryClient();
  const importAudio = useServerFn(adminImportAudio);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"audio" | "cover" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [generating, setGenerating] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["abundancia"]));
  const [filter, setFilter] = useState<string>("");
  const [selectedRoot, setSelectedRoot] = useState<string>("");

  const [catOpen, setCatOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<string | null>(null);
  const [catUploading, setCatUploading] = useState(false);
  const [catForm, setCatForm] = useState(emptyCatForm);

  const { data: cats, isLoading: catsLoading, isError: catsError } = useQuery({
    queryKey: ["admin-manifest-cats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manifest_categories")
        .select(
          "id, title, subtitle, description, cover_url, group_key, program_group, required_plan, sort_order",
        )
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

  const { data: audios, isLoading, isError: audiosError } = useQuery({
    queryKey: ["admin-manifest-audios", filter],
    queryFn: async () => {
      let q = supabase
        .from("manifest_audios")
        .select(
          "id, category_id, day_index, title, affirmation, audio_url, cover_url, duration_seconds, lesson, exercise, pdf_url, quiz, word_game",
        )
        .order("day_index")
        .limit(400);
      if (filter) q = q.eq("category_id", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Audio[];
    },
  });

  async function uploadFile(kind: "audio" | "cover", file: File): Promise<string | null> {
    const isAudio = kind === "audio";
    const max = isAudio ? 50 : 5;
    if (file.size > max * 1024 * 1024) {
      toast.error(`El archivo supera ${max} MB.`);
      return null;
    }
    if (isAudio && !file.type.startsWith("audio/") && !/\.(mp3|m4a|wav|aac|ogg)$/i.test(file.name)) {
      toast.error("Elige un archivo de audio válido (MP3, WAV, M4A).");
      return null;
    }
    if (!isAudio && !file.type.startsWith("image/")) {
      toast.error("Elige una imagen válida (PNG, JPG o WEBP).");
      return null;
    }
    const bucket = isAudio ? AUDIO_BUCKET : COVERS_BUCKET;
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (isAudio ? "mp3" : "jpg");
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
      contentType: file.type || (isAudio ? "audio/mpeg" : "image/jpeg"),
    });
    if (error) {
      toast.error(`No pudimos subir el archivo: ${error.message}`);
      return null;
    }
    const signed = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signed.error || !signed.data) { toast.error("Se subió, pero no pudimos crear el enlace de reproducción."); return null; }
    return signed.data.signedUrl;
  }

  async function upload(kind: "audio" | "cover", file: File) {
    setUploading(kind);
    try {
      const url = await uploadFile(kind, file);
      if (!url) return;
      setForm((f) => ({ ...f, [kind === "audio" ? "audio_url" : "cover_url"]: url }));
      toast.success(kind === "audio" ? "MP3 cargado. Pulsa Publicar o Guardar cambios para añadirlo a la playlist." : "Portada cargada. Guarda los cambios para publicarla.");
    } catch (error) { toast.error(mediaError(error, "No pudimos cargar el archivo. Intenta de nuevo.")); }
    finally { setUploading(null); }
  }

  async function uploadCatCover(file: File) {
    setCatUploading(true);
    try {
      const url = await uploadFile("cover", file);
      if (!url) return;
      setCatForm((f) => ({ ...f, cover_url: url }));
      toast.success("Portada cargada. Guarda los cambios.");
    } catch (error) { toast.error(mediaError(error, "No pudimos cargar la portada.")); }
    finally { setCatUploading(false); }
  }

  async function generateContent(current: typeof emptyForm) {
    const { data: session } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/generate-manifest", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token ?? ""}` }, body: JSON.stringify({ title: current.title, category: cats?.find(c => c.id === current.category_id)?.title ?? current.category_id, categoryId: current.category_id, audioId: editing, day: current.day_index, context: [current.affirmation, current.lesson, current.exercise].filter(Boolean).join("\n").slice(0, 2000) }) });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error ?? "No pudimos generar el contenido");
    return result as Pick<typeof emptyForm, "affirmation" | "lesson" | "exercise" | "quiz" | "word_game">;
  }

  const save = useMutation({
    mutationFn: async () => {
      let current = form;
      const initial = schema.safeParse(current);
      if (!initial.success) throw new Error(initial.error.issues[0]?.message ?? "Revisa los datos de la práctica.");
      if (autoGenerate && (!form.affirmation || !form.lesson || !form.exercise)) {
        setGenerating(true);
        try { current = { ...form, ...await generateContent(form) }; setForm(current); }
        catch (error) { toast.warning(`El audio se guardará sin completar la lección: ${mediaError(error, "No pudimos generar el contenido.")}`); }
        finally { setGenerating(false); }
      }
      const parsed = schema.safeParse(current);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revisa la práctica.");
      const d = parsed.data;
      const audioUrl = googleDriveFileId(d.audio_url) ? (await importAudio({ data: { url: d.audio_url } })).url : d.audio_url;
      const row = {
        category_id: d.category_id,
        day_index: d.day_index,
        title: d.title,
        affirmation: d.affirmation,
        audio_url: audioUrl || null,
        cover_url: null,
        lesson: d.lesson || null,
        exercise: d.exercise || null,
        pdf_url: d.pdf_url || null,
        quiz: current.quiz,
        word_game: current.word_game,
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
      void qc.invalidateQueries({ queryKey: ["cat-full"] });
      void qc.invalidateQueries({ queryKey: ["day-audio"] });
      void qc.invalidateQueries({ queryKey: ["studio-subtopics"] });
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

  const saveCat = useMutation({
    mutationFn: async () => {
      const parsed = catSchema.safeParse(catForm);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const d = parsed.data;
      if (catEditing) {
        const { error } = await supabase
          .from("manifest_categories")
          .update({
            title: d.title,
            subtitle: d.subtitle || null,
            description: d.description || null,
            cover_url: null,
            required_plan: d.required_plan,
            sort_order: d.sort_order,
          })
          .eq("id", catEditing);
        if (error) throw error;
      } else {
        if (!selectedRoot) throw new Error("Elige primero la categoría principal");
        const { error } = await supabase.from("manifest_categories").insert({
          id: d.id,
          title: d.title,
          subtitle: d.subtitle || null,
          description: d.description || null,
          cover_url: null,
          required_plan: d.required_plan,
          sort_order: d.sort_order,
          group_key: selectedRoot,
          program_group: selectedRoot,
          affirmation_ya_tengo: "",
          identity_yo_soy: "",
          gratitude_gracias: "",
          petition: "",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(catEditing ? "Subcategoría actualizada" : "Subcategoría creada");
      setCatOpen(false);
      setCatEditing(null);
      setCatForm(emptyCatForm);
      void qc.invalidateQueries({ queryKey: ["admin-manifest-cats"] });
      void qc.invalidateQueries({ queryKey: ["sonidos_home"] });
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos guardar la subcategoría"),
  });

  const removeCat = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("manifest_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subcategoría eliminada");
      if (filter === catEditing) setFilter("");
      void qc.invalidateQueries({ queryKey: ["admin-manifest-cats"] });
      void qc.invalidateQueries({ queryKey: ["admin-manifest-audios"] });
      void qc.invalidateQueries({ queryKey: ["sonidos_home"] });
    },
    onError: () =>
      toast.error("No pudimos eliminar la subcategoría. Borra primero sus audios."),
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
      quiz: (a.quiz as typeof emptyForm.quiz) ?? {},
      word_game: (a.word_game as typeof emptyForm.word_game) ?? {},
    });
    setOpen(true);
  }

  function startCreateCat(rootKey: string) {
    setSelectedRoot(rootKey);
    setCatEditing(null);
    setCatForm(emptyCatForm);
    setCatOpen(true);
  }

  function startEditCat(c: Cat) {
    setSelectedRoot(c.group_key);
    setCatEditing(c.id);
    setCatForm({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle ?? "",
      description: c.description ?? "",
      cover_url: c.cover_url ?? "",
      required_plan: c.required_plan ?? "free",
      sort_order: c.sort_order ?? 0,
    });
    setCatOpen(true);
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
            setCatOpen(false);
            setOpen((v) => !v);
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-[12px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
        >
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {open ? "Cerrar" : "Agregar audio"}
        </button>
      </div>

      {catsLoading && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="h-64 animate-pulse rounded-[12px] bg-muted" />
          <div className="h-64 animate-pulse rounded-[12px] bg-muted" />
        </div>
      )}

      {!catsLoading && catsError && (
        <p className="mt-4 rounded-[12px] border border-dashed border-destructive/40 bg-destructive/5 p-6 text-center text-[13px] text-destructive">
          No pudimos cargar las categorías. Revisa tu conexión e intenta de nuevo.
        </p>
      )}

      {!catsLoading && !catsError && (
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
              const isRootSelected = selectedRoot === g.key && filter === "";
              return (
                <div key={g.key} className="mb-1">
                  <div
                    className={cn(
                      "flex w-full items-center gap-1.5 rounded-[10px] px-2 py-2",
                      isRootSelected && "bg-primary/5",
                    )}
                  >
                    <button
                      onClick={() => toggleGroup(g.key)}
                      className="flex flex-1 items-center gap-1.5 text-left text-[12.5px] font-bold"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="min-w-0 flex-1 truncate">{g.label}</span>
                      <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                        {g.items.length}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRoot(g.key);
                        setOpenGroups((s) => new Set(s).add(g.key));
                        startCreateCat(g.key);
                      }}
                      aria-label={`Nueva subcategoría en ${g.label}`}
                      title="Nueva subcategoría"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-primary/10 text-primary"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {isOpen && (
                    <ul className="ml-4 space-y-0.5 border-l border-border pl-2">
                      {g.items.map((c) => (
                        <li key={c.id}>
                          <div
                            className={cn(
                              "grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 rounded-[10px] px-1 py-1",
                              filter === c.id && "bg-primary/10",
                            )}
                          >
                            <button
                              onClick={() => setFilter(c.id)}
                              className={cn(
                                "min-w-0 truncate rounded-[10px] px-1.5 py-1 text-left text-[12.5px]",
                                filter === c.id ? "font-bold text-primary" : "text-foreground",
                              )}
                            >
                              {c.title}
                            </button>
                            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                              {counts?.[c.id] ?? 0}
                            </span>
                            <button
                              onClick={() => startEditCat(c)}
                              aria-label={`Editar ${c.title}`}
                              className="grid h-6 w-6 shrink-0 place-items-center rounded-[8px] text-muted-foreground hover:text-primary"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        </li>
                      ))}
                      {g.items.length === 0 && (
                        <li className="px-1.5 py-1 text-[11.5px] text-muted-foreground">
                          Sin subcategorías todavía.
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="min-w-0">
            {activeCat && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-[12px] border border-border/60 bg-background p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <SubtopicIcon title={activeCat.title} category={GROUP_LABELS[activeCat.group_key]} className="h-11 w-11 text-2xl" />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold leading-tight">{activeCat.title}</p>
                    <p className="truncate text-[11.5px] text-muted-foreground">
                      {activeCat.subtitle || "Sin subtítulo"} · plan {activeCat.required_plan}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => startEditCat(activeCat)}
                    aria-label="Editar subcategoría"
                    className="grid h-10 w-10 place-items-center rounded-[10px] bg-primary/10 text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirmDeletion("Esta subcategoría y todos sus audios se eliminarán. No podrás recuperarlos."))
                        removeCat.mutate(activeCat.id);
                    }}
                    aria-label="Eliminar subcategoría"
                    className="grid h-10 w-10 place-items-center rounded-[10px] bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <p className="text-[12px] font-semibold text-muted-foreground">
              {activeCat ? `${activeCat.title} · ${activeCat.subtitle ?? ""}` : "Todas las categorías y subcategorías"}
            </p>

            {catOpen && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveCat.mutate();
                }}
                className="mt-3 grid gap-3 rounded-[12px] border border-primary/30 bg-primary/5 p-4 sm:grid-cols-2"
              >
                <p className="text-[12.5px] font-bold text-primary sm:col-span-2">
                  {catEditing
                    ? "Editar subcategoría"
                    : `Nueva subcategoría en ${GROUP_LABELS[selectedRoot] ?? selectedRoot}`}
                </p>
                {!catEditing && (
                  <Field label="Slug / id único">
                    <input
                      value={catForm.id}
                      onChange={(e) => setCatForm({ ...catForm, id: slugify(e.target.value) })}
                      placeholder="mi-nueva-subcategoria"
                      className={inputCls}
                      maxLength={60}
                    />
                  </Field>
                )}
                <Field label="Título">
                  <input
                    value={catForm.title}
                    onChange={(e) =>
                      setCatForm((f) => ({
                        ...f,
                        title: e.target.value,
                        id: catEditing ? f.id : f.id || slugify(e.target.value),
                      }))
                    }
                    className={inputCls}
                    maxLength={140}
                  />
                </Field>
                <Field label="Subtítulo">
                  <input
                    value={catForm.subtitle}
                    onChange={(e) => setCatForm({ ...catForm, subtitle: e.target.value })}
                    className={inputCls}
                    maxLength={200}
                  />
                </Field>
                <Field label="Plan requerido">
                  <select
                    value={catForm.required_plan}
                    onChange={(e) => setCatForm({ ...catForm, required_plan: e.target.value })}
                    className={inputCls}
                  >
                    {PLAN_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Orden">
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={catForm.sort_order}
                    onChange={(e) => setCatForm({ ...catForm, sort_order: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Descripción">
                  <textarea
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    rows={3}
                    maxLength={2000}
                    className="w-full rounded-[10px] border-[1.5px] border-border bg-card p-3 text-[14px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                  />
                </Field>
                <div className="flex items-center gap-3">
                  <SubtopicIcon title={catForm.title} category={GROUP_LABELS[selectedRoot]} />
                  <p className="text-sm text-muted-foreground">{catForm.title || "Subcategoría"}</p>
                </div>

                <div className="flex gap-2 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={saveCat.isPending || catUploading}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-60"
                  >
                    {saveCat.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {catEditing ? "Guardar cambios" : "Crear subcategoría"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCatOpen(false);
                      setCatEditing(null);
                      setCatForm(emptyCatForm);
                    }}
                    className="inline-flex h-12 items-center justify-center rounded-[12px] border border-border px-4 text-[14px] font-semibold text-muted-foreground"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

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

                <Field label="MP3 opcional (enlace o archivo subido)">
                  <input
                    value={form.audio_url}
                    onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
                    onBlur={(e) => { if (!googleDriveFileId(e.target.value)) setForm(f => ({ ...f, audio_url: directAudioUrl(e.target.value) })); }}
                    placeholder="https://… o sube el archivo"
                    className={inputCls}
                    maxLength={8000}
                  />
                  <label className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-primary/10 text-[13px] font-semibold text-primary">
                    {uploading === "audio" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Subir MP3
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/*"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void upload("audio", f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </Field>

                <div className="sm:col-span-2 rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm">
                  {googleDriveFileId(form.audio_url) && <Button type="button" disabled={uploading === "audio"} className="mb-3 w-full" onClick={async () => { setUploading("audio"); try { const result = await importAudio({ data: { url: form.audio_url } }); setForm(f => ({ ...f, audio_url: result.url })); toast.success("Audio de Drive copiado. Puedes escucharlo y publicarlo."); } catch (e) { toast.error(mediaError(e, "No pudimos importar el audio de Drive.")); } finally { setUploading(null); } }}>{uploading === "audio" ? "Importando audio de Drive…" : "Importar y probar enlace de Drive"}</Button>}
                  {form.audio_url && !googleDriveFileId(form.audio_url) && <audio aria-label="Probar audio antes de guardar" controls preload="metadata" src={directAudioUrl(form.audio_url)} className="mb-3 h-11 w-full" onError={() => toast.error("Este enlace no se puede reproducir. Usa un MP3 directo o sube el archivo.")} />}
                  <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={autoGenerate} onChange={e => setAutoGenerate(e.target.checked)} /> Completar con IA los campos vacíos al guardar</label>
                  <p className="mt-1 text-muted-foreground">Puedes publicar sin audio. La IA usa el título, categoría, día y texto que escribas; revisa el contenido antes de publicarlo.</p>
                  <button type="button" disabled={generating || !form.title.trim()} className="mt-3 rounded-xl bg-primary px-4 py-2 text-white disabled:opacity-50" onClick={async () => { setGenerating(true); try { const content = await generateContent(form); setForm(f => ({ ...f, ...content })); toast.success("Contenido listo para revisar"); } catch (e) { toast.error((e as Error).message); } finally { setGenerating(false); } }}>{generating ? "Generando…" : "Generar contenido ahora"}</button>
                </div>

                <div className="flex items-center gap-3"><SubtopicIcon title={form.title} category={cats?.find(c => c.id === form.category_id)?.title} /><span className="text-sm text-muted-foreground">{form.title || "Práctica del día"}</span></div>

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
                    disabled={save.isPending || generating || uploading !== null}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-60"
                  >
                    {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editing ? "Guardar cambios" : "Publicar"}
                  </button>
                </div>
              </form>
            )}

            {isLoading && (
              <div className="mt-4 space-y-2">
                <div className="h-16 animate-pulse rounded-[12px] bg-muted" />
                <div className="h-16 animate-pulse rounded-[12px] bg-muted" />
                <div className="h-16 animate-pulse rounded-[12px] bg-muted" />
              </div>
            )}

            {!isLoading && audiosError && (
              <p className="mt-4 rounded-[12px] border border-dashed border-destructive/40 bg-destructive/5 p-6 text-center text-[13px] text-destructive">
                No pudimos cargar los audios. Intenta de nuevo en unos segundos.
              </p>
            )}

            {!isLoading && !audiosError && (audios?.length ?? 0) === 0 && (
              <div className="mt-4 rounded-[12px] border border-dashed border-border p-6 text-center">
                <p className="text-[13px] text-muted-foreground">
                  Esta práctica todavía no tiene días publicados. Agrega el día 1 para que tus usuarios puedan
                  empezar.
                </p>
                <button
                  onClick={() => {
                    setEditing(null);
                    setForm({ ...emptyForm, category_id: filter });
                    setCatOpen(false);
                    setOpen(true);
                  }}
                  className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
                >
                  <Plus className="h-4 w-4" /> Agregar audio
                </button>
              </div>
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
                      onClick={async () => {
                        if (await confirmDeletion("Este audio se eliminará. No podrás recuperarlo.")) remove.mutate(a.id);
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
      )}
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
