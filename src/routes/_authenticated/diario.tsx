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
import { Plus, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/diario")({
  head: () => ({ meta: [{ title: "Diario Espiritual — Reconectando" }] }),
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
  const [kind, setKind] = useState("oracion");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: entries } = useQuery({
    queryKey: ["journal", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("journal_entries").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function save() {
    if (!user || !content.trim()) return;
    const { error } = await supabase.from("journal_entries").insert({ user_id: user.id, kind, title: title || null, content });
    if (error) return toast.error(error.message);
    toast.success("Entrada guardada");
    setOpen(false); setTitle(""); setContent(""); setKind("oracion");
    qc.invalidateQueries({ queryKey: ["journal"] });
  }

  async function del(id: string) {
    await supabase.from("journal_entries").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["journal"] });
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl">Diario Espiritual</h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2"><Lock className="w-3.5 h-3.5" />Privado. Solo tú y Dios.</p>
        </div>
        <Button onClick={() => setOpen(o => !o)} className="bg-primary"><Plus className="w-4 h-4 mr-2" />Nueva entrada</Button>
      </div>

      {open && (
        <Card className="p-6 mt-6 space-y-3">
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{KINDS.map(k => <SelectItem key={k.v} value={k.v}>{k.l}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título (opcional)" />
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Escribe libremente..." className="min-h-40" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-gold text-gold-foreground hover:bg-gold/90">Guardar</Button>
          </div>
        </Card>
      )}

      <div className="mt-8 space-y-3">
        {(entries ?? []).map((e: any) => (
          <Card key={e.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-gold">{KINDS.find(k => k.v === e.kind)?.l}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(e.created_at), "d 'de' MMM, yyyy", { locale: es })}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => del(e.id)}><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></Button>
            </div>
            {e.title && <h3 className="font-display text-lg mt-2">{e.title}</h3>}
            <p className="text-sm text-foreground/85 mt-2 whitespace-pre-wrap">{e.content}</p>
          </Card>
        ))}
        {entries && entries.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground">Tu diario está vacío. Empieza con una oración o gratitud.</Card>
        )}
      </div>
    </div>
  );
}
