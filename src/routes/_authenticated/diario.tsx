import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Lock, Trash2, Undo2, BookHeart, Trash } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EmptyState } from "@/components/EmptyState";
import { confirmDeletion } from "@/lib/deletion-confirmation";

export const Route = createFileRoute("/_authenticated/diario")({
  head: () => ({
    meta: [
      { title: "Diario espiritual — ORÍGEN" },
      { name: "description", content: "Tu diario privado: oración, gratitud, reflexión y testimonio, con papelera de 30 días." },
      { property: "og:title", content: "Diario espiritual — ORÍGEN" },
      { property: "og:description", content: "Escribe lo que solo tú y Dios necesitan leer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Diario,
});

const KINDS = [
  { v: "oracion", l: "Oración" },
  { v: "gratitud", l: "Gratitud" },
  { v: "reflexion", l: "Reflexión" },
  { v: "testimonio", l: "Testimonio" },
  { v: "meta", l: "Meta" },
];

function Diario() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"mias" | "papelera">("mias");
  const [kind, setKind] = useState("oracion");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: entries, isLoading } = useQuery({
    queryKey: ["journal", user?.id, tab],
    enabled: !!user,
    queryFn: async () => {
      const q = supabase.from("journal_entries").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      const { data } = tab === "mias" ? await q.is("deleted_at", null) : await q.not("deleted_at", "is", null);
      return data ?? [];
    },
  });

  async function save() {
    if (!user || !content.trim()) return;
    const { error } = await supabase.from("journal_entries").insert({ user_id: user.id, kind, title: title || null, content });
    if (error) return toast.error(error.message);
    toast.success("Entrada guardada", { description: "Nadie más puede leerla." });
    setOpen(false); setTitle(""); setContent(""); setKind("oracion");
    qc.invalidateQueries({ queryKey: ["journal"] });
  }

  async function moveToTrash(id: string) {
    if (!await confirmDeletion("Esta nota irá a la papelera. Puedes restaurarla durante 30 días.")) return;
    const { error } = await supabase.from("journal_entries").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error("No pudimos mover la nota a la papelera. Intenta de nuevo.");
    qc.invalidateQueries({ queryKey: ["journal"] });
    toast("Movida a la papelera", { description: "Puedes restaurarla durante 30 días." });
  }

  async function restore(id: string) {
    await supabase.from("journal_entries").update({ deleted_at: null }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["journal"] });
    toast.success("Entrada restaurada");
  }

  async function destroy(id: string) {
    if (!await confirmDeletion("Esta nota se eliminará para siempre. No podrás recuperarla.")) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (error) return toast.error("No pudimos eliminar la nota. Intenta de nuevo.");
    qc.invalidateQueries({ queryKey: ["journal"] });
    toast("Eliminada para siempre");
  }

  return (
    <div className="mx-auto max-w-3xl p-5 pb-28 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold leading-tight">Diario espiritual</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Privado. Solo tú y Dios.
          </p>
        </div>
        <Button onClick={() => setOpen((o) => !o)} className="bg-primary"><Plus className="mr-2 h-4 w-4" />Nueva entrada</Button>
      </div>

      <div className="mt-5 flex gap-2">
        {(["mias", "papelera"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-9 rounded-[10px] px-4 text-sm font-semibold transition ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {t === "mias" ? "Mis entradas" : "Papelera"}
          </button>
        ))}
      </div>

      {open && (
        <Card className="mt-5 space-y-3 p-6">
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{KINDS.map((k) => <SelectItem key={k.v} value={k.v}>{k.l}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (opcional)" />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escribe libremente..." className="min-h-40" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-primary">Guardar</Button>
          </div>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {isLoading && [0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-[16px] bg-secondary" />)}

        {(entries ?? []).map((e: any) => (
          <Card key={e.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-primary">{KINDS.find((k) => k.v === e.kind)?.l}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(e.created_at), "d 'de' MMM, yyyy", { locale: es })}
                </span>
              </div>
              {tab === "mias" ? (
                <Button variant="ghost" size="sm" aria-label="Mover a la papelera" onClick={() => moveToTrash(e.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" aria-label="Restaurar" onClick={() => restore(e.id)}>
                    <Undo2 className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Eliminar para siempre" onClick={() => destroy(e.id)}>
                    <Trash className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
            {e.title && <h3 className="mt-2 font-display text-lg">{e.title}</h3>}
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">{e.content}</p>
          </Card>
        ))}

        {!isLoading && entries && entries.length === 0 && tab === "mias" && (
          <EmptyState
            icon={BookHeart}
            title="Tu primera página te espera"
            body="Empieza con una oración corta o con tres cosas que agradeces hoy. Tres líneas bastan."
            actionLabel="Escribir mi primera entrada"
            onAction={() => setOpen(true)}
          />
        )}
        {!isLoading && entries && entries.length === 0 && tab === "papelera" && (
          <EmptyState icon={Trash} title="Papelera limpia" body="Lo que borres aparecerá aquí y podrás restaurarlo durante 30 días." />
        )}
      </div>
    </div>
  );
}
