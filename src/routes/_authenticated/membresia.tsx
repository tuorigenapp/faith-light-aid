import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Check, Leaf, MessageCircle, Send, Sparkles, ShieldCheck, Eye, Infinity as InfinityIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/membresia")({
  head: () => ({
    meta: [
      { title: "Elige tu Camino ORÍGEN — Membresía" },
      { name: "description", content: "Explorador, mensual o anual: elige el ritual que abre los 365 días del Camino ORÍGEN." },
      { property: "og:title", content: "Elige tu Camino ORÍGEN" },
      { property: "og:description", content: "Planes desde US$2,99. Anual recomendado con el mejor precio por mes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Membresia,
});

type Plan = {
  id: "explorador" | "monthly" | "annual";
  name: string;
  claim: string;
  perDay: string;
  price: string;
  priceNote?: string;
  strike?: string;
  badge?: string;
  recommended?: boolean;
  url: string;
  bullets: string[];
};

const PLANS: Plan[] = [
  {
    id: "explorador",
    name: "EXPLORADOR",
    claim: "Una entrada cercana para probar el Camino sin apuro.",
    perDay: "desde 0,10 USD al día",
    price: "2,99 USD",
    priceNote: "pago único de entrada",
    url: "https://pay.hotmart.com/U107110586N?off=ys5ahbh8",
    bullets: ["1 camino completo desbloqueado", "1 consulta al mes", "Diagnóstico completo", "Palabra del día con quiz"],
  },
  {
    id: "monthly",
    name: "CAMINO ORÍGEN MENSUAL",
    claim: "Todo abierto, mes a mes, sin compromiso largo.",
    perDay: "desde 0,50 USD al día",
    price: "14,99 USD/mes",
    url: "https://pay.hotmart.com/U107110586N?off=h24bbhc6",
    bullets: ["Los 365 días de todos los caminos", "Chat con la mentora sin límite", "Consultas con PDF e historial", "Biblioteca y playlists completas"],
  },
  {
    id: "annual",
    name: "CAMINO ORÍGEN ANUAL",
    claim: "El mismo acceso total al mejor precio por mes.",
    perDay: "desde 0,25 USD al día",
    price: "7,49 USD/mes",
    strike: "14,99 USD/mes",
    priceNote: "89,99 USD al año · 7 días de prueba",
    badge: "AHORRA UN 50 %",
    recommended: true,
    url: "https://pay.hotmart.com/U107110586N?off=oi4xqwda",
    bullets: ["Todo lo del mensual", "6 meses gratis vs. mensual", "Descargables e imprimibles", "Diario ilimitado"],
  },
];

const INCLUIDO = [
  { icon: InfinityIcon, title: "Acompañamiento sin límite", body: "Chat con la mentora y caminos abiertos para avanzar a tu ritmo." },
  { icon: Eye, title: "Consultas profundas", body: "Pareja, Patrones familiares y Dios te dice hoy, con PDF e historial." },
  { icon: ShieldCheck, title: "Garantía real", body: "Si no es para ti, cancelas cuando quieras. Te avisamos antes del cobro." },
];

function Membresia() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Plan["id"]>("annual");

  const { data: sub } = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("subscriptions").select("plan, status").eq("user_id", user!.id).maybeSingle()).data,
  });

  const plan = PLANS.find((p) => p.id === selected)!;
  const hasCommunity = !!sub && ["camino", "annual", "monthly"].includes(sub.plan);
  const currentName = PLANS.find((p) => p.id === sub?.plan)?.name ?? "EXPLORADOR (gratis)";

  return (
    <div className="min-h-dvh bg-aura-top">
      <div className="max-w-[520px] mx-auto px-5 pt-7 pb-28">
        <h1 className="font-display font-extrabold text-[28px] leading-[1.15] text-center">
          Empieza tu ritual personal para volver a tu origen
        </h1>
        <p className="mt-3 text-center text-[15px] text-muted-foreground leading-relaxed">
          Elige tu plan para que cada día del Camino cuente
        </p>
        <p className="mt-2 text-center text-[12px] text-muted-foreground">
          Plan actual: <span className="font-semibold text-foreground">{currentName}</span>
        </p>

        {/* Selector de planes — deslizable */}
        <div className="mt-6 -mx-5 px-5 flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
          {PLANS.map((p) => {
            const active = p.id === selected;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                aria-pressed={active}
                className={`snap-start shrink-0 w-[86%] text-left rounded-[16px] bg-card p-5 transition ${
                  active ? "border-2 border-primary shadow-glow" : "border border-border/60 shadow-soft"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display font-extrabold text-[17px] leading-tight">{p.name}</h2>
                  <span
                    className={`w-7 h-7 shrink-0 rounded-full grid place-items-center ${
                      active ? "bg-primary text-primary-foreground" : "bg-secondary text-transparent"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </span>
                </div>
                <p className="mt-2 text-[13.5px] text-muted-foreground leading-snug">{p.claim}</p>
                <p className="mt-3 text-[13px] font-bold text-primary">{p.perDay}</p>
                {p.strike && <p className="mt-3 text-[13px] text-muted-foreground line-through">{p.strike}</p>}
                <p className="mt-1 font-display font-extrabold text-[22px]">{p.price}</p>
                {p.priceNote && <p className="text-[12px] text-muted-foreground mt-0.5">{p.priceNote}</p>}
                {p.badge && (
                  <span className="mt-3 inline-flex rounded-full bg-primary/12 px-3 py-1 text-[11px] font-bold text-primary">
                    {p.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lo que incluye el plan elegido */}
        <h3 className="mt-7 text-center font-display font-bold text-[19px]">Incluido con {plan.name}</h3>
        <ul className="mt-4 space-y-3">
          {plan.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-primary/12 grid place-items-center">
                <Check className="w-3.5 h-3.5 text-primary" />
              </span>
              <span className="text-[15px] leading-snug">{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-3">
          {INCLUIDO.map((b) => (
            <div key={b.title} className="app-card p-4 flex items-start gap-3">
              <span className="w-11 h-11 shrink-0 rounded-[12px] bg-primary/10 grid place-items-center text-primary">
                <b.icon className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-[15px]">{b.title}</div>
                <p className="text-[13.5px] text-muted-foreground leading-snug mt-0.5">{b.body}</p>
              </div>
            </div>
          ))}
        </div>

        {hasCommunity && (
          <div className="mt-8">
            <h2 className="font-display font-bold text-[17px]">Tu comunidad</h2>
            <div className="mt-3 grid gap-3">
              <a href="https://t.me/+caminandoporfe" target="_blank" rel="noreferrer" className="app-card p-4 flex items-center gap-3">
                <span className="w-11 h-11 rounded-[12px] bg-[#229ED9] grid place-items-center text-white"><Send className="w-5 h-5" /></span>
                <div><div className="font-semibold text-[15px]">Telegram privado</div><p className="text-[13px] text-muted-foreground">Comunidad de oración</p></div>
              </a>
              <a href="https://wa.me/18297445796" target="_blank" rel="noreferrer" className="app-card p-4 flex items-center gap-3">
                <span className="w-11 h-11 rounded-[12px] bg-[#25D366] grid place-items-center text-white"><MessageCircle className="w-5 h-5" /></span>
                <div><div className="font-semibold text-[15px]">Soporte personal</div><p className="text-[13px] text-muted-foreground">Atención por WhatsApp</p></div>
              </a>
            </div>
          </div>
        )}

        <p className="mt-7 text-[12px] text-muted-foreground leading-relaxed text-center">
          Cancelas cuando quieras · Te avisamos antes del cobro · Pago seguro procesado por Hotmart
        </p>
      </div>

      {/* CTA fija */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="max-w-[520px] mx-auto">
          <a
            href={plan.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-gradient flex h-[54px] items-center justify-center gap-2 rounded-[12px] text-[16px] font-semibold text-white active:scale-[.97] transition"
          >
            {plan.id === "annual" ? <><Sparkles className="w-4 h-4" /> Empezar mis 7 días gratis</> : <><Leaf className="w-4 h-4" /> Continuar con {plan.price}</>}
          </a>
        </div>
      </div>
    </div>
  );
}
