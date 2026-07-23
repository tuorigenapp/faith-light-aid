import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Leaf, Lock, MessageCircle, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/membresia")({
  head: () => ({ meta: [{ title: "Membresía — Reconectando" }] }),
  component: Membresia,
});

type MembershipPlan = {
  id: string;
  name: string;
  price: string;
  per: string;
  billing?: string;
  features: string[];
  popular?: boolean;
  icon: typeof Lock;
};

const PLANS: MembershipPlan[] = [
  {
    id: "explorador",
    name: "Explorador",
    price: "$0",
    per: "/ siempre",
    features: ["Onboarding personalizado", "1 respuesta diaria de Ruth", "Solo primera etapa", "Diario con límite"],
    icon: Lock,
  },
  {
    id: "monthly",
    name: "Camino Origen mensual",
    price: "$14.99",
    per: "/ mes",
    features: ["Chat con Ruth sin límite", "Etapas y ejercicios completos", "Visualízalo y Vívelo", "Pareja y patrón familiar"],
    icon: Sparkles,
  },
  {
    id: "annual",
    name: "Camino Origen anual",
    price: "$5.99",
    per: "/ mes",
    billing: "$71.88 al año",
    features: ["Todo el Camino Origen", "6 meses gratis", "7 días de prueba", "Mejor precio"],
    popular: true,
    icon: Leaf,
  },
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

  const hasCommunity = sub && ["camino", "annual", "monthly"].includes(sub.plan);

  return (
    <div className="px-4 py-6 md:p-10 max-w-6xl mx-auto mobile-safe-bottom lg:pb-10">
      <section className="hero-card">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold text-primary">
          <Sparkles className="w-3.5 h-3.5" /> 7 días de prueba en Camino Origen
        </div>
        <h1 className="font-display font-extrabold text-[30px] leading-tight mt-4">Tu plan para romper el patrón está listo</h1>
        <p className="text-muted-foreground mt-2 text-sm">Plan actual: <span className="font-semibold text-foreground">{PLANS.find(p => p.id === sub?.plan)?.name ?? "Explorador"}</span>. La información coincide con la landing: anual recomendado a $5.99/mes.</p>
      </section>

      <div className="mt-5 grid md:grid-cols-3 gap-4">
        {PLANS.map(p => {
          const current = sub?.plan === p.id;
          const Icon = p.icon;
          return (
            <Card key={p.id} className={`p-5 relative rounded-[1.25rem] ${p.popular ? "border-2 border-primary shadow-glow" : "shadow-soft"}`}>
              {p.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1 rounded-full">6 meses gratis</span>}
              <div className="w-11 h-11 rounded-2xl bg-secondary text-primary grid place-items-center mb-4"><Icon className="w-5 h-5" /></div>
              <h3 className="font-display font-bold text-lg leading-tight">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display font-extrabold text-3xl">{p.price}</span>
                <span className="text-muted-foreground text-sm">{p.per}</span>
              </div>
              {p.billing && <p className="text-xs text-primary font-bold mt-1">{p.billing}</p>}
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {p.features.map(f => <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />{f}</li>)}
              </ul>
              <Button disabled={current} onClick={() => selectPlan(p.id)} className={`w-full mt-6 rounded-[12px] h-12 ${p.popular ? "btn-primary-gradient" : ""}`} variant={p.popular ? "default" : "outline"}>
                {current ? "Plan actual" : p.id === "annual" ? "Empezar 7 días gratis" : "Elegir plan"}
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

      <p className="text-xs text-muted-foreground mt-8">Al activar un plan aceptas términos, privacidad y reembolsos. Esta pantalla deja lista la membresía; el cobro seguro se conecta al checkout.</p>
    </div>
  );
}
