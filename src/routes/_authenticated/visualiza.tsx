import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Sparkles, Headphones, Leaf, Star, Cross } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROGRAMAS } from "@/lib/programas";
import { DailyGames } from "@/components/games/DailyGames";
import { SeguimientoPanel } from "@/components/visualiza/SeguimientoPanel";
import { IncludesModal } from "@/components/visualiza/IncludesModal";
import { ProgramCard, type UnifiedProgram } from "@/components/visualiza/ProgramCard";
import { ProgramCardSkeleton } from "@/components/visualiza/SeguimientoSkeleton";

import heroImg from "@/assets/visualiza-hero.jpg";
import musicImg from "@/assets/viv-music.jpg";
import cleanImg from "@/assets/viv-clean.jpg";
import identityImg from "@/assets/viv-identity.jpg";
import cristoImg from "@/assets/viv-cristo.jpg";

export const Route = createFileRoute("/_authenticated/visualiza")({
  head: () => ({ meta: [{ title: "Visualízalo y Vívelo — Reconectando" }] }),
  component: Visualiza,
});

const METHODS_META = [
  {
    key: "musica",
    title: "Manifestación con Música",
    desc: "Playlists guiadas durante 21 días con música, visualización y afirmaciones diarias.",
    image: musicImg,
    Icon: Headphones,
    iconTint: "text-primary",
    chipBg: "bg-primary/12",
    gradient: "from-primary to-accent-blue",
    tint: "text-primary",
    tag: "Música",
    emoji: "🎧",
  },
  {
    key: "limpieza",
    title: "Limpieza Espiritual",
    desc: "Prácticas guiadas de renovación con oraciones, gratitud y meditación bíblica.",
    image: cleanImg,
    Icon: Leaf,
    iconTint: "text-accent-green",
    chipBg: "bg-accent-green/12",
    gradient: "from-accent-green to-primary",
    tint: "text-accent-green",
    tag: "Fe",
    emoji: "🍃",
  },
  {
    key: "identidad",
    title: "Salto de Identidad",
    desc: "Nuevos hábitos, visualización y acciones concretas para tu mejor versión.",
    image: identityImg,
    Icon: Star,
    iconTint: "text-gold",
    chipBg: "bg-gold/15",
    gradient: "from-gold to-accent-pink",
    tint: "text-gold",
    tag: "Identidad",
    emoji: "⭐",
  },
  {
    key: "cristo",
    title: "Método de Cristo 3·6·9",
    desc: "Oración, escritura, música y afirmaciones inspiradas en la fe, 21 días.",
    image: cristoImg,
    Icon: Cross,
    iconTint: "text-primary",
    chipBg: "bg-primary/12",
    gradient: "from-primary to-gold",
    tint: "text-primary",
    tag: "Fe",
    emoji: "✝️",
  },
] as const;

