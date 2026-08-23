import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DownloadCloud, Library, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { EBOOKS } from "@/lib/biblioteca";

type Item = {
  id: string;
  title: string;
  category: string;
  kind: string;
  description: string | null;
  cover_url: string | null;
  resource_url: string | null;
  required_plan: string;
  slug: string | null;
  sort_order: number;
};

const schema = z.object({
  title: z.string().trim().min(3, "El título necesita al menos 3 letras").max(140),
  category: z.string().trim().min(2, "Escribe una categoría").max(60),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  cover_url: z.string().trim().url("La portada debe ser un enlace válido").max(600).optional().or(z.literal("")),
  resource_url: z.string().trim().url("El enlace del libro no es válido").max(600),
  required_plan: z.enum(["explorador", "camino"]),
});

const EMPTY = {
  title: "",
  category: "Sanación emocional",
  description: "",
  cover_url: "",
  resource_url: "",
  required_plan: "explorador" as "explorador" | "camino",
};

/** Alta, edición y baja de libros de la Biblioteca Digital. */
export function BooksManager() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_items")
        .select("id, title, category, kind, description, cover_url, resource_url, required_plan, slug, sort_order")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const row = {
        ...parsed.data,
        description: parsed.data.description || null,
        cover_url: parsed.data.cover_url || null,
        kind: "ebook",
      };
      const res = editing
        ? await supabase.from("library_items").update(row).eq("id", editing)
        : await supabase.from("library_items").insert(row);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(editing ? "Libro actualizado" : "Libro agregado a la biblioteca");
      setForm({ ...EMPTY });
      setEditing(null);
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin-books"] });
      void qc.invalidateQueries({ queryKey: ["biblioteca-extra"] });
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos guardar el libro"),
  });

  const importBase = useMutation({
    mutationFn: async () => {
      const rows = EBOOKS.map((b, i) => ({
        slug: b.id,
        title: b.title,
        cover_url: b.cover,
        resource_url: b.files[0] ?? "",
        category: "Biblioteca ORÍGEN",
        kind: "ebook",
        required_plan: "explorador",
        sort_order: i + 1,
      }));
      const { error } = await supabase.from("library_items").upsert(rows, { onConflict: "slug" });
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} libros del catálogo base ya son editables aquí.`);
      void qc.invalidateQueries({ queryKey: ["admin-books"] });
      void qc.invalidateQueries({ queryKey: ["biblioteca-extra"] });
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos importar el catálogo base."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("library_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Libro eliminado");
      void qc.invalidateQueries({ queryKey: ["admin-books"] });
      void qc.invalidateQueries({ queryKey: ["biblioteca-extra"] });
    },
    onError: () => toast.error("No pudimos eliminar el libro"),
  });

  function startEdit(it: Item) {
    setEditing(it.id);
    setForm({
      title: it.title,
      category: it.category,
      description: it.description ?? "",
      cover_url: it.cover_url ?? "",
      resource_url: it.resource_url ?? "",
      required_plan: it.required_plan === "camino" ? "camino" : "explorador",
    });
    setOpen(true);
  }

  const q = search.trim().toLowerCase();
  const list = (data ?? []).filter((it) => !q || `${it.title} ${it.category}`.toLowerCase().includes(q));

  return (
    <section className="mt-5 rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 font-display text-[17px] font-bold">
          <Library className="h-4.5 w-4.5 text-primary" /> Libros de la biblioteca ({data?.length ?? 0})
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ ...EMPTY });
            setOpen((v) => !v);
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-[12px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
        >
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {open ? "Cerrar" : "Agregar libro"}
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="flex h-12 items-center gap-2 rounded-[10px] border-[1.5px] border-border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar libro por título o categoría"
            className="h-full w-full bg-transparent text-[14px] outline-none"
          />
        </label>
        <button
          onClick={() => importBase.mutate()}
          disabled={importBase.isPending}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-secondary px-4 text-[13px] font-bold disabled:opacity-60"
        >
          {importBase.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
          Importar catálogo base ({EBOOKS.length})
        </button>
      </div>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="mt-4 grid gap-3 rounded-[12px] border border-border/60 bg-background p-4 sm:grid-cols-2"
        >
          <Field label="Título">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} maxLength={140} />
          </Field>
          <Field label="Categoría">
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} maxLength={60} />
          </Field>
          <Field label="Enlace de descarga (PDF / Drive)">
            <input value={form.resource_url} onChange={(e) => setForm({ ...form, resource_url: e.target.value })} className={inputCls} maxLength={600} />
          </Field>
          <Field label="Portada (URL de imagen)">
            <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} className={inputCls} maxLength={600} />
          </Field>
          <Field label="Plan requerido">
            <select
              value={form.required_plan}
              onChange={(e) => setForm({ ...form, required_plan: e.target.value as "explorador" | "camino" })}
              className={inputCls}
            >
              <option value="explorador">Explorador (gratis)</option>
              <option value="camino">Camino ORÍGEN (pago)</option>
            </select>
          </Field>
          <Field label="Descripción corta">
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} maxLength={600} />
          </Field>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-60"
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Guardar cambios" : "Publicar libro"}
            </button>
          </div>
        </form>
      )}

      {isLoading && <div className="mt-4 h-20 animate-pulse rounded-[12px] bg-muted" />}

      {!isLoading && list.length === 0 && (
        <p className="mt-4 rounded-[12px] border border-dashed border-border p-6 text-center text-[13px] text-muted-foreground">
          {q
            ? "Ningún libro coincide con tu búsqueda."
            : "Toca “Importar catálogo base” y tendrás los 82 libros aquí para editar, cambiar portada, enlace o borrarlos."}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {list.map((it) => (
          <li key={it.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] border border-border/60 p-2.5">
            {it.cover_url ? (
              <img src={it.cover_url} alt="" loading="lazy" className="h-14 w-11 rounded-[8px] object-cover" />
            ) : (
              <span className="grid h-14 w-11 place-items-center rounded-[8px] bg-primary/10 text-primary">
                <Library className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold leading-tight">{it.title}</p>
              <p className="truncate text-[12px] text-muted-foreground">
                {it.category} · {it.required_plan === "camino" ? "Plan Camino" : "Gratis"}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => startEdit(it)} aria-label={`Editar ${it.title}`} className="grid h-11 w-11 place-items-center rounded-[10px] bg-primary/10 text-primary">
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar "${it.title}" de la biblioteca?`)) remove.mutate(it.id);
                }}
                aria-label={`Eliminar ${it.title}`}
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
