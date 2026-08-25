import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { CancelSurvey } from "@/components/CancelSurvey";
import { Check, Crown, Leaf, MessageCircle, Send, ShieldCheck, Sparkles, Sprout, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import e3dStar from "@/assets/e3d-star.png";
import e3dHeart from "@/assets/e3d-heartgem.png";
import e3dCoin from "@/assets/e3d-coin.png";

export const Route = createFileRoute("/_authenticated/membresia")({
  head: () => ({
    meta: [
      { title: "Planes ORÍGEN — Membresía" },
      { name: "description", content: "Elige entre Explorador, Caminante o Propósito ORÍGEN y abre el plan semanal, mensual o anual que encaje contigo." },
      { property: "og:title", content: "Planes ORÍGEN" },
      { property: "og:description", content: "Tres niveles de transformación con pagos semanales, mensuales y anuales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Membresia,
});

type PlanCategoryId = "explorador" | "caminante" | "proposito";
type BillingId = "weekly" | "monthly" | "annual";

type BillingPlan = {
  id: BillingId;
  name: string;
  cadence: string;
  price: string;
  url: string;
  badge?: string;
  bullets: string[];
};

type PlanCategory = {
  id: PlanCategoryId;
  name: string;
  level: string;
  claim: string;
  image: string;
  icon: typeof Sprout;
  recommended?: boolean;
  plans: BillingPlan[];
};

const CATEGORIES: PlanCategory[] = [
  {
    id: "explorador",
    name: "EXPLORADOR ORÍGEN",
    level: "Básico",
    claim: "Ideal para comenzar a explorar ORÍGEN.",
    image: e3dHeart,
    icon: Sprout,
    plans: [
      { id: "weekly", name: "EXPLORADOR ORÍGEN", cadence: "Semana", price: "US$2.99", url: "https://pay.hotmart.com/D107250120S?off=pz5lp6r7&checkoutMode=6", bullets: ["Diagnóstico completo", "Etapa inicial", "Diario limitado"] },
      { id: "monthly", name: "EXPLORADOR ORÍGEN", cadence: "Mes", price: "US$14.99", url: "https://pay.hotmart.com/D107250120S?off=2tqo0bnc&checkoutMode=6", badge: "Más elegido", bullets: ["Acceso básico continuo", "Mentora inicial", "Ejercicios diarios"] },
      { id: "annual", name: "EXPLORADOR ORÍGEN", cadence: "Año", price: "US$49.99", url: "https://pay.hotmart.com/D107250120S?off=0kyotde7&checkoutMode=6", badge: "Ahorro anual", bullets: ["Mejor precio básico", "Historial guardado", "Ruta completa inicial"] },
    ],
  },
  {
    id: "caminante",
    name: "CAMINANTE ORÍGEN",
    level: "Completo",
    claim: "Para quienes desean una experiencia más amplia.",
    image: e3dStar,
    icon: Leaf,
    recommended: true,
    plans: [
      { id: "weekly", name: "CAMINANTE ORÍGEN", cadence: "Semana", price: "US$4.99", url: "https://pay.hotmart.com/D107250120S?off=m3mf4woy&checkoutMode=6", bullets: ["Caminos abiertos", "Juegos educativos", "Ritual semanal"] },
      { id: "monthly", name: "CAMINANTE ORÍGEN", cadence: "Mes", price: "US$19.99", url: "https://pay.hotmart.com/D107250120S?off=m9cvnhi4&checkoutMode=6", badge: "Popular", bullets: ["Mentora ampliada", "Consultas guiadas", "Biblioteca esencial"] },
      { id: "annual", name: "CAMINANTE ORÍGEN", cadence: "Año", price: "US$69.99", url: "https://pay.hotmart.com/D107250120S?off=ip8loh6o&checkoutMode=6", badge: "Mejor valor", bullets: ["Ahorro anual", "Progreso completo", "Contenido descargable"] },
    ],
  },
  {
    id: "proposito",
    name: "PROPÓSITO ORÍGEN",
    level: "Premium",
    claim: "Para avanzar con máxima profundidad, dirección y constancia.",
    image: e3dCoin,
    icon: Crown,
    plans: [
      { id: "weekly", name: "PROPÓSITO ORÍGEN", cadence: "Semana", price: "US$7.99", url: "https://pay.hotmart.com/D107250120S?off=rpp21n33&checkoutMode=6", bullets: ["Acceso premium", "Rituales profundos", "Premios avanzados"] },
      { id: "monthly", name: "PROPÓSITO ORÍGEN", cadence: "Mes", price: "US$29.99", url: "https://pay.hotmart.com/D107250120S?off=z12ipqpy&checkoutMode=6", badge: "Alta conversión", bullets: ["Mentora sin fricción", "Consultas completas", "Visualizaciones premium"] },
      { id: "annual", name: "PROPÓSITO ORÍGEN", cadence: "Año", price: "US$99.99", url: "https://pay.hotmart.com/D107250120S?off=lf0finnj&checkoutMode=6", badge: "Máximo ahorro", bullets: ["Todo desbloqueado", "Trayectoria anual", "Bonos de propósito"] },
    ],
  },
];

const INCLUIDO = [
  { icon: MessageCircle, title: "Acompañamiento guiado", body: "Ruth Esther te ayuda a ordenar lo que sientes sin abrumarte." },
  { icon: Sparkles, title: "Contenido interactivo", body: "Etapas, ejercicios, juegos y cierres diarios en una sola ruta." },
  { icon: ShieldCheck, title: "Compra segura", body: "Pago procesado por Hotmart. Puedes cancelar cuando lo necesites." },
];

function Membresia() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<PlanCategoryId>("caminante");
  const [billing, setBilling] = useState<BillingId>("annual");
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: sub } = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("subscriptions").select("plan, status").eq("user_id", user!.id).maybeSingle()).data,
  });

  const category = useMemo(() => CATEGORIES.find((p) => p.id === selected) ?? CATEGORIES[1], [selected]);
  const plan = category.plans.find((p) => p.id === billing) ?? category.plans[2];
  const hasCommunity = !!sub && ["camino", "annual", "monthly", "caminante", "proposito"].includes(sub.plan);
  const currentName = sub?.plan ? sub.plan : "Explorador";

  return (
    <div className="min-h-dvh bg-aura-top">
      <div className="max-w-[1120px] mx-auto px-5 pt-7 pb-28">
        <div className="text-center max-w-[620px] mx-auto">
          <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Membresía ORÍGEN</p>
          <h1 className="font-display font-extrabold text-[32px] leading-[1.12] mt-2">
            Elige el nivel de acompañamiento que tu alma necesita
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
            Primero eliges tu nivel. Después ves sus tres formas de pago.
          </p>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Plan actual: <span className="font-semibold text-foreground capitalize">{currentName}</span>
          </p>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const active = cat.id === selected;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => { setSelected(cat.id); setBilling("annual"); }}
                aria-pressed={active}
                className={cn(
                  "relative overflow-hidden rounded-[16px] bg-card p-5 text-left border transition active:scale-[.98]",
                  active ? "border-primary ring-2 ring-primary/20 shadow-glow" : "border-border shadow-soft hover:border-primary/40",
                )}
              >
                {cat.recommended && <span className="absolute right-4 top-4 rounded-full bg-primary/12 px-3 py-1 text-[11px] font-black text-primary">Popular</span>}
                <img src={cat.image} alt="" aria-hidden loading="lazy" className="w-20 h-20 object-contain drop-shadow-[0_12px_22px_color-mix(in_oklab,var(--primary)_25%,transparent)]" />
                <div className="mt-3 flex items-start gap-3">
                  <span className={cn("w-10 h-10 rounded-[12px] grid place-items-center shrink-0", active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display font-extrabold text-[17px] leading-tight">{cat.name}</h2>
                    <p className="mt-1 text-[12px] font-bold text-primary">{cat.level}</p>
                  </div>
                </div>
                <p className="mt-3 text-[13.5px] text-muted-foreground leading-snug">{cat.claim}</p>
                <p className="mt-4 text-[12px] font-bold text-foreground">Ver precios al seleccionar</p>
              </button>
            );
          })}
        </div>

        <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
          <div className="app-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-primary">{category.level}</p>
                <h2 className="font-display font-extrabold text-[24px] leading-tight mt-1">{category.name}</h2>
                <p className="mt-2 text-[14px] text-muted-foreground">{category.claim}</p>
              </div>
              <img src={category.image} alt="" aria-hidden loading="lazy" className="w-20 h-20 object-contain" />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {category.plans.map((p) => {
                const active = p.id === billing;
                return (
                  <button
                    key={p.id}
                    onClick={() => setBilling(p.id)}
                    aria-pressed={active}
                    className={cn(
                      "relative rounded-[16px] bg-background p-4 text-left border transition active:scale-[.98]",
                      active ? "border-primary ring-2 ring-primary/18" : "border-border hover:border-primary/40",
                    )}
                  >
                    {p.badge && <span className="mb-3 inline-flex rounded-full bg-primary/12 px-2.5 py-1 text-[10.5px] font-black text-primary">{p.badge}</span>}
                    <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">{p.cadence}</p>
                    <h3 className="mt-1 font-display font-bold text-[15px] leading-tight">{p.name}</h3>
                    <p className="mt-3 font-display font-extrabold text-[23px] leading-none">{p.price}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">/{p.cadence.toLowerCase()}</p>
                    <div className={cn("absolute right-3 top-3 w-7 h-7 rounded-full grid place-items-center", active ? "bg-primary text-primary-foreground" : "bg-secondary text-transparent")}>
                      <Check className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {INCLUIDO.map((b) => (
                <div key={b.title} className="rounded-[16px] bg-background border border-border p-4">
                  <span className="w-11 h-11 rounded-[12px] bg-primary/10 grid place-items-center text-primary"><b.icon className="w-5 h-5" /></span>
                  <div className="mt-3 font-semibold text-[15px]">{b.title}</div>
                  <p className="text-[13px] text-muted-foreground leading-snug mt-1">{b.body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="app-card p-5 lg:sticky lg:top-5">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-[14px] bg-primary/10 grid place-items-center text-primary"><Star className="w-6 h-6" /></span>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Selección</p>
                <h3 className="font-display font-bold text-[17px] leading-tight">{plan.name}</h3>
              </div>
            </div>
            <p className="mt-4 font-display font-extrabold text-[32px] leading-none">{plan.price}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Pago {plan.cadence.toLowerCase()} · {category.level}</p>
            <ul className="mt-5 space-y-3">
              {plan.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[14px] leading-snug">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-primary/12 grid place-items-center text-primary shrink-0"><Check className="w-3.5 h-3.5" /></span>
                  {b}
                </li>
              ))}
            </ul>
            <a
              href={plan.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 btn-primary-gradient flex h-[54px] items-center justify-center gap-2 rounded-[12px] text-[16px] font-semibold text-primary-foreground active:scale-[.97] transition"
            >
              <Sparkles className="w-4 h-4" /> Continuar con {plan.price}
            </a>
            <p className="mt-3 text-center text-[12px] text-muted-foreground leading-snug">Pago seguro · Cancelas cuando quieras · Soporte visible</p>
            <button onClick={() => setCancelOpen(true)} className="mt-4 min-h-11 w-full text-[13px] font-medium text-muted-foreground underline underline-offset-4">
              Quiero cancelar o bajar de plan
            </button>
          </aside>
        </section>

        {hasCommunity && (
          <section className="mt-7 grid gap-3 md:grid-cols-2">
            <a href="https://t.me/+caminandoporfe" target="_blank" rel="noreferrer" className="app-card p-4 flex items-center gap-3">
              <span className="w-11 h-11 rounded-[12px] bg-primary/10 grid place-items-center text-primary"><Send className="w-5 h-5" /></span>
              <div><div className="font-semibold text-[15px]">Telegram privado</div><p className="text-[13px] text-muted-foreground">Comunidad de oración</p></div>
            </a>
            <a href="https://wa.me/18297445796" target="_blank" rel="noreferrer" className="app-card p-4 flex items-center gap-3">
              <span className="w-11 h-11 rounded-[12px] bg-primary/10 grid place-items-center text-primary"><MessageCircle className="w-5 h-5" /></span>
              <div><div className="font-semibold text-[15px]">Soporte personal</div><p className="text-[13px] text-muted-foreground">Atención por WhatsApp</p></div>
            </a>
          </section>
        )}
      </div>

      <CancelSurvey open={cancelOpen} onClose={() => setCancelOpen(false)} fromPlan={sub?.plan ?? "explorador"} />
      <button
        onClick={() => setCancelOpen(false)}
        aria-label="Cerrar"
        className="fixed right-4 top-4 hidden h-11 w-11 place-items-center rounded-full bg-card border border-border text-muted-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
