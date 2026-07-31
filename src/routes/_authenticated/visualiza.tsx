import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Headphones,
  Leaf,
  Star,
  Cross,
  ClipboardList,
  BrainCircuit,
  HandHelping,
  Heart,
  BookOpen,
  BarChart3,
  Trophy,
  Bookmark,
  Download,
  CalendarDays,
  Flame,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PROGRAMAS } from "@/lib/programas";

import heroImg from "@/assets/viv-hero.jpg";
import musicImg from "@/assets/viv-music.jpg";
import cleanImg from "@/assets/viv-clean.jpg";
import identityImg from "@/assets/viv-identity.jpg";
import cristoImg from "@/assets/viv-cristo.jpg";
import caminoImg from "@/assets/viv-camino.jpg";

export const Route = createFileRoute("/_authenticated/visualiza")({
  head: () => ({ meta: [{ title: "Visualízalo y Vívelo — Reconectando" }] }),
  component: Visualiza,
});

type MethodTheme = {
  key: string;
  title: string;
  desc: string;
  bullets: string[];
  image: string;
  Icon: typeof Headphones;
  iconTint: string;
  chipBg: string;
  gradient: string;
  cta: string;
};

const METHODS: MethodTheme[] = [
  {
    key: "musica",
    title: "Manifestación con Música",
    desc: "Playlists guiadas durante 21 días con música, visualización, afirmaciones y ejercicios diarios para mantener el enfoque en tu transformación.",
    bullets: ["21 playlists", "Audio diario", "Visualización guiada", "Afirmaciones", "Seguimiento de progreso"],
    image: musicImg,
    Icon: Headphones,
    iconTint: "text-primary",
    chipBg: "bg-primary/12",
    gradient: "from-primary to-accent-blue",
    cta: "Comenzar",
  },
  {
    key: "limpieza",
    title: "Limpieza Espiritual",
    desc: "Prácticas guiadas de renovación espiritual con oraciones, reflexión, ejercicios y desafíos diarios para fortalecer tu vida interior.",
    bullets: ["Baños de renovación", "Oraciones guiadas", "Gratitud", "Meditación bíblica", "Diario espiritual"],
    image: cleanImg,
    Icon: Leaf,
    iconTint: "text-accent-green",
    chipBg: "bg-accent-green/12",
    gradient: "from-accent-green to-primary",
    cta: "Comenzar",
  },
  {
    key: "identidad",
    title: "Salto de Identidad",
    desc: "Transforma tu identidad mediante nuevos hábitos, visualización, ejercicios y acciones concretas para convertirte en la persona que deseas ser.",
    bullets: ["Método \u201CYo Soy\u201D", "Future Self", "Scripting", "Reprogramación de creencias", "Plan de acción"],
    image: identityImg,
    Icon: Star,
    iconTint: "text-gold",
    chipBg: "bg-gold/15",
    gradient: "from-gold to-accent-pink",
    cta: "Comenzar",
  },
  {
    key: "cristo",
    title: "Método de Cristo 3·6·9",
    desc: "Programa de 21 días que combina oración, escritura, música, afirmaciones y ejercicios diarios inspirados en la fe para desarrollar disciplina espiritual.",
    bullets: ["Documento imprimible", "Audio diario", "Ejercicio 3-6-9", "Reflexión diaria", "Seguimiento de progreso"],
    image: cristoImg,
    Icon: Cross,
    iconTint: "text-primary",
    chipBg: "bg-primary/12",
    gradient: "from-primary to-gold",
    cta: "Comenzar",
  },
];

const INCLUDES = [
  { Icon: Headphones, label: "Audio guiado diario" },
  { Icon: ClipboardList, label: "Ejercicios prácticos" },
  { Icon: BrainCircuit, label: "IA especializada" },
  { Icon: HandHelping, label: "Oraciones guiadas" },
  { Icon: Heart, label: "Afirmaciones diarias" },
  { Icon: BookOpen, label: "Diario personal" },
  { Icon: BarChart3, label: "Seguimiento del progreso" },
  { Icon: Trophy, label: "Logros" },
  { Icon: Star, label: "Favoritos" },
  { Icon: Download, label: "Recursos descargables" },
  { Icon: CalendarDays, label: "Programas de 21 días" },
  { Icon: Flame, label: "Desafíos diarios" },
];

