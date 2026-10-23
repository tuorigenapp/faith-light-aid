import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { CancelSurvey } from "@/components/CancelSurvey";
import { Check, ChevronRight, Crown, Eye, Infinity as InfinityIcon, Leaf, ShieldCheck, Sparkles, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/membresia")({
  head: () => ({
    meta: [
      { title: "Planes ORÍGEN — Membresía" },
      { name: "description", content: "Elige Explorador, Caminante o Propósito ORÍGEN y abre tu plan semanal, mensual o anual." },
      { property: "og:title", content: "Planes ORÍGEN" },
      { property: "og:description", content: "Tres niveles de acompañamiento con pago semanal, mensual o anual." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Membresia,
});

type LevelId = "explorador" | "caminante" | "proposito";

type BillingPlan = {
  id: "weekly" | "monthly" | "annual";
  cadence: string;
  price: string;
  perDay: string;
  url: string;
  badge?: string;
};

type Level = {
  id: LevelId;
  name: string;
  tier: string;
  claim: string;
  icon: typeof Sprout;
  popular?: boolean;
  included: string[];
  locked: string[];
  perks: { icon: typeof InfinityIcon; title: string; body: string }[];
  plans: BillingPlan[];
};

const LEVELS: Level[] = [
  {
    id: "explorador",
    name: "EXPLORADOR ORÍGEN",
    tier: "Básico",
    claim: "Ideal para comenzar a explorar ORÍGEN.",
    icon: Sprout,
    included: [
      "Diagnóstico completo de tu origen",
      "Etapa 1 del Camino ORÍGEN",
      "Palabra del día con quiz",
      "Diario con 5 entradas",
      "1 consulta al mes",
    ],
    locked: ["Caminos completos", "Mentora sin límite", "Visualízalo y Vívelo", "Descargables en PDF"],
    perks: [
      { icon: Sparkles, title: "Primer paso sin apuro", body: "Conoces tu diagnóstico y vives tu primera etapa completa." },
      { icon: ShieldCheck, title: "Cancelas cuando quieras", body: "Te avisamos antes del cobro. Pago seguro por Hotmart." },
    ],
    plans: [
      { id: "weekly", cadence: "semana", price: "US$2.99", perDay: "desde 0,43 USD al día", url: "https://pay.hotmart.com/D107250120S?off=pz5lp6r7&checkoutMode=6" },
      { id: "monthly", cadence: "mes", price: "US$14.99", perDay: "desde 0,50 USD al día", url: "https://pay.hotmart.com/D107250120S?off=2tqo0bnc&checkoutMode=6", badge: "Más elegido" },
      { id: "annual", cadence: "año", price: "US$49.99", perDay: "desde 0,14 USD al día", url: "https://pay.hotmart.com/D107250120S?off=0kyotde7&checkoutMode=6", badge: "Ahorras 72%" },
    ],
  },
  {
    id: "caminante",
    name: "CAMINANTE ORÍGEN",
    tier: "Completo",
    claim: "Para quienes desean una experiencia más amplia.",
    icon: Leaf,
    popular: true,
    included: [
      "Todo lo del Explorador",
      "Todas las etapas y caminos abiertos",
      "Juegos 3D de prácticas diarias",
      "Diario ilimitado",
      "Mentora ampliada cada día",
      "Consultas de Pareja y Patrones",
    ],
    locked: ["Rituales premium de propósito", "Premios y bonos avanzados"],
    perks: [
      { icon: InfinityIcon, title: "Acompañamiento sin límite", body: "Chat con la mentora y caminos abiertos para avanzar a tu ritmo." },
      { icon: Eye, title: "Consultas profundas", body: "Pareja, Patrones familiares y Dios te dice hoy, con PDF e historial." },
      { icon: ShieldCheck, title: "Garantía real", body: "Si no es para ti, cancelas cuando quieras. Te avisamos antes del cobro." },
    ],
    plans: [
      { id: "weekly", cadence: "semana", price: "US$4.99", perDay: "desde 0,71 USD al día", url: "https://pay.hotmart.com/D107250120S?off=m3mf4woy&checkoutMode=6" },
      { id: "monthly", cadence: "mes", price: "US$19.99", perDay: "desde 0,66 USD al día", url: "https://pay.hotmart.com/D107250120S?off=m9cvnhi4&checkoutMode=6", badge: "Popular" },
      { id: "annual", cadence: "año", price: "US$69.99", perDay: "desde 0,19 USD al día", url: "https://pay.hotmart.com/D107250120S?off=ip8loh6o&checkoutMode=6", badge: "Mejor valor" },
    ],
  },
  {
    id: "proposito",
    name: "PROPÓSITO ORÍGEN",
    tier: "Premium",
    claim: "Para avanzar con máxima profundidad y dirección.",
    icon: Crown,
    included: [
      "Todo lo del Caminante",
      "Todo ORÍGEN desbloqueado",
      "Visualízalo y Vívelo completo",
      "Ministración y Dios te dice hoy sin límite",
      "Premios, bonos y ruleta ampliada",
      "Descargables e imprimibles",
    ],
    locked: [],
    perks: [
      { icon: Crown, title: "Todo abierto", body: "Cada camino, ritual y consulta disponible desde el primer día." },
      { icon: Sparkles, title: "Bonos de propósito", body: "Contenido y premios exclusivos por tu constancia." },
      { icon: ShieldCheck, title: "Garantía real", body: "Cancelas cuando quieras y te avisamos antes del cobro." },
    ],
    plans: [
      { id: "weekly", cadence: "semana", price: "US$7.99", perDay: "desde 1,14 USD al día", url: "https://pay.hotmart.com/D107250120S?off=rpp21n33&checkoutMode=6" },
      { id: "monthly", cadence: "mes", price: "US$29.99", perDay: "desde 0,99 USD al día", url: "https://pay.hotmart.com/D107250120S?off=z12ipqpy&checkoutMode=6", badge: "Recomendado" },
      { id: "annual", cadence: "año", price: "US$99.99", perDay: "desde 0,27 USD al día", url: "https://pay.hotmart.com/D107250120S?off=lf0finnj&checkoutMode=6", badge: "Máximo ahorro" },
    ],
  },
];

function Membresia() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<LevelId | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: sub } = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("subscriptions").select("plan, status").eq("user_id", user!.id).maybeSingle()).data,
  });

  const level = useMemo(() => LEVELS.find((l) => l.id === selected) ?? null, [selected]);
  const currentName = sub?.plan ? sub.plan : "EXPLORADOR (gratis)";

  function goCheckout(url: string) {
    window.location.href = url;
  }

  return (
    <div className="min-h-dvh bg-aura-top">
      <div className="mx-auto max-w-[1120px] px-5 pt-7 pb-28">
        <header className="mx-auto max-w-[620px] text-center">
          <h1 className="font-display text-[32px] font-extrabold leading-[1.12]">
            Empieza tu ritual personal para volver a tu origen
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Elige tu plan para que cada día del Camino cuente
          </p>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            Plan actual: <span className="font-semibold text-foreground uppercase">{currentName}</span>
          </p>
        </header>

        {/* Paso 1 — niveles sin precio visible */}
        <div className="-mx-5 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {LEVELS.map((l) => {
            const active = l.id === selected;
            const Icon = l.icon;
            return (
              <Button
                variant="membership"
                key={l.id}
                onClick={() => setSelected(l.id)}
                aria-pressed={active}
                data-selected={active}
                className={cn(
                  "relative block w-[86%] shrink-0 snap-center overflow-hidden rounded-[16px] p-5 text-left transition active:scale-[.98] md:w-auto",
                )}
              >
                {l.popular && (
                  <span className="absolute left-5 top-5 rounded-full bg-primary/12 px-3 py-1 text-[10.5px] font-black uppercase tracking-widest text-primary">
                    Más popular
                  </span>
                )}
                <span
                  className={cn(
                    "absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full transition",
                    active ? "bg-primary text-primary-foreground" : "bg-primary/12",
                  )}
                >
                  {active && <Check className="h-4.5 w-4.5" />}
                </span>

                <div className="mt-10 flex items-start gap-3">
                  <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[12px]", active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                    <Icon className="h-5.5 w-5.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-[17px] font-extrabold leading-tight">
                      {l.name}
                    </h2>
                    <p className="mt-1 text-[12px] font-bold text-primary">{l.tier}</p>
                  </div>
                </div>
                <p className="mt-3 text-[13.5px] leading-snug text-muted-foreground">{l.claim}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-bold text-foreground">
                  Ver precios <ChevronRight className="h-3.5 w-3.5" />
                </p>
              </Button>
            );
          })}
        </div>

        {!level && (
          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            Toca un nivel para ver sus tres formas de pago.
          </p>
        )}

        {/* Paso 2 — los 3 bloques de pago del nivel elegido */}
        {level && (
          <div key={level.id} style={{ animation: "fade-in .35s ease-out both" }}>
            <h2 className="mt-9 text-center font-display text-[22px] font-extrabold">
              {level.name} · {level.tier}
            </h2>
            <p className="mx-auto mt-2 max-w-[440px] text-center text-[13.5px] text-muted-foreground">{level.claim}</p>

            <div className="-mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
              {level.plans.map((p) => (
                <Button
                  variant="membership"
                  key={p.id}
                  onClick={() => goCheckout(p.url)}
                  data-selected={Boolean(p.badge)}
                  className={cn(
                    "relative block w-[80%] shrink-0 snap-center rounded-[16px] p-5 text-left transition active:scale-[.98] md:w-auto",
                  )}
                >
                  {p.badge && (
                    <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-accent-pink to-primary px-3 py-1 text-[10.5px] font-black uppercase tracking-widest text-white">
                      {p.badge}
                    </span>
                  )}
                  <p className="text-[11px] font-black uppercase tracking-widest text-primary">Por {p.cadence}</p>
                  <p className="mt-3 text-[13px] font-bold text-primary">{p.perDay}</p>
                  <p className="font-display text-[30px] font-extrabold leading-tight">{p.price}</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">pago cada {p.cadence}</p>
                  <span
                    className="mt-5 flex h-[52px] items-center justify-center gap-2 rounded-[12px] bg-selection text-[15.5px] font-bold text-selection-foreground ring-2 ring-selection-border shadow-selection"
                  >
                    Empezar ahora <ChevronRight className="h-4 w-4" />
                  </span>
                </Button>
              ))}
            </div>

            <h3 className="mt-9 text-center font-display text-[21px] font-extrabold">
              Incluido con {level.name}
            </h3>
            <ul className="mx-auto mt-4 max-w-[520px] space-y-3">
              {level.included.map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/12">
                    <Check className="h-4 w-4 text-primary" />
                  </span>
                  <span className="text-[15px] leading-snug">{i}</span>
                </li>
              ))}
            </ul>

            {level.locked.length > 0 && (
              <div className="mx-auto mt-5 max-w-[520px] rounded-[16px] border border-border bg-card p-4 shadow-soft">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Se abre en niveles superiores
                </p>
                <ul className="mt-2 space-y-1.5">
                  {level.locked.map((i) => (
                    <li key={i} className="text-[13.5px] text-muted-foreground">🔒 {i}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mx-auto mt-5 max-w-[560px] space-y-3">
              {level.perks.map((k) => {
                const Icon = k.icon;
                return (
                  <div key={k.title} className="rounded-[16px] border border-border bg-card p-4 shadow-soft">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-[16px] font-bold leading-tight">{k.title}</p>
                        <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">{k.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="mx-auto mt-8 max-w-[440px] text-center text-[12.5px] leading-relaxed text-muted-foreground">
          Cancelas cuando quieras · Te avisamos antes del cobro · Pago seguro procesado por Hotmart
        </p>

        <div className="mt-6 text-center">
          <button onClick={() => setCancelOpen(true)} className="text-[13.5px] font-semibold text-muted-foreground underline">
            Quiero cancelar o bajar de plan
          </button>
        </div>
      </div>

      <CancelSurvey open={cancelOpen} onClose={() => setCancelOpen(false)} fromPlan={sub?.plan ?? null} />
    </div>
  );
}
