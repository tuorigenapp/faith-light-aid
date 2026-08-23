import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListMusic, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

type Cat = {
  id: string;
  title: string;
  subtitle: string | null;
  color: string | null;
  group_key: string | null;
  cover_url: string | null;
  description: string | null;
  pdf_url: string | null;
  sort_order: number;
  affirmation_ya_tengo: string;
  identity_yo_soy: string;
  gratitude_gracias: string;
  petition: string;
};

const GROUPS = [
  { key: "manifiesto", label: "Visualízalo y Vívelo" },
  { key: "limpieza", label: "Limpieza Espiritual" },
  { key: "identidad", label: "Salto de Identidad" },
  { key: "cristo", label: "Método de Cristo 3•6•9" },
  { key: "caminos", label: "Caminos (niño interior, glow up…)" },
];

const schema = z.object({
  id: z
    .string()
    .trim()
    .min(2, "Escribe un identificador corto, por ejemplo abundancia")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  title: z.string().trim().min(3, "El nombre necesita al menos 3 letras").max(120),
  subtitle: z.string().trim().max(160).optional().or(z.literal("")),
  group_key: z.string().trim().min(2),
  cover_url: z.string().trim().max(800).optional().or(z.literal("")),
  description: z.string().trim().max(1200).optional().or(z.literal("")),
  pdf_url: z.string().trim().max(800).optional().or(z.literal("")),
  affirmation_ya_tengo: z.string().trim().min(3, "Escribe la frase «Ya tengo»").max(400),
  identity_yo_soy: z.string().trim().min(3, "Escribe la frase «Yo soy»").max(400),
  gratitude_gracias: z.string().trim().min(3, "Escribe la frase «Gracias»").max(400),
  petition: z.string().trim().min(3, "Escribe la petición").max(400),
  sort_order: z.number().int().min(0).max(999),
});

const EMPTY = {
  id: "",
  title: "",
  subtitle: "",
  group_key: "manifiesto",
  cover_url: "",
  description: "",
  pdf_url: "",
  affirmation_ya_tengo: "",
  identity_yo_soy: "",
  gratitude_gracias: "",
  petition: "",
  sort_order: 10,
};

