import { useContentOverrides } from "@/hooks/use-content-overrides";
import { exploreKey } from "@/lib/explore-content";
import { ManagedImage } from "@/components/ManagedImage";
import { getPalabraHoy, dayOfYear } from "@/lib/palabra365";
import { useProfile } from "@/hooks/use-profile";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import vivMusic from "@/assets/explore/music.jpg";
import vivClean from "@/assets/explore/clean.jpg";
import vivIdentity from "@/assets/explore/identity.jpg";
import vivCristo from "@/assets/explore/christ.jpg";
import { FEATURED_EXPLORE } from "@/lib/explore-content";
import { GAMES, GameCard } from "@/components/games/DailyGames";
import exEjercicios from "@/assets/home/ex-ejercicios.jpg";
import exPremios from "@/assets/home/ex-premios.jpg";
import afiliacion from "@/assets/home/afiliacion.jpg";
import balanceImg from "@/assets/home/balance.jpg";
import {
  ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Flame, Heart, Library,
  Mic, Network, Sparkles, Baby, Gem, Shield, Magnet, Headphones, Leaf, HeartHandshake, LayoutGrid,
} from "lucide-react";
import { EBOOKS } from "@/lib/biblioteca";
import coverFallback from "@/assets/e3d-book.png";
import hero from "@/assets/home/hero.jpg";
import pMentora from "@/assets/home/pilar-mentora.jpg";
import pPareja from "@/assets/home/pilar-pareja.jpg";
import pPatron from "@/assets/home/pilar-patron.jpg";
import pDios from "@/assets/home/pilar-dios.jpg";
import ejercicio from "@/assets/home/ejercicio.jpg";
import mensaje from "@/assets/home/mensaje.jpg";
import comunidad from "@/assets/home/comunidad.jpg";
import { COMMUNITY_PORTRAITS } from "@/lib/funnel-visuals";
import prNino from "@/assets/home/pr-nino.jpg";
import prGlowM from "@/assets/home/pr-glowm.jpg";
import prGlowH from "@/assets/home/pr-glowh.jpg";
import prMag from "@/assets/home/pr-magnetico.jpg";
import prPermiso from "@/assets/home/pr-permiso.jpg";
import prDepresion from "@/assets/home/pr-depresion.jpg";
import prNarcisista from "@/assets/home/pr-narcisista.jpg";
import prPerdida from "@/assets/home/pr-perdida.jpg";
import vvVis from "@/assets/home/vv-visualizacion.jpg";
import vvMed from "@/assets/home/vv-meditacion.jpg";
import vvMan from "@/assets/home/vv-manifestacion.jpg";
import vvAbu from "@/assets/home/vv-abundancia.jpg";
import vvBien from "@/assets/home/vv-bienestar.jpg";