function Visualiza() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isCategoryRoute = /^\/visualiza\/[^/]+(?:\/[^/]+)?$/.test(pathname);

  const { data } = useQuery({
    queryKey: ["manifest-cats", user?.id],
    enabled: !isCategoryRoute,
    queryFn: async () => {
      const [cats, entries, intake] = await Promise.all([
        supabase.from("manifest_categories").select("*").order("sort_order"),
        user
          ? supabase.from("manifest_entries").select("audio_id, completed, audio:manifest_audios(category_id)").eq("user_id", user.id)
          : Promise.resolve({ data: [] as any[] }),
        user
          ? supabase.from("intake_sessions").select("ai_plan").eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null as any }),
      ]);
      return {
        cats: cats.data ?? [],
        entries: entries.data ?? [],
        recommended: (intake.data?.ai_plan?.recommended_categories ?? []) as string[],
      };
    },
  });

  if (isCategoryRoute) return <Outlet />;

  const doneByCat = new Map<string, number>();
  let totalDone = 0;
  for (const e of data?.entries ?? []) {
    if (e.completed) {
      totalDone += 1;
      const cid = (e as any).audio?.category_id;
      if (!cid) continue;
      doneByCat.set(cid, (doneByCat.get(cid) ?? 0) + 1);
    }
  }
  const cats = data?.cats ?? [];
  const firstCatId = cats[0]?.id ?? null;
  const selectedCatTitle = cats.find((c: any) => (doneByCat.get(c.id) ?? 0) > 0)?.title ?? null;
  const progressPct = Math.min(100, Math.round((totalDone / 21) * 100));

  // Map methods to their dedicated route.
  const methodTargets: { to: string; params?: Record<string, string> }[] = [
    firstCatId ? { to: "/visualiza/$categoryId", params: { categoryId: firstCatId } } : { to: "/visualiza" },
    { to: "/visualiza/limpieza" },
    { to: "/visualiza/identidad" },
    { to: "/visualiza/cristo" },
  ];

  return (
    <div className="px-4 py-6 md:px-8 md:py-10 max-w-6xl mx-auto pb-28 space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2rem] shadow-glow">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/60 to-accent-pink/70" />
        <img src={heroImg} alt="" width={1024} height={1024} className="absolute inset-y-0 right-0 h-full w-2/3 md:w-1/2 object-cover object-center opacity-90 mix-blend-luminosity md:mix-blend-normal md:opacity-100 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-transparent md:via-primary/40" />
        <div className="relative z-10 p-6 md:p-10 max-w-xl text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 backdrop-blur px-3 py-1 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Nueva experiencia · Programa de Transformación
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl mt-4 leading-tight">Visualízalo y Vívelo</h1>
          <p className="mt-3 text-sm md:text-base text-primary-foreground/90 leading-relaxed">
            Elige el método que mejor acompañe tu proceso de transformación. Cada programa combina herramientas guiadas para fortalecer tu fe, renovar tu mente y convertir tus metas en acciones diarias.
          </p>
          <p className="scripture mt-4 text-sm text-primary-foreground/85">
            "Dios habla. Yo creo. Yo obedezco. El Espíritu Santo guía mi camino."
          </p>
        </div>
      </section>

      {/* ETAPA 1 */}
      <section>
        <StageHeader n={1} title="Elige tu transformación" emoji="✨" sub="Selecciona el método que deseas trabajar hoy." />
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {METHODS.map((m, i) => {
            const target = methodTargets[i];
            const targetCatId = target.params?.categoryId;
            const done = targetCatId ? doneByCat.get(targetCatId) ?? 0 : 0;
            const CardBody = (
              <div className="app-card overflow-hidden h-full flex flex-col shadow-soft hover:shadow-glow transition-all">
                <div className="relative h-44">
                  <img src={m.image} alt={m.title} width={1024} height={1024} loading="lazy" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
                  <div className={cn("absolute -bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-card grid place-items-center shadow-soft border border-border")}>
                    <div className={cn("w-11 h-11 rounded-full grid place-items-center", m.chipBg)}>
                      <m.Icon className={cn("w-5 h-5", m.iconTint)} />
                    </div>
                  </div>
                  {done > 0 && (
                    <div className="absolute top-3 right-3 rounded-full bg-black/45 backdrop-blur text-white px-2.5 py-1 text-[11px] font-bold">
                      {done}/21
                    </div>
                  )}
                </div>
                <div className="p-5 pt-8 flex-1 flex flex-col text-center">
                  <h3 className="font-display font-extrabold text-lg leading-tight">{m.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{m.desc}</p>
                  <ul className="mt-4 space-y-1.5 text-left">
                    {m.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className={cn("w-4 h-4 shrink-0", m.iconTint)} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={cn("mt-5 rounded-full h-11 grid place-items-center text-sm font-bold text-white bg-gradient-to-r shadow-soft", m.gradient)}>
                    <span className="inline-flex items-center gap-2">{m.cta} <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </div>
              </div>
            );
            return (
              <Link
                key={m.key}
                to={target.to as any}
                params={target.params as any}
                className="block"
              >
                {CardBody}
              </Link>
            );
          })}
        </div>
      </section>

      {/* PROGRAMAS DE 21 DÍAS */}
      <section>
        <StageHeader n={2} title="Nuevos programas de 21 días" emoji="🔥" sub="Semana 1 incluida. Las semanas 2 y 3 se abren con 10 hojas de sanación cada una." />
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {PROGRAMAS.map((p) => (
            <Link key={p.id} to="/programas/$programaId" params={{ programaId: p.id }} className="block">
              <div className="app-card overflow-hidden h-full flex flex-col shadow-soft hover:shadow-glow transition-all active:scale-[.97]">
                <img src={p.cover} alt={p.title} width={1024} height={1024} loading="lazy" className="aspect-square w-full object-cover" />
                <div className="p-5 flex-1 flex flex-col">
                  <div className={cn("text-[11px] font-bold uppercase tracking-widest", p.tint)}>21 días · {p.emoji}</div>
                  <h3 className="font-display font-extrabold text-[19px] leading-tight mt-1">{p.title}</h3>
                  <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{p.claim}</p>
                  <div className={cn("mt-4 h-12 rounded-[12px] grid place-items-center text-[15px] font-semibold text-white bg-gradient-to-r shadow-soft", p.gradient)}>
                    <span className="inline-flex items-center gap-2">Entrar <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>


      {/* ETAPA 2 */}
      <section>
        <StageHeader n={2} title="¿Qué incluye cada programa?" sub="Cada experiencia está diseñada para acompañarte paso a paso en tu transformación." />
        <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
          {INCLUDES.map(({ Icon, label }) => (
            <div key={label} className="app-card p-3 flex flex-col items-center text-center gap-2 shadow-soft">
              <div className="w-11 h-11 rounded-2xl bg-brand-soft grid place-items-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[11px] leading-tight text-foreground/80 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ETAPA 3 */}
      <section>
        <StageHeader n={3} title="Tu transformación comienza hoy" emoji="💗" />
        <div className="mt-5 grid lg:grid-cols-2 gap-4">
          <div className="relative overflow-hidden rounded-[1.75rem] shadow-soft min-h-[280px]">
            <img src={caminoImg} alt="Tu camino" width={1024} height={1024} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/10 to-transparent" />
            <div className="relative z-10 h-full min-h-[280px] p-5 flex flex-col justify-end">
              <div className="grid grid-cols-4 gap-2">
                {METHODS.map((m) => (
                  <div key={m.key} className="rounded-2xl bg-white/85 backdrop-blur px-2 py-2 text-center shadow-soft">
                    <div className={cn("w-8 h-8 mx-auto rounded-full grid place-items-center", m.chipBg)}>
                      <m.Icon className={cn("w-4 h-4", m.iconTint)} />
                    </div>
                    <div className="text-[10px] font-bold text-foreground mt-1 leading-tight">{m.title.split(" ").slice(0, 2).join(" ")}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="app-card p-5 md:p-6 shadow-soft">
            <p className="text-sm text-muted-foreground leading-relaxed">
              No importa con cuál método comiences. Lo importante es dar el primer paso y mantener la constancia. Cada programa está diseñado para ayudarte a avanzar un día a la vez mediante prácticas guiadas, reflexión y acciones concretas.
            </p>
            <div className="mt-5 rounded-[1.3rem] bg-brand-soft p-4">
              <div className="text-sm font-extrabold">Tu progreso</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <ProgressStat Icon={Compass} label="Método seleccionado" value={selectedCatTitle ?? "—"} />
                <ProgressStat Icon={CalendarDays} label="Día actual" value={String(Math.max(1, totalDone + 1))} accent="text-primary" />
                <ProgressStat Icon={CheckCircle2} label="Días completados" value={String(totalDone)} accent="text-accent-green" />
                <ProgressStat Icon={Flag} label="Próximo desafío" value="Hoy" accent="text-accent-pink" />
                <ProgressStat Icon={Clock} label="Tiempo invertido" value={`${totalDone * 10} min`} />
                <div className="rounded-2xl bg-card border border-border p-3">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                    <Bookmark className="w-3.5 h-3.5" /> Nivel de progreso
                  </div>
                  <div className="mt-1.5 font-display font-extrabold text-lg">{progressPct}%</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent-pink" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {firstCatId && (
          <Link to="/visualiza/$categoryId" params={{ categoryId: firstCatId }} className="block mt-5">
            <div className="rounded-full h-14 grid place-items-center text-white font-bold text-base shadow-glow bg-gradient-to-r from-primary via-accent-pink to-gold hover:brightness-105 transition">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Comenzar mi transformación
              </span>
            </div>
          </Link>
        )}
      </section>
    </div>
  );
}

function StageHeader({ n, title, sub, emoji }: { n: number; title: string; sub?: string; emoji?: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center rounded-lg bg-primary text-primary-foreground px-2.5 py-1 text-[10px] font-extrabold tracking-widest uppercase">
          Etapa {n}
        </span>
        <h2 className="font-display font-extrabold text-xl md:text-2xl">
          {title} {emoji && <span className="align-middle">{emoji}</span>}
        </h2>
      </div>
      {sub && <p className="text-sm text-muted-foreground mt-2">{sub}</p>}
    </div>
  );
}

function ProgressStat({ Icon, label, value, accent }: { Icon: typeof Compass; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-3">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className={cn("mt-1.5 font-display font-extrabold text-lg truncate", accent)}>{value}</div>
    </div>
  );
}
