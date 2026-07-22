import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Gem, Trophy, TreeDeciduous, Sparkles } from "lucide-react";
import { awardGems, GEM_REWARDS } from "@/lib/gems";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/arbol")({
  head: () => ({ meta: [{ title: "Mi Árbol Genealógico — Reconectando" }] }),
  component: TreePage,
});

const RELATIONSHIPS = ["Madre", "Padre", "Abuela materna", "Abuelo materno", "Abuela paterna", "Abuelo paterno", "Tío", "Tía", "Hermano", "Hermana", "Sobrino", "Sobrina", "Hijo", "Hija", "Otro"];

function TreePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", relationship: "", lineage: "materno" as "materno" | "paterno" });

  const { data: members = [] } = useQuery({
    queryKey: ["family_members", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("family_members").select("*").eq("user_id", user!.id).order("created_at");
      return data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-gems", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("gems, display_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const materno = members.filter((m) => m.lineage === "materno");
  const paterno = members.filter((m) => m.lineage === "paterno");
  const totalGems = profile?.gems ?? 0;
  const jarProgress = Math.min(100, (members.length / 50) * 100);

  async function addMember() {
    if (!user) return;
    if (!form.full_name.trim() || !form.relationship) return toast.error("Completa nombre y parentesco");
    const { error } = await supabase.from("family_members").insert({
      user_id: user.id, full_name: form.full_name.trim(), relationship: form.relationship, lineage: form.lineage,
    });
    if (error) return toast.error(error.message);
    await awardGems(GEM_REWARDS.familyMember, `Nuevo familiar: ${form.full_name}`);
    setForm({ full_name: "", relationship: "", lineage: form.lineage });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["family_members"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["profile-gems"] });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:p-10 pb-28">
      {/* Header stat card */}
      <Card className="p-5 md:p-6 rounded-[2rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white shadow-glow overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/20 blur-3xl rounded-full" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-gold font-black">Tu Árbol Genealógico</div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl mt-1">Cada familiar sana tu linaje</h1>
            <p className="text-white/70 text-sm mt-1">Rompe cadenas ancestrales, una raíz a la vez.</p>
          </div>
          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-2xl px-3 py-2 backdrop-blur">
              <Gem className="w-5 h-5 text-gold" />
              <span className="font-display font-black text-xl">{totalGems.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-white/70 mt-1">Gemas de Sanación</div>
          </div>
        </div>
        {/* Jar */}
        <div className="relative mt-5 h-3 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 transition-all" style={{ width: `${jarProgress}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-white/70">
          <span>Frasco espiritual: {members.length} / 50 familiares</span>
          <Link to="/premios" className="inline-flex items-center gap-1 font-bold text-gold hover:underline"><Trophy className="w-3.5 h-3.5" /> Premios</Link>
        </div>
      </Card>

      {/* Add button */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={() => setOpen(true)} size="lg" className="rounded-full bg-emerald-600 hover:bg-emerald-700 h-12 px-6 font-bold shadow-glow">
          <Plus className="w-5 h-5 mr-2" /> Agregar familiar (+{GEM_REWARDS.familyMember} 💎)
        </Button>
        <Link to="/premios" className="inline-flex items-center gap-2 rounded-full bg-gold/15 text-gold px-4 h-12 font-bold hover:bg-gold/25">
          <Trophy className="w-4 h-4" /> Canjear Puntos
        </Link>
      </div>

      {/* Tree */}
      <div className="mt-8 grid md:grid-cols-2 gap-5">
        <LineageColumn title="Linaje Materno" color="from-rose-500 to-pink-500" members={materno} />
        <LineageColumn title="Linaje Paterno" color="from-sky-500 to-blue-600" members={paterno} />
      </div>

      {members.length === 0 && (
        <Card className="p-8 mt-6 rounded-[2rem] text-center bg-card">
          <TreeDeciduous className="w-12 h-12 mx-auto text-emerald-500" />
          <h3 className="font-display font-bold text-xl mt-3">Empieza tu árbol</h3>
          <p className="text-muted-foreground text-sm mt-1">Agrega tu primer familiar y comienza a sanar tu linaje.</p>
        </Card>
      )}

      {/* Add dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Agregar Familiar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-semibold">Nombre completo *</label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Ingresa el nombre" className="mt-1.5 rounded-2xl h-11" />
            </div>
            <div>
              <label className="text-sm font-semibold">Parentesco *</label>
              <Select value={form.relationship} onValueChange={(v) => setForm({ ...form, relationship: v })}>
                <SelectTrigger className="mt-1.5 rounded-2xl h-11"><SelectValue placeholder="Ej: Madre, Padre, Abuela…" /></SelectTrigger>
                <SelectContent>{RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold">Linaje *</label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm({ ...form, lineage: "materno" })} className={`h-11 rounded-2xl font-bold text-sm border-2 ${form.lineage === "materno" ? "bg-rose-500/15 border-rose-500 text-rose-600" : "border-border"}`}>♀ Materno</button>
                <button type="button" onClick={() => setForm({ ...form, lineage: "paterno" })} className={`h-11 rounded-2xl font-bold text-sm border-2 ${form.lineage === "paterno" ? "bg-blue-500/15 border-blue-500 text-blue-600" : "border-border"}`}>♂ Paterno</button>
              </div>
            </div>
            <Button onClick={addMember} className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 font-bold">
              Guardar Familiar (+{GEM_REWARDS.familyMember} 💎)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Celebration overlay */}
      {celebrate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur animate-in fade-in duration-300">
          <div className="text-center animate-in zoom-in duration-500">
            <PartyPopper className="w-16 h-16 text-gold mx-auto animate-bounce" />
            <div className="mt-4 font-display font-black text-4xl text-white">¡Felicidades!</div>
            <div className="mt-2 text-white/80">Has agregado un nuevo familiar</div>
            <div className="mt-6 inline-flex items-center gap-2 bg-gold text-gold-foreground rounded-full px-6 py-3 font-black text-2xl">
              <Gem className="w-6 h-6" /> +{celebrate}
            </div>
            <div className="mt-2 text-white/70 text-sm">Gemas de Sanación</div>
          </div>
        </div>
      )}
    </div>
  );
}

function LineageColumn({ title, color, members }: { title: string; color: string; members: Array<{ id: string; full_name: string; relationship: string }> }) {
  return (
    <Card className="p-5 rounded-[2rem]">
      <div className={`inline-block text-[11px] font-black uppercase tracking-widest bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{title}</div>
      <div className="mt-3 space-y-2 relative">
        <div className={`absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b ${color} opacity-30`} />
        {members.length === 0 && <div className="text-sm text-muted-foreground py-4">Aún no hay familiares en este linaje.</div>}
        {members.map((m) => (
          <div key={m.id} className="relative flex items-center gap-3 pl-2">
            <div className={`relative z-10 w-8 h-8 rounded-full bg-gradient-to-br ${color} grid place-items-center text-white text-xs font-black shadow-soft`}>
              {m.full_name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 rounded-2xl bg-background border border-border px-3 py-2">
              <div className="font-semibold text-sm truncate">{m.full_name}</div>
              <div className="text-[11px] text-muted-foreground">{m.relationship}</div>
            </div>
            <Gem className="w-4 h-4 text-fuchsia-500" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// keep import used
export const _link = Link;