function Visualiza() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isCategoryRoute = /^\/visualiza\/[^/]+(?:\/[^/]+)?$/.test(pathname);
  const [filter, setFilter] = useState<string>("Todos");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["manifest-cats", user?.id],
    enabled: !isCategoryRoute,
    queryFn: async () => {
      const [cats, entries] = await Promise.all([
        supabase.from("manifest_categories").select("*").order("sort_order"),
        user
          ? supabase
              .from("manifest_entries")
              .select("audio_id, completed, updated_at, audio:manifest_audios(category_id)")
              .eq("user_id", user.id)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      if (cats.error) throw cats.error;
      return { cats: cats.data ?? [], entries: entries.data ?? [] };
    },
  });

  const doneByCat = new Map<string, number>();
  let totalDone = 0;
  const completedDates = new Set<string>();
  for (const e of data?.entries ?? []) {
    if (e.completed) {
      totalDone += 1;
      const cid = (e as any).audio?.category_id;
      if (cid) doneByCat.set(cid, (doneByCat.get(cid) ?? 0) + 1);
      if ((e as any).updated_at) completedDates.add(String((e as any).updated_at).slice(0, 10));
    }
  }
  const streak = useMemo(() => computeStreak(completedDates), [data]);

  const cats = data?.cats ?? [];
  const firstCatId = cats[0]?.id ?? null;
  const selectedCatTitle = cats.find((c: any) => (doneByCat.get(c.id) ?? 0) > 0)?.title ?? null;
  const progressPct = Math.min(100, Math.round((totalDone / 21) * 100));
  const hasAnyProgress = totalDone > 0;

  const methodTargets: { to: string; params?: Record<string, string> }[] = [
    firstCatId ? { to: "/visualiza/$categoryId", params: { categoryId: firstCatId } } : { to: "/visualiza" },
    { to: "/visualiza/limpieza" },
    { to: "/visualiza/identidad" },
    { to: "/visualiza/cristo" },
  ];

  const unified: (UnifiedProgram & { tag: string })[] = useMemo(() => {
    const methods: (UnifiedProgram & { tag: string })[] = METHODS_META.map((m, i) => {
      const target = methodTargets[i];
      const catId = target.params?.categoryId;
      return {
        key: m.key,
        title: m.title,
        desc: m.desc,
        image: m.image,
        Icon: m.Icon,
        iconTint: m.iconTint,
        chipBg: m.chipBg,
        gradient: m.gradient,
        tint: m.tint,
        emoji: m.emoji,
        days: 21,
        done: catId ? doneByCat.get(catId) ?? 0 : 0,
        to: target.to,
        params: target.params,
        tag: m.tag,
      };
    });
    const programas: (UnifiedProgram & { tag: string })[] = PROGRAMAS.map((p) => ({
      key: p.id,
      title: p.title,
      desc: p.claim,
      image: p.cover,
      Icon: Sparkles,
      iconTint: p.tint,
      chipBg: "bg-primary/12",
      gradient: p.gradient,
      tint: p.tint,
      emoji: p.emoji,
      days: 21,
      done: 0,
      to: "/programas/$programaId",
      params: { programaId: p.id },
      tag: "Sanación",
    }));
    return [...methods, ...programas];
  }, [data]);

  const tags = ["Todos", ...Array.from(new Set(unified.map((u) => u.tag)))];
  const filtered = filter === "Todos" ? unified : unified.filter((u) => u.tag === filter);

  if (isCategoryRoute) return <Outlet />;

  return (
    <div className="px-4 py-6 md:px-8 md:py-10 max-w-6xl mx-auto pb-28 space-y-6">
      {/* PORTADA */}
      <section className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2rem] shadow-glow">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/60 to-accent-pink/70" />
        <img
          src={heroImg}
          alt=""
          width={1024}
          height={1024}
          className="absolute inset-y-0 right-0 h-full w-2/3 md:w-1/2 object-cover object-center opacity-90 mix-blend-luminosity md:mix-blend-normal md:opacity-100 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-transparent md:via-primary/40" />
        <div className="relative z-10 p-6 md:p-10 max-w-xl text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 backdrop-blur px-3 py-1 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Nueva experiencia · Programa de Transformación
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl mt-4 leading-tight">Visualízalo y Vívelo</h1>
          <p className="mt-3 text-sm md:text-base text-primary-foreground/90 leading-relaxed">
            Elige el programa que mejor acompañe tu proceso de transformación. Cada uno combina herramientas guiadas para fortalecer tu fe, renovar tu mente y convertir tus metas en acciones diarias.
          </p>
          <p className="scripture mt-4 text-sm text-primary-foreground/85">
            "Dios habla. Yo creo. Yo obedezco. El Espíritu Santo guía mi camino."
          </p>
        </div>
      </section>

      {/* SEGUIMIENTO — arriba de todo */}
      <SeguimientoPanel
        loading={isLoading}
        error={!!isError}
        onRetry={() => refetch()}
        totalDone={totalDone}
        streak={streak}
        progressPct={progressPct}
        selectedCatTitle={selectedCatTitle}
        hasAnyProgress={hasAnyProgress}
      />

      {hasAnyProgress && (
        <div className="mt-2">
          <DailyGames
            title="Juegos del día"
            subtitle={`Diez juegos mentales alineados con ${selectedCatTitle ?? "tu programa"}.`}
          />
        </div>
      )}

      {/* SELECTOR ÚNICO DE PROGRAMAS */}
      <section>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-extrabold text-xl md:text-2xl">Elige tu programa</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Todos tus programas de transformación en un solo lugar.
            </p>
          </div>
          <IncludesModal />
        </div>

        <div className="mt-4 -mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 w-max">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setFilter(tag)}
                className={cn(
                  "h-9 px-4 rounded-[10px] text-[13px] font-bold border transition-all shrink-0",
                  filter === tag
                    ? "bg-primary text-primary-foreground border-primary shadow-soft"
                    : "bg-card text-foreground/70 border-border",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ProgramCardSkeleton key={i} />)
            : filtered.length === 0
              ? (
                <div className="col-span-full app-card p-8 text-center shadow-soft">
                  <p className="text-sm text-muted-foreground">No encontramos programas con ese filtro.</p>
                  <button
                    type="button"
                    onClick={() => setFilter("Todos")}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 h-11 text-sm font-bold"
                  >
                    Ver todos
                  </button>
                </div>
              )
              : filtered.map((p, i) => <ProgramCard key={p.key} program={p} delayMs={i * 60} />)}
        </div>
      </section>
    </div>
  );
}

function computeStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
