import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, FileText, Trash2, Eye, EyeOff, Upload, RefreshCw, Pencil, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractPdfText } from "@/lib/pdf-text";
import { cn } from "@/lib/utils";

type Doc = {
  id: string;
  scope: string;
  scope_ref: string | null;
  title: string;
  chars: number;
  is_active: boolean;
  created_at: string;
};

/** Secciones que pueden tener su propio material de estudio. */
const SCOPES: { value: string; label: string }[] = [
  { value: "origen", label: "ORÍGEN (todo el método)" },
  { value: "mentora", label: "Hablar con la Mentora" },
  { value: "ministracion", label: "Dios te dice hoy" },
  { value: "pareja", label: "¿Mi pareja es de destino?" },
  { value: "patrones", label: "Patrones generacionales" },
  { value: "consulta", label: "Consultas nuevas del panel" },
];

const input = "min-h-12 w-full rounded-[10px] border border-border bg-background px-3 text-[14px] outline-none focus:border-primary";

/** Cerebro ORÍGEN: PDFs cuyo texto amplía el conocimiento de la IA. La fuente nunca se revela. */
export function BrainManager() {
  const qc = useQueryClient();
  const [scope, setScope] = useState("origen");
  const [scopeRef, setScopeRef] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
  const { data: targets = [] } = useQuery({ queryKey: ["brain-targets"], queryFn: async () => {
    const [consultas, caminos, temas] = await Promise.all([supabase.from("custom_consultas").select("slug,title"), supabase.from("custom_caminos").select("slug,title"), supabase.from("manifest_categories").select("id,title")]);
    return [...(consultas.data ?? []).map(x => ({ scope: "consulta", ref: x.slug, title: x.title })), ...(caminos.data ?? []).map(x => ({ scope: "camino", ref: x.slug, title: x.title })), ...(temas.data ?? []).map(x => ({ scope: "visualiza", ref: x.id, title: x.title }))];
  }, refetchInterval: 20000 });

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["admin-brain"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brain_documents")
        .select("id, scope, scope_ref, title, chars, is_active, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Doc[];
    },
  });

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setNote(null);
    for (const file of Array.from(files)) {
      setBusy(file.name);
      try {
        const text = await extractPdfText(file, (page, total) => setBusy(`${file.name} — página ${page} de ${total}`));
        if (text.trim().length < 40) throw new Error(`${file.name}: no pudimos leer texto (parece escaneado como imagen).`);
        const { error } = await supabase.from("brain_documents").insert({
          scope,
          scope_ref: scopeRef.trim() || null,
          title: file.name.replace(/\.pdf$/i, ""),
          content: text,
          chars: text.length,
          is_active: true,
        });
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["admin-brain"] });
      } catch (e) {
        setNote({ text: e instanceof Error ? e.message : `No pudimos leer ${file.name}.`, error: true });
      }
    }
    setBusy(null);
    setNote((n) => n?.error ? n : { text: "Material agregado. La IA ya lo usa como conocimiento propio." });
  }

  async function toggle(d: Doc) {
    await supabase.from("brain_documents").update({ is_active: !d.is_active }).eq("id", d.id);
    qc.invalidateQueries({ queryKey: ["admin-brain"] });
  }
  async function remove(d: Doc) {
    if (!confirm(`¿Eliminar "${d.title}" del Cerebro ORÍGEN?`)) return;
    await supabase.from("brain_documents").delete().eq("id", d.id);
    qc.invalidateQueries({ queryKey: ["admin-brain"] });
  }

  async function replace(d: Doc, file: File | undefined) {
    if (!file) return;
    setBusy(file.name); setNote(null);
    try {
      const text = await extractPdfText(file, (p, t) => setBusy(`${file.name} — página ${p} de ${t}`));
      if (text.trim().length < 40) throw new Error(`${file.name}: no pudimos leer texto (parece escaneado como imagen).`);
      const { error } = await supabase.from("brain_documents").update({ content: text, chars: text.length, is_active: true }).eq("id", d.id);
      if (error) throw error;
      setNote({ text: `"${d.title}" quedó reemplazado con el PDF nuevo.` });
      qc.invalidateQueries({ queryKey: ["admin-brain"] });
    } catch (e) { setNote({ text: e instanceof Error ? e.message : "No pudimos reemplazar el PDF.", error: true }); }
    setBusy(null);
  }
  async function rename(d: Doc) {
    const t = prompt("Nuevo nombre del material", d.title)?.trim();
    if (!t) return;
    await supabase.from("brain_documents").update({ title: t }).eq("id", d.id);
    qc.invalidateQueries({ queryKey: ["admin-brain"] });
  }
  const where = (d: Doc) => `${label(d.scope)}${d.scope_ref ? ` · ${targets.find(x => x.ref === d.scope_ref)?.title ?? d.scope_ref}` : ""}`;
  const groups = Array.from(new Set(docs.map(where))).map(g => ({ g, items: docs.filter(d => where(d) === g) }));

  function label(v: string) { return v === "camino" ? "Caminos ORÍGEN" : v === "visualiza" ? "Visualízalo y Vívelo" : SCOPES.find((s) => s.value === v)?.label ?? v; }

  return (
    <div className="space-y-5">
      <div className="rounded-[16px] border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-primary"><Brain className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-[18px] font-bold">Cerebro ORÍGEN</h2>
            <p className="text-[13px] text-muted-foreground">
              Sube los PDF que quieras que la IA aprenda. Se guarda solo el texto y jamás se menciona de dónde salió.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="text-[13px] font-semibold text-foreground/80">¿Para qué sección es este material?
            <select className={cn(input, "mt-1")} value={scope} onChange={(e) => { setScope(e.target.value); setScopeRef(""); }}>
              {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              <option value="camino">Caminos ORÍGEN</option><option value="visualiza">Visualízalo y Vívelo</option>
            </select>
          </label>
          {["consulta", "camino", "visualiza"].includes(scope) && (
            <select aria-label="Sección específica" className={input} value={scopeRef} onChange={(e) => setScopeRef(e.target.value)}><option value="">Todas las secciones de este grupo</option>{targets.filter(x => x.scope === scope).map(x => <option key={x.ref} value={x.ref}>{x.title}</option>)}</select>
          )}
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-border bg-muted/30 p-4 text-center text-[13px] font-semibold text-muted-foreground">
            {busy ? <><span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />{busy}</> : <><Upload className="h-6 w-6" /> Elegir PDF (puedes elegir varios)</>}
            <input type="file" accept="application/pdf" multiple className="hidden" disabled={!!busy} onChange={(e) => addFiles(e.target.files)} />
          </label>
          {note && <p className={cn("text-[13px] font-semibold", note.error ? "text-destructive" : "text-accent-green")}>{note.text}</p>}
        </div>
      </div>

      <div className="grid gap-2">
        {isLoading && <div className="h-16 animate-pulse rounded-[16px] bg-muted" />}
        {!isLoading && docs.length === 0 && <p className="text-[14px] text-muted-foreground">Todavía no hay material. El primer PDF que subas aparecerá aquí.</p>}
        {groups.map(({ g, items }) => (
          <section key={g} className="space-y-2">
            <h3 className="flex items-center gap-2 pt-2 text-[13px] font-bold text-foreground/80"><FolderOpen className="h-4 w-4 text-primary" /> Trabaja en: {g} <span className="text-muted-foreground">({items.length})</span></h3>
            {items.map((d) => (
          <article key={d.id} className="rounded-[14px] border border-border bg-card p-3">
            <div className="flex items-center gap-3">
              <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[10px]", d.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}><FileText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{d.title}</p>
                <p className="truncate text-[12px] text-muted-foreground">{d.chars.toLocaleString("es")} letras · {d.is_active ? "activo" : "desactivado"} · {new Date(d.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}</p>
                {d.chars < 200 && <p className="text-[12px] font-semibold text-destructive">Este PDF casi no tiene texto: reemplázalo.</p>}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-[12px] font-semibold">
              <label className={cn("flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-[10px] bg-primary/10 text-primary", busy && "pointer-events-none opacity-50")}><RefreshCw className="h-4 w-4" />Reemplazar<input type="file" accept="application/pdf" className="hidden" onChange={(e) => replace(d, e.target.files?.[0])} /></label>
              <button onClick={() => rename(d)} className="flex min-h-11 flex-col items-center justify-center rounded-[10px] bg-primary/10 text-primary"><Pencil className="h-4 w-4" />Renombrar</button>
              <button onClick={() => toggle(d)} className="flex min-h-11 flex-col items-center justify-center rounded-[10px] bg-primary/10 text-primary">{d.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{d.is_active ? "Pausar" : "Activar"}</button>
              <button onClick={() => remove(d)} className="flex min-h-11 flex-col items-center justify-center rounded-[10px] bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" />Borrar</button>
            </div>
          </article>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
