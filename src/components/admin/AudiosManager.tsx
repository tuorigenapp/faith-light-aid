import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Headphones, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

type Audio = {
  id: string;
  category_id: string;
  day_index: number;
  title: string;
  affirmation: string;
  audio_url: string | null;
  cover_url: string | null;
  duration_seconds: number | null;
};

const BUCKET = "manifest-audios";

const schema = z.object({
  category_id: z.string().trim().min(1, "Elige una playlist"),
  day_index: z.number().int().min(1, "El día empieza en 1").max(365),
  title: z.string().trim().min(3, "El título necesita al menos 3 letras").max(140),
  affirmation: z.string().trim().min(3, "Escribe la afirmación del audio").max(600),
  audio_url: z.string().trim().min(4, "Falta el MP3: sube el archivo o pega el enlace").max(800),
  cover_url: z.string().trim().max(800).optional().or(z.literal("")),
});

/** Alta, edición y baja de audios (MP3 por enlace o archivo) de Visualízalo y Vívelo. */
export function AudiosManager() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"audio" | "cover" | null>(null);
  const [form, setForm] = useState({
    category_id: "",
    day_index: 1,
    title: "",
    affirmation: "",
    audio_url: "",
    cover_url: "",
  });

  const { data: cats } = useQuery({
    queryKey: ["admin-manifest-cats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manifest_categories").select("id, title").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [filter, setFilter] = useState<string>("");

  const { data: audios, isLoading } = useQuery({
    queryKey: ["admin-manifest-audios", filter],
    queryFn: async () => {
      let q = supabase
        .from("manifest_audios")
        .select("id, category_id, day_index, title, affirmation, audio_url, cover_url, duration_seconds")
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
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (kind === "audio" ? "mp3" : "jpg");
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
      const row = { ...parsed.data, cover_url: parsed.data.cover_url || null };
      const res = editing
        ? await supabase.from("manifest_audios").update(row).eq("id", editing)
        : await supabase.from("manifest_audios").insert(row);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(editing ? "Audio actualizado" : "Audio publicado");
      setEditing(null);
      setOpen(false);
      setForm({ category_id: form.category_id, day_index: form.day_index + 1, title: "", affirmation: "", audio_url: "", cover_url: "" });
      void qc.invalidateQueries({ queryKey: ["admin-manifest-audios"] });
      void qc.invalidateQueries({ queryKey: ["sonidos_home"] });
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos guardar el audio"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("manifest_audios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Audio eliminado");
      void qc.invalidateQueries({ queryKey: ["admin-manifest-audios"] });
      void qc.invalidateQueries({ queryKey: ["sonidos_home"] });
    },
    onError: () => toast.error("No pudimos eliminar el audio"),
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
    });
    setOpen(true);
  }

  return (
    <section className="mt-4 rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 font-display text-[17px] font-bold">
          <Headphones className="h-4.5 w-4.5 text-primary" /> Música y audios guiados
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            setOpen((v) => !v);
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-[12px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
        >
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {open ? "Cerrar" : "Agregar audio"}
        </button>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Filtrar por playlist</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputCls}>
          <option value="">Todas las playlists</option>
          {(cats ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </label>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="mt-4 grid gap-3 rounded-[12px] border border-border/60 bg-background p-4 sm:grid-cols-2"
        >
          <Field label="Playlist">
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputCls}>
              <option value="">Elige una playlist</option>
              {(cats ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </Field>
          <Field label="Día">
            <input
              type="number"
              min={1}
              max={365}
              value={form.day_index}
              onChange={(e) => setForm({ ...form, day_index: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
          <Field label="Título del audio">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} maxLength={140} />
          </Field>
          <Field label="Afirmación">
            <input value={form.affirmation} onChange={(e) => setForm({ ...form, affirmation: e.target.value })} className={inputCls} maxLength={600} />
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

          <Field label="Portada de la playlist (enlace o archivo)">
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

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={save.isPending || uploading !== null}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-60"
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Guardar cambios" : "Publicar audio"}
            </button>
          </div>
        </form>
      )}

      {isLoading && <div className="mt-4 h-20 animate-pulse rounded-[12px] bg-muted" />}

      {!isLoading && (audios?.length ?? 0) === 0 && (
        <p className="mt-4 rounded-[12px] border border-dashed border-border p-6 text-center text-[13px] text-muted-foreground">
          Aún no hay audios en esta playlist. Agrega el día 1 para que tus usuarios puedan empezar.
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {(audios ?? []).map((a) => (
          <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] border border-border/60 p-2.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-[12px] font-bold text-primary">
              {a.day_index}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold leading-tight">{a.title}</p>
              <p className="truncate text-[12px] text-muted-foreground">
                {cats?.find((c) => c.id === a.category_id)?.title ?? a.category_id} · {a.audio_url ? "con MP3" : "sin audio"}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => startEdit(a)} aria-label={`Editar ${a.title}`} className="grid h-11 w-11 place-items-center rounded-[10px] bg-primary/10 text-primary">
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar el audio "${a.title}"?`)) remove.mutate(a.id);
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