/** Crea y edita las playlists/programas de música (cada una con sus 4 frases del método). */
export function MusicProgramsManager() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-music-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manifest_categories")
        .select(
          "id, title, subtitle, color, group_key, cover_url, description, pdf_url, sort_order, affirmation_ya_tengo, identity_yo_soy, gratitude_gracias, petition",
        )
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Cat[];
    },
  });

  const grouped = useMemo(() => {
    return GROUPS.map((g) => ({
      ...g,
      items: (data ?? []).filter((c) => (c.group_key ?? "manifiesto") === g.key),
    })).filter((g) => g.items.length > 0 || g.key === "manifiesto");
  }, [data]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-music-programs"] });
    void qc.invalidateQueries({ queryKey: ["admin-manifest-cats"] });
    void qc.invalidateQueries({ queryKey: ["manifest-categories"] });
    void qc.invalidateQueries({ queryKey: ["sonidos_home"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ ...form, sort_order: Number(form.sort_order) });
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const row = {
        ...parsed.data,
        subtitle: parsed.data.subtitle || null,
        cover_url: parsed.data.cover_url || null,
        description: parsed.data.description || null,
        pdf_url: parsed.data.pdf_url || null,
      };
      const res = editing
        ? await supabase.from("manifest_categories").update(row).eq("id", editing)
        : await supabase.from("manifest_categories").insert(row);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(editing ? "Programa actualizado" : "Programa creado");
      setOpen(false);
      setEditing(null);
      setForm({ ...EMPTY });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos guardar el programa"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("manifest_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Programa eliminado");
      invalidate();
    },
    onError: () =>
      toast.error("No pudimos eliminarlo: primero borra o mueve los audios de ese programa."),
  });

  const startEdit = (c: Cat) => {
    setEditing(c.id);
    setForm({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle ?? "",
      group_key: c.group_key ?? "manifiesto",
      cover_url: c.cover_url ?? "",
      description: c.description ?? "",
      pdf_url: c.pdf_url ?? "",
      affirmation_ya_tengo: c.affirmation_ya_tengo,
      identity_yo_soy: c.identity_yo_soy,
      gratitude_gracias: c.gratitude_gracias,
      petition: c.petition,
      sort_order: c.sort_order,
    });
    setOpen(true);
  };

  const field = (
    key: keyof typeof EMPTY,
    label: string,
    placeholder: string,
    multiline = false,
  ) => (
    <label className="block">
      <span className="text-[12px] font-semibold text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={String(form[key])}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          className="mt-1 w-full rounded-[10px] border-[1.5px] border-border bg-background p-3 text-[14px] outline-none focus:border-primary"
        />
      ) : (
        <input
          value={String(form[key])}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="mt-1 h-12 w-full rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[14px] outline-none focus:border-primary"
        />
      )}
    </label>
  );

  return (
    <section className="rounded-[16px] border border-border bg-card p-5 shadow-soft">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="flex min-w-0 items-center gap-2 font-display text-[17px] font-bold">
          <ListMusic className="h-4.5 w-4.5 text-primary" /> Programas y playlists ({data?.length ?? 0})
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ ...EMPTY });
            setOpen(true);
          }}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[12px] bg-primary px-4 text-[13.5px] font-bold text-primary-foreground active:scale-[.98]"
        >
          <Plus className="h-4 w-4" /> Nuevo programa
        </button>
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Aquí decides qué programas existen dentro de la música: cada uno agrupa sus audios por día.
      </p>

      {open && (
        <div className="mt-4 rounded-[14px] border border-border bg-background/60 p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-[15px] font-bold">
              {editing ? `Editando ${editing}` : "Nuevo programa"}
            </p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar formulario"
              className="grid h-11 w-11 place-items-center rounded-[10px] bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-semibold text-muted-foreground">Sección</span>
              <select
                value={form.group_key}
                onChange={(e) => setForm((f) => ({ ...f, group_key: e.target.value }))}
                className="mt-1 h-12 w-full rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[14px] outline-none focus:border-primary"
              >
                {GROUPS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            {field("id", "Identificador (no se repite)", "abundancia")}
            {field("title", "Nombre visible", "Abundancia sin culpa")}
            {field("subtitle", "Frase corta", "21 días para recibir")}
            {field("cover_url", "Portada (enlace o ruta)", "https://…")}
            {field("pdf_url", "PDF de apoyo (opcional)", "https://…")}
            <label className="block">
              <span className="text-[12px] font-semibold text-muted-foreground">Orden</span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                className="mt-1 h-12 w-full rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[14px] outline-none focus:border-primary"
              />
            </label>
            <div className="sm:col-span-2">{field("description", "Descripción", "Para qué sirve este programa", true)}</div>
            {field("affirmation_ya_tengo", "Ya tengo…", "Ya tengo paz en mi casa")}
            {field("identity_yo_soy", "Yo soy…", "Yo soy la persona que rompe el ciclo")}
            {field("gratitude_gracias", "Gracias…", "Gracias porque ya está hecho")}
            {field("petition", "Petición", "Señor, sana mi linaje")}
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="mt-4 grid h-13 w-full place-items-center rounded-[12px] bg-primary py-4 text-[15px] font-bold text-primary-foreground active:scale-[.98] disabled:opacity-60"
          >
            {save.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar programa"}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[12px] bg-secondary" />
          ))}
        </div>
      )}

      {!isLoading &&
        grouped.map((g) => (
          <div key={g.key} className="mt-5">
            <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
              {g.label}
            </p>
            {g.items.length === 0 ? (
              <p className="mt-2 rounded-[12px] border border-dashed border-border p-4 text-[13px] text-muted-foreground">
                Todavía no hay programas en esta sección. Crea el primero.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {g.items.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[12px] border border-border bg-background/60 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[14px]">{c.title}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {c.id} · orden {c.sort_order}
                      </p>
                    </div>
                    <button
                      onClick={() => startEdit(c)}
                      aria-label={`Editar ${c.title}`}
                      className="grid h-11 w-11 place-items-center rounded-[10px] bg-secondary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el programa ${c.title}?`)) remove.mutate(c.id);
                      }}
                      aria-label={`Eliminar ${c.title}`}
                      className="grid h-11 w-11 place-items-center rounded-[10px] bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
    </section>
  );
}
