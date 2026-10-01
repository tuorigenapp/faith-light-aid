import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, Sparkles, Trash2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminCreateConsulta, adminToggleConsulta, adminDeleteConsulta } from "@/lib/consultas.functions";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  is_published: boolean;
  cost_hojas: number;
  sections: { key: string; label: string }[];
};

const input = "min-h-12 w-full rounded-[10px] border border-border bg-background px-3 text-[14px] outline-none focus:border-primary";

/** Crea secciones de respuesta nuevas: tú das título y nota, la IA arma todo lo demás. */
export function ConsultasStudio() {
  const qc = useQueryClient();
  const create = useServerFn(adminCreateConsulta);
  const toggle = useServerFn(adminToggleConsulta);
  const del = useServerFn(adminDeleteConsulta);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState("1");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-consultas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_consultas")
        .select("id, slug, title, subtitle, cover_url, is_published, cost_hojas, sections")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  async function make() {
    if (title.trim().length < 3) return setNote({ text: "Escribe el título de la nueva sección.", error: true });
    setBusy(true);
    setNote(null);
    try {
      await create({ data: { title: title.trim(), notes: notes.trim(), costHojas: Math.max(0, Number(cost) || 1), withCover: true } });
      setTitle(""); setNotes(""); setCost("1");
      setNote({ text: "Lista. Ya aparece en el menú de ORÍGEN para las personas." });
      qc.invalidateQueries({ queryKey: ["admin-consultas"] });
    } catch (e) {
      setNote({ text: e instanceof Error ? e.message : "No pudimos crearla.", error: true });
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[16px] border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-primary"><Wand2 className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-[18px] font-bold">Nueva sección de respuestas</h2>
            <p className="text-[13px] text-muted-foreground">
              Tú pones el título y una nota. La IA escribe la presentación, los bloques de la respuesta y el estilo. Siempre pide nombre completo, fecha de nacimiento y la pregunta.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          <input className={input} placeholder='Título (ej. "Qué dice tu año de nacimiento")' value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className={cn(input, "min-h-24 py-2")} placeholder="Nota para la IA: de qué habla, qué tono, qué debe incluir…" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1500} />
          <label className="text-[13px] font-semibold text-foreground/80">Cuántas hojas cuesta (0 = gratis)
            <input type="number" min={0} max={20} className={cn(input, "mt-1")} value={cost} onChange={(e) => setCost(e.target.value)} />
          </label>
          <button onClick={make} disabled={busy} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[12px] bg-primary font-bold text-primary-foreground disabled:opacity-60">
            {busy ? "Creándola con la IA…" : <><Sparkles className="h-5 w-5" /> Crear con IA</>}
          </button>
          {note && <p className={cn("text-[13px] font-semibold", note.error ? "text-destructive" : "text-accent-green")}>{note.text}</p>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {isLoading && <div className="h-28 animate-pulse rounded-[16px] bg-muted" />}
        {!isLoading && rows.length === 0 && <p className="text-[14px] text-muted-foreground">Todavía no creaste ninguna. La primera aparecerá aquí.</p>}
        {rows.map((r) => (
          <article key={r.id} className="overflow-hidden rounded-[16px] border border-border bg-card">
            {r.cover_url && <img src={r.cover_url} alt="" className={cn("aspect-[16/9] w-full object-cover", !r.is_published && "opacity-50")} />}
            <div className="p-3">
              <p className="truncate font-bold">{r.title}</p>
              <p className="truncate text-[12px] text-muted-foreground">{r.subtitle || "Sin subtítulo"}</p>
              <p className="text-[12px] text-muted-foreground">
                {(r.sections ?? []).length} bloques · {r.cost_hojas} hoja(s) · {r.is_published ? "visible" : "oculta"}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={async () => { await toggle({ data: { id: r.id, isPublished: !r.is_published } }); qc.invalidateQueries({ queryKey: ["admin-consultas"] }); }}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-[10px] bg-primary/10 text-[13px] font-bold text-primary"
                >
                  {r.is_published ? <><EyeOff className="h-4 w-4" /> Ocultar</> : <><Eye className="h-4 w-4" /> Mostrar</>}
                </button>
                <button
                  onClick={async () => { if (!confirm(`¿Eliminar "${r.title}"?`)) return; await del({ data: { id: r.id } }); qc.invalidateQueries({ queryKey: ["admin-consultas"] }); }}
                  aria-label="Eliminar"
                  className="grid min-h-11 w-11 place-items-center rounded-[10px] bg-destructive/10 text-destructive"
                ><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
