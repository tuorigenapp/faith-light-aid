import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/membresia")({
  head: () => ({ meta: [{ title: "Membresía — Reconectando" }] }),
  component: Membresia,
});

const PLANS = [
  { id: "inicial", name: "Inicial", price: "$1", per: "/ mes", features: ["Acceso limitado", "10 consultas IA por mes", "Primer módulo"] },
  { id: "basico", name: "Básico", price: "$9.99", per: "/ mes", features: ["Consultas IA ilimitadas", "Telegram privado", "Soporte WhatsApp", "Biblioteca completa"] },
  { id: "avanzado", name: "Avanzado", price: "$15.99", per: "/ mes", features: ["Todo del Básico", "Cursos premium", "Herramientas avanzadas", "Recursos exclusivos"], popular: true },
  { id: "anual", name: "Anual", price: "$85", per: "/ año", features: ["Acceso total", "Soporte prioritario", "Acceso anticipado", "Todos los bonos"] },
];

function Membresia() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: sub } = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("subscriptions").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  async function selectPlan(id: string) {
    if (!user) return;
    // En esta versión: actualiza plan localmente. El checkout con Stripe se conectará en el siguiente paso.
    await supabase.from("subscriptions").upsert({
      user_id: user.id, plan: id, status: "active",
      current_period_start: new Date().toISOString(),
    }, { onConflict: "user_id" });
    toast.success(`Plan ${id} activado (modo demostración)`);
    qc.invalidateQueries({ queryKey: ["subscription"] });
  }

  const hasCommunity = sub && ["basico", "avanzado", "anual"].includes(sub.plan);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl">Tu membresía</h1>
      <p className="text-muted-foreground mt-2">Plan actual: <span className="font-medium text-foreground">{PLANS.find(p => p.id === sub?.plan)?.name ?? "Gratis"}</span></p>

      <div className="mt-8 grid md:grid-cols-4 gap-4">
        {PLANS.map(p => {
          const current = sub?.plan === p.id;
          return (
            <Card key={p.id} className={`p-6 relative ${p.popular ? "border-gold shadow-glow" : ""}`}>
              {p.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest bg-gold text-gold-foreground px-3 py-1 rounded-full">Popular</span>}
              <h3 className="font-display text-lg">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl">{p.price}</span>
                <span className="text-muted-foreground text-sm">{p.per}</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {p.features.map(f => <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />{f}</li>)}
              </ul>
              <Button disabled={current} onClick={() => selectPlan(p.id)} className={`w-full mt-6 ${p.popular ? "bg-gold text-gold-foreground hover:bg-gold/90" : ""}`}>
                {current ? "Plan actual" : "Elegir"}
              </Button>
            </Card>
          );
        })}
      </div>

      {hasCommunity && (
        <div className="mt-10">
          <h2 className="font-display text-xl">Tu comunidad</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <a href="https://t.me/+caminandoporfe" target="_blank" rel="noreferrer">
              <Card className="p-6 hover:border-gold transition-colors flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#229ED9] grid place-items-center text-white"><Send className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-display">Telegram privado</h3>
                  <p className="text-xs text-muted-foreground">Comunidad exclusiva de oración</p>
                </div>
              </Card>
            </a>
            <a href="https://wa.me/18297445796" target="_blank" rel="noreferrer">
              <Card className="p-6 hover:border-gold transition-colors flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#25D366] grid place-items-center text-white"><MessageCircle className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-display">Soporte personal</h3>
                  <p className="text-xs text-muted-foreground">Atención por WhatsApp</p>
                </div>
              </Card>
            </a>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-10">Al activar un plan aceptas nuestros términos. Pronto integraremos pagos seguros con Stripe.</p>
    </div>
  );
}
