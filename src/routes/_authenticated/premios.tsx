import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Trophy, Gem, Check, Sparkles } from "lucide-react";
import { REWARDS } from "@/lib/gems";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/premios")({
  head: () => ({ meta: [{ title: "Premios — Reconectando" }] }),
  component: PremiosPage,
});

function PremiosPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"all" | "custom">("all");

  const { data: profile } = useQuery({
    queryKey: ["profile-gems", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("gems, display_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
  const gems = profile?.gems ?? 0;

  async function redeem() {
    if (!user) return;
    const qty = mode === "all" ? gems : parseInt(amount, 10);
    if (!qty || qty <= 0) return toast.error("Cantidad inválida");
    if (qty > gems) return toast.error("No tienes suficientes gemas");
    const { error } = await supabase.rpc("award_gems", { _amount: -qty, _reason: "Canje de gemas", _meta: { channel: "manual" } });
    if (error) return toast.error(error.message);
    toast.success(`Canjeaste ${qty} 💎. Te contactaremos pronto.`);
    setRedeemOpen(false);
    setAmount("");
    qc.invalidateQueries({ queryKey: ["profile-gems"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:p-10 pb-28">
      {/* Treasure header */}
      <Card className="p-6 rounded-[2rem] bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 text-white shadow-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold/30 blur-3xl rounded-full" />
        <div className="relative text-center">
          <div className="text-6xl mb-2">🏴‍☠️</div>
          <div className="text-[11px] uppercase tracking-widest text-gold font-black">Tu Tesoro de Sanación</div>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-2xl px-5 py-3 backdrop-blur">
            <Gem className="w-7 h-7 text-fuchsia-300" />
            <span className="font-display font-black text-3xl">{gems.toLocaleString()}</span>
          </div>
          <div className="text-xs text-white/70 mt-2">Gemas acumuladas</div>
          <Button onClick={() => setRedeemOpen(true)} className="mt-5 rounded-full bg-emerald-500 hover:bg-emerald-600 h-12 px-6 font-bold shadow-glow">
            <Sparkles className="w-4 h-4 mr-2" /> Canjear Puntos Acumulados
          </Button>
        </div>
      </Card>

      <div className="text-center mt-8">
        <Trophy className="w-10 h-10 mx-auto text-gold" />
        <h1 className="font-display font-extrabold text-3xl mt-2">Premios</h1>
        <p className="text-muted-foreground text-sm mt-1">Acumula gemas y desbloquea recompensas reales.</p>
      </div>

      <div className="mt-6 space-y-4">
        {REWARDS.map((r) => {
          const pct = Math.min(100, (gems / r.cost) * 100);
          const unlocked = gems >= r.cost;
          return (
            <Card key={r.id} className={`p-5 rounded-[1.7rem] ${unlocked ? "border-2 border-emerald-500" : ""}`}>
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl grid place-items-center shrink-0 ${r.tier === 1 ? "bg-gold/20 text-gold" : r.tier === 2 ? "bg-slate-400/20 text-slate-500" : "bg-amber-700/20 text-amber-700"}`}>
                  <span className="font-display font-black text-xl">{r.tier}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display font-bold text-base">{r.cost.toLocaleString()} Puntos</div>
                    {unlocked && <Check className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <div className="font-semibold text-sm mt-0.5">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
                  <Progress value={pct} className="mt-3 h-2" />
                  <div className="mt-1 text-[11px] text-muted-foreground">{gems.toLocaleString()} / {r.cost.toLocaleString()}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-4 rounded-2xl bg-primary/10 border-primary/20 text-center text-sm">
        ¡Sigue agregando familiares y sanando tu linaje para alcanzar todos los premios!
      </Card>

      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">¿Cuántas gemas quieres canjear?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <button onClick={() => setMode("all")} className={`w-full text-left p-4 rounded-2xl border-2 flex items-center justify-between ${mode === "all" ? "border-emerald-500 bg-emerald-500/10" : "border-border"}`}>
              <span className="font-semibold">Agregar TODO</span>
              <span className="font-black text-primary">{gems.toLocaleString()} 💎</span>
            </button>
            <button onClick={() => setMode("custom")} className={`w-full text-left p-4 rounded-2xl border-2 ${mode === "custom" ? "border-emerald-500 bg-emerald-500/10" : "border-border"}`}>
              <div className="font-semibold">Escribir cantidad</div>
              {mode === "custom" && (
                <Input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="Escribe la cantidad" className="mt-2 rounded-xl h-11" />
              )}
            </button>
            <Button onClick={redeem} className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 font-bold">
              Canjear Gemas
            </Button>
            <p className="text-xs text-muted-foreground text-center">Podrás usar tus gemas para obtener soporte y beneficios especiales.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