const card = "rounded-[22px] overflow-hidden shadow-[0_8px_30px_rgba(69,37,142,.12)] active:scale-[.98] transition-transform";
const scroller = "-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function SectionHead({ title, sub, to, cta, icon }: { title: string; sub?: string; to?: string; cta?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div className="min-w-0 flex gap-2">
        {icon}
        <div className="min-w-0">
          <h3 className="font-display font-bold text-[17px] leading-tight text-foreground">{title}</h3>
          {sub && <p className="text-[12.5px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
      {to && cta && (
        <Link to={to} className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 h-8 text-[12px] font-bold text-primary">
          {cta} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

/* 1 · HERO */
export function HomeHero({ name, stage, total, to }: { name: string; stage: number; total: number; to: string }) {
  return (
    <section className={`relative ${card} min-h-[300px] sm:min-h-[340px]`}>
      <img src={hero} alt="" width={1536} height={768} className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent sm:via-background/70" />
      <div className="relative p-5 sm:p-7 max-w-[64%] sm:max-w-[48%]">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="w-3.5 h-3.5" /> Personalizado para ti
        </span>
        <h2 className="mt-2 font-serif text-[32px] sm:text-[40px] leading-[1.05] text-foreground">Tu camino continúa</h2>
        <p className="mt-2 text-[13px] leading-snug text-foreground/75">
          Hola {name}: Ruth Esther ya adaptó tu camino a ti. Sigue avanzando y descubre lo que viene para ti.
        </p>
        <div className="mt-3 flex items-center gap-1" aria-label={`Etapa ${stage} de ${total}`}>
          {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
            <span key={i} className={"h-1.5 flex-1 rounded-full " + (i < Math.ceil((stage / total) * Math.min(total, 8)) ? "bg-[#7950F5]" : "bg-primary/20")} />
          ))}
        </div>
        <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Etapa {stage} de {total}</p>
        <Link to={to} className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#7950F5] to-[#F4A1D1] px-5 text-[14px] font-bold text-white shadow-[0_4px_14px_rgba(121,80,245,.35)]">
          Continuar mi camino <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

/* 2 · PILARES */
const PILLARS = [
  { to: "/chat", img: pMentora, tag: "Mentora en vivo", title: "Conversa con Ruth Esther", Icon: Mic, from: "from-[#45258E]", via: "via-[#7950F5]/70" },
  { to: "/pareja", img: pPareja, tag: "Relaciones", title: "¿Tu pareja es deuda o propósito?", Icon: Heart, from: "from-[#c0397f]", via: "via-[#F4A1D1]/60" },
  { to: "/patrones", img: pPatron, tag: "Análisis profundo", title: "Encuentra tu patrón familiar", Icon: Network, from: "from-[#11786d]", via: "via-[#25B9A9]/60" },
  { to: "/ministracion", img: pDios, tag: "Dios te dice hoy", title: "Dios te dice hoy", Icon: BookOpen, from: "from-[#2b3a9e]", via: "via-[#62B8F5]/50" },
];
export function OrigenPillars() {
  const { get } = useContentOverrides();
  return (
    <section>
      <SectionHead title="Los 4 pilares más TOP del Método ORÍGEN 🔥" />
      <div className={scroller + " sm:grid sm:grid-cols-5 sm:overflow-visible sm:mx-0 sm:px-0"}>
        {PILLARS.map((p, i) => (
          <Link key={p.to} to={p.to} className={`relative snap-start shrink-0 w-[44%] sm:w-auto aspect-[3/4] ${card}`} style={{ animation: `fade-in .4s ease-out ${i * 60}ms both` }}>
            <img src={get(exploreKey(FEATURED_EXPLORE.find(e => e.to === p.to)?.title ?? (p.to === "/pareja" ? "¿Deuda o propósito?" : "Dios te dice hoy")))?.cover_url || p.img} alt="" loading="lazy" width={768} height={1024} className="absolute inset-0 h-full w-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t ${p.from} ${p.via} to-transparent`} />
            <div className="absolute inset-x-0 bottom-0 p-3 text-white">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-white/25 backdrop-blur border border-white/40"><p.Icon className="w-4 h-4" /></span>
              <p className="mt-2 text-[9.5px] font-bold uppercase tracking-wider opacity-90">{p.tag}</p>
              <div className="flex items-end justify-between gap-1">
                <h4 className="font-display font-bold text-[14px] leading-tight">{p.title}</h4>
                <span className="shrink-0 grid place-items-center w-7 h-7 rounded-full bg-white/90 text-[#45258E]"><ArrowRight className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </Link>
        ))}
        <Link to="/explorar" className={`relative snap-start shrink-0 w-[44%] sm:w-auto aspect-[3/4] ${card} bg-gradient-to-br from-[#7950F5] to-[#F4A1D1] grid place-items-center text-white text-center p-4`}>
          <span>
            <span className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-white/25 border border-white/40"><LayoutGrid className="w-6 h-6" /></span>
            <span className="block mt-3 font-display font-bold text-[15px] leading-tight">Ver todas las consultas</span>
            <span className="block mt-1 text-[11.5px] opacity-90">Descubre todo lo que hay para ti</span>
          </span>
        </Link>
      </div>
    </section>
  );
}

/* 3 · EJERCICIO */
export function DailyExerciseBanner({ done, streak }: { done: boolean; streak: number }) {
  return (
    <Link to="/ejercicios" className={`relative block min-h-[170px] ${card}`}>
      <img src={ejercicio} alt="" loading="lazy" width={1536} height={640} className="absolute inset-0 h-full w-full object-cover object-[75%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <span className={"absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-3 h-8 text-[12px] font-bold shadow " + (done ? "bg-white text-[#1f8a5b]" : "bg-[#7950F5] text-white")}>
        {done ? <><Check className="w-4 h-4" /> Hecho</> : <>Comenzar <ArrowRight className="w-3.5 h-3.5" /></>}
      </span>
      <div className="relative p-5 max-w-[66%]">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary"><Sparkles className="w-3.5 h-3.5" /> Ejercicio de hoy</span>
        <h3 className="mt-1 font-display font-bold text-[18px] leading-tight text-foreground">{done ? "Completaste tu ejercicio de hoy 🌿" : "Completa este ejercicio de hoy 🌿"}</h3>
        <p className="mt-1 text-[12.5px] text-foreground/75">Recuperar la capacidad de disfrutar sin culpa, como cuando eras niño.</p>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 h-8 text-[12px] font-bold text-primary">
          <Flame className="w-4 h-4" /> Racha · {streak} {streak === 1 ? "día" : "días"}
        </span>
      </div>
    </Link>
  );
}

/* 4 · BIBLIOTECA */
export function DigitalLibraryCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const by = (d: number) => ref.current?.scrollBy({ left: d * 240, behavior: "smooth" });
  return (
    <section className="rounded-[22px] bg-gradient-to-br from-background to-secondary border border-[#7950F5]/10 p-4 shadow-[0_1px_3px_rgba(30,25,20,.06)]">
      <SectionHead title="Biblioteca Digital" sub={`Lecturas que acompañan tu proceso · ${EBOOKS.length} libros`} to="/biblioteca" cta="Ver biblioteca"
        icon={<span className="grid place-items-center w-9 h-9 rounded-[12px] bg-primary/10 text-primary shrink-0"><Library className="w-5 h-5" /></span>} />
      <div className="relative">
        <div ref={ref} className={scroller}>
          {EBOOKS.slice(0, 16).map((b) => (
            <Link key={b.id} to="/biblioteca" aria-label={b.title} className="snap-start shrink-0 w-[118px] rounded-[10px] overflow-hidden shadow-[0_6px_16px_rgba(33,28,50,.18)] active:scale-[.97] transition-transform">
              <img src={b.cover} alt={`Portada de ${b.title}`} loading="lazy" className="w-full aspect-[2/3] object-cover bg-secondary"
                onError={(e) => { const el = e.currentTarget; if (el.dataset["f"]) return; el.dataset["f"] = "1"; el.src = coverFallback; }} />
            </Link>
          ))}
        </div>
        <button type="button" aria-label="Anterior" onClick={() => by(-1)} className="hidden sm:grid absolute -left-2 top-1/2 -translate-y-1/2 w-9 h-9 place-items-center rounded-full bg-card shadow text-primary"><ChevronLeft className="w-5 h-5" /></button>
        <button type="button" aria-label="Siguiente" onClick={() => by(1)} className="grid absolute -right-2 top-1/2 -translate-y-1/2 w-9 h-9 place-items-center rounded-full bg-card shadow text-primary"><ChevronRight className="w-5 h-5" /></button>
      </div>
    </section>
  );
}

/* 5 · MENSAJE */
export function DailyMessageBanner({ name }: { name: string }) {
  const p = getPalabraHoy();
  const { data: profile } = useProfile();
  const focus = (profile?.intention as string | null) ?? "";
  // Two variations: the day's word itself, or the word applied to the person's current situation.
  const personal = !!focus && dayOfYear() % 2 === 0;
  const title = personal ? `${name}, «${p.title}» para ${focus.toLowerCase()}` : `${name}, hoy Dios te habla de «${p.title}»`;
  const body = personal ? `${p.advice} ${p.passage.reference}.` : `${p.intro} ${p.passage.reference}.`;
  return (
    <section className={`relative min-h-[180px] ${card}`}>
      <img src={mensaje} alt="" loading="lazy" width={1536} height={640} className="absolute inset-0 h-full w-full object-cover object-[80%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
      <div className="relative p-5 max-w-[72%] sm:max-w-[55%]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Palabra del día</span>
        <h3 className="mt-1 font-serif text-[21px] leading-tight text-foreground">{title}</h3>
        <p className="mt-1 text-[13px] leading-snug text-foreground/75 line-clamp-3">{body}</p>
        <Link to="/palabra" className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-bold text-primary-foreground">Ver completo <ArrowRight className="w-4 h-4" /></Link>
      </div>
    </section>
  );
}

/* 6 · COMUNIDAD */
export function OrigenCommunityBanner() {
  return (
    <Link to="/comunidad" className={`relative block min-h-[190px] ${card}`}>
      <img src={comunidad} alt="" loading="lazy" width={1536} height={640} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#2a1760]/90 via-[#45258E]/60 to-[#45258E]/20" />
      <div className="relative p-5 text-white">
        <div className="flex -space-x-3 mb-3">
          {COMMUNITY_PORTRAITS.slice(0, 3).map((a, i) => (
            <img key={i} src={a} alt="Retrato humano ilustrativo de la comunidad" loading="lazy" width={88} height={88} className="w-11 h-11 rounded-full border-2 border-community-cover-foreground/80 bg-community-cover-foreground/20 object-cover" />
          ))}
        </div>
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/80">Comunidad ORÍGEN · Abierta para todos</p>
        <h3 className="mt-1 font-display font-bold text-[20px] leading-tight text-white">No tienes que vivirlo en soledad.</h3>
        <p className="mt-1 text-[12.5px] text-white/85 max-w-[80%]">Comparte una pregunta, acompaña a alguien y encuentra nuevas perspectivas.</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-bold text-[#45258E]">Entrar a la comunidad <ArrowRight className="w-4 h-4" /></span>
          <span className="font-serif italic text-[15px] text-white/90 text-right leading-tight">Juntas también<br />sanamos ♡</span>
        </div>
      </div>
    </Link>
  );
}

/* 8 · PRÁCTICAS */
const PRACTICES = [
  { id: "nino-interior", img: prNino, title: "Niño/a interior", desc: "Sana tu pasado, abraza tu presente.", Icon: Baby, from: "from-[#e0566f]" },
  { id: "glowup-mujer", img: prGlowM, title: "Glow Up Mujer", desc: "Conviértete en tu mejor versión.", Icon: Gem, from: "from-[#b04fc9]" },
  { id: "glowup-hombre", img: prGlowH, title: "Glow Up Hombre", desc: "Disciplina, propósito y equilibrio.", Icon: Shield, from: "from-[#2468c9]" },
  { id: "magnetico", img: prMag, title: "Vuélvete Magnético/a", desc: "Atrae lo que mereces.", Icon: Magnet, from: "from-[#5b2fc9]" },
  { id: "permiso", img: prPermiso, title: "Deja de pedir permiso para existir", desc: "Tu valor no necesita aprobación.", Icon: Sparkles, from: "from-[#c07a2f]" },
  { id: "depresion-ansiedad", img: prDepresion, title: "Salir de la depresión y la ansiedad", desc: "Un paso pequeño cada día.", Icon: Heart, from: "from-[#1a7e9e]" },
  { id: "salir-narcisista", img: prNarcisista, title: "Salir de una relación narcisista", desc: "Recupera tu voz y tu paz.", Icon: Shield, from: "from-[#7a3fb0]" },
  { id: "sanar-el-dolor-de-una-perdida-desde-el-origen", img: prPerdida, title: "Sanar el dolor de una pérdida desde el ORIGEN", desc: "Honra, suelta y vuelve a vivir.", Icon: Leaf, from: "from-[#2f8a5b]" },
];
export function HealingPracticesCarousel() {
  const { get } = useContentOverrides();
  return (
    <section>
      <SectionHead title="Elige el dolor que quieres sanar" sub="Cada día abre una práctica corta: entiendes algo, lo trabajas y lo cierras." to="/categorias" cta="Ver todas" />
      <div className={scroller}>
        {PRACTICES.map((p) => (
          <Link key={p.id} to="/caminos/$caminoId" params={{ caminoId: p.id }} className={`relative snap-start shrink-0 w-[46%] sm:w-[23.5%] aspect-[4/5] ${card}`}>
            <img src={get(`camino:${p.id}`)?.cover_url || p.img} alt="" loading="lazy" width={768} height={1024} className="absolute inset-0 h-full w-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t ${p.from} via-transparent to-transparent`} />
            <div className="absolute inset-x-0 bottom-0 p-3 text-white">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-white/25 backdrop-blur border border-white/40"><p.Icon className="w-4 h-4" /></span>
              <h4 className="mt-1.5 font-display font-bold text-[14px] leading-tight">{p.title}</h4>
              <div className="flex items-end justify-between gap-1">
                <p className="text-[11px] leading-snug opacity-90">{p.desc}</p>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* 9 · VISUALÍZALO — categorías principales reales de /visualiza */
const VV_METHODS = [
  { key: "musica", title: "Oración y Reflexión con Música", desc: "Playlists guiadas de 21 días.", img: vivMusic, from: "from-[#4b2fb0]", to: "/visualiza/$categoryId", params: { categoryId: "manifestando-con-musica" } },
  { key: "limpieza", title: "Limpieza Espiritual", desc: "Oración, gratitud y renovación.", img: vivClean, from: "from-[#11786d]", to: "/visualiza/limpieza" },
  { key: "identidad", title: "Salto de Identidad", desc: "Hábitos para tu mejor versión.", img: vivIdentity, from: "from-[#b06a12]", to: "/visualiza/identidad" },
  { key: "cristo", title: "Método de Cristo 3·6·9", desc: "Fe, escritura y afirmación.", img: vivCristo, from: "from-[#2b3a9e]", to: "/visualiza/cristo" },
] as const;
const VV_FALLBACK = [vvVis, vvMed, vvMan, vvAbu, vvBien];
const VV_TINTS = ["from-[#5b2fc9]", "from-[#c0397f]", "from-[#1a7e9e]", "from-[#7a3fb0]", "from-[#2f8a5b]"];
export function VisualizeAndLiveCarousel() {
  const { get } = useContentOverrides();
  const { data } = useQuery({
    queryKey: ["home-vv-cats"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data } = await supabase.from("manifest_categories").select("id,title,subtitle,description,cover_url,is_custom,is_published").eq("is_custom", true).order("sort_order");
      return (data ?? []).filter((c) => c.is_published !== false && c.id !== "manifestando-con-musica");
    },
  });
  const items = [
    ...VV_METHODS.map((m) => ({ ...m, img: get(`imagen:visualiza:${m.key}`)?.cover_url || m.img })),
    ...(data ?? []).map((c, i) => ({
      key: c.id, title: c.title, desc: (c.subtitle || c.description || "Tema guiado con audios y práctica.").slice(0, 60),
      img: c.cover_url || VV_FALLBACK[i % VV_FALLBACK.length], from: VV_TINTS[i % VV_TINTS.length],
      to: "/visualiza/$categoryId" as const, params: { categoryId: c.id },
    })),
  ];
  return (
    <section>
      <SectionHead title="Visualízalo y Vívelo" sub="Crea la vida que deseas con el poder de tu mente y tu fe." to="/visualiza" cta="Ver todos" />
      <div className={scroller}>
        {items.map((p) => (
          <Link key={p.key} to={p.to as "/visualiza"} params={("params" in p ? p.params : undefined) as never} className={`relative snap-start shrink-0 w-[46%] sm:w-[23.5%] aspect-[4/5] ${card}`}>
            <img src={p.img} alt="" loading="lazy" width={768} height={1024} className="absolute inset-0 h-full w-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t ${p.from} via-black/10 to-transparent`} />
            <div className="absolute inset-x-0 bottom-0 p-3 text-white">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-white/25 backdrop-blur border border-white/40"><Headphones className="w-4 h-4" /></span>
              <h4 className="mt-1.5 font-display font-bold text-[14px] leading-tight">{p.title}</h4>
              <div className="flex items-end justify-between gap-1">
                <p className="text-[11px] leading-snug opacity-90 line-clamp-2">{p.desc}</p>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* 10 · JUEGOS */
const HOME_GAMES = ["sopa", "memoria", "hojas", "escribe"].flatMap((id) => {
  const game = GAMES.find((item) => item.id === id);
  return game ? [game] : [];
});
export function DailyGamesSection() {
  return (
    <section>
      <SectionHead title="Juegos del día" sub="Juegos mentales que trabajan justo lo que estás sanando." to="/juegos" cta="Ver los 10" />
      <div className={scroller + " sm:grid sm:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0"}>
        {HOME_GAMES.map((game) => <div key={game.id} className="w-[46%] shrink-0 snap-start sm:w-auto"><GameCard game={game} /></div>)}
      </div>
    </section>
  );
}

/* 11 · EXPLORA */
const EXPLORE = FEATURED_EXPLORE.map(item => ({ ...item, img: item.image, desc: item.description }));
export function ExploreOrigen() {
  const { get } = useContentOverrides();
  return (
    <section>
      <SectionHead title="Explora todo el contenido de ORÍGEN" sub="Todo lo que tienes para sanar, en un solo lugar." to="/explorar" cta="Explorar" />
      <div className="grid grid-cols-2 gap-3">
        {EXPLORE.map((e) => (
          <Link key={e.title} to={e.to} className="overflow-hidden rounded-[16px] border border-border bg-card shadow-soft transition-transform active:scale-[.98]">
            <img src={get(exploreKey(e.title))?.cover_url || e.img} alt={e.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <div className="p-3 text-card-foreground">
              <span className="text-[12px] font-semibold text-primary">{e.tag}</span>
              <h4 className="font-display font-bold text-[15px] leading-tight">{e.title}</h4>
              <div className="flex items-end justify-between gap-1 mt-0.5">
                <p className="text-[13px] leading-snug text-muted-foreground">{e.desc}</p>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* 12 · AFILIACIÓN */
export function AffiliateBanner() {
  return (
    <Link to="/invita" className={`relative block min-h-[190px] ${card}`}>
      <img src={afiliacion} alt="" loading="lazy" width={1536} height={768} className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#2a1760]/95 via-[#2a1760]/70 to-transparent" />
      <div className="relative p-5 max-w-[68%] text-white">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/85"><HeartHandshake className="w-3.5 h-3.5" /> Programa de afiliados</span>
        <h3 className="mt-1 font-display font-bold text-[20px] leading-tight">Recomienda ORÍGEN y gana comisiones</h3>
        <p className="mt-1 text-[12.5px] text-white/85">Afíliate en Hotmart y comparte con quien lo necesita.</p>
        <span className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-bold text-[#45258E]">Conocer el programa <ArrowRight className="w-4 h-4" /></span>
      </div>
    </Link>
  );
}

/* 13 · BALANCE */
export function BalanceCard({ hojas }: { hojas: number }) {
  return (
    <Link to="/comprarmonedas" className={`relative block min-h-[160px] ${card}`}>
      <img src={balanceImg} alt="" loading="lazy" width={1536} height={768} className="absolute inset-0 h-full w-full object-cover object-right" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
      <div className="relative p-5 max-w-[64%]">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary"><Leaf className="w-3.5 h-3.5" /> Tus Hojas de Sanación</span>
        <p className="mt-1 font-display font-extrabold text-[34px] leading-none text-foreground">{hojas.toLocaleString("es")}</p>
        <p className="mt-1 text-[12.5px] text-foreground/75">Úsalas en consultas, audios y premios.</p>
        <span className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-[#7950F5] to-[#F4A1D1] px-4 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(121,80,245,.3)]">Recargar hojas <ArrowRight className="w-4 h-4" /></span>
      </div>
    </Link>
  );
}
