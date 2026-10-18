import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import {
  ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Flame, Heart, Library,
  Mic, Network, Sparkles, Baby, Gem, Shield, Magnet, Search, Brain, TreePine, Star,
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
import avatar1 from "@/assets/community-avatar-01.png";
import avatar5 from "@/assets/community-avatar-05.png";
import avatar12 from "@/assets/community-avatar-12.png";
import prNino from "@/assets/home/pr-nino.jpg";
import prGlowM from "@/assets/home/pr-glowm.jpg";
import prGlowH from "@/assets/home/pr-glowh.jpg";
import prMag from "@/assets/home/pr-magnetico.jpg";
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
          <h3 className="font-display font-bold text-[17px] leading-tight text-[#211C32] dark:text-foreground">{title}</h3>
          {sub && <p className="text-[12.5px] text-[#777487] dark:text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
      {to && cta && (
        <Link to={to} className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#7950F5]/10 px-3 h-8 text-[12px] font-bold text-[#7950F5]">
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
      <div className="absolute inset-0 bg-gradient-to-r from-[#FFFCFF] via-[#FFFCFF]/85 to-transparent sm:via-[#FFFCFF]/70" />
      <div className="relative p-5 sm:p-7 max-w-[64%] sm:max-w-[48%]">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7950F5]">
          <Sparkles className="w-3.5 h-3.5" /> Personalizado para ti
        </span>
        <h2 className="mt-2 font-serif text-[32px] sm:text-[40px] leading-[1.05] text-[#211C32]">Tu camino continúa</h2>
        <p className="mt-2 text-[13px] leading-snug text-[#45405a]">
          {name}, Ruth Esther ya adaptó tu camino a ti. Sigue avanzando y descubre lo que viene.
        </p>
        <div className="mt-3 flex items-center gap-1" aria-label={`Etapa ${stage} de ${total}`}>
          {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
            <span key={i} className={"h-1.5 flex-1 rounded-full " + (i < Math.ceil((stage / total) * Math.min(total, 8)) ? "bg-[#7950F5]" : "bg-[#7950F5]/20")} />
          ))}
        </div>
        <p className="mt-1 text-[11px] font-semibold text-[#777487]">Etapa {stage} de {total}</p>
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
  return (
    <section>
      <SectionHead title="Los 4 pilares más TOP del Método ORÍGEN 🔥" />
      <div className={scroller + " sm:grid sm:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0"}>
        {PILLARS.map((p, i) => (
          <Link key={p.to} to={p.to} className={`relative snap-start shrink-0 w-[44%] sm:w-auto aspect-[3/4] ${card}`} style={{ animation: `fade-in .4s ease-out ${i * 60}ms both` }}>
            <img src={p.img} alt="" loading="lazy" width={768} height={1024} className="absolute inset-0 h-full w-full object-cover" />
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
      </div>
    </section>
  );
}

/* 3 · EJERCICIO */
export function DailyExerciseBanner({ done, streak }: { done: boolean; streak: number }) {
  return (
    <Link to="/ejercicios" className={`relative block min-h-[170px] ${card}`}>
      <img src={ejercicio} alt="" loading="lazy" width={1536} height={640} className="absolute inset-0 h-full w-full object-cover object-[75%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#FFFCFF] via-[#FFFCFF]/80 to-transparent" />
      <span className={"absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-3 h-8 text-[12px] font-bold shadow " + (done ? "bg-white text-[#1f8a5b]" : "bg-[#7950F5] text-white")}>
        {done ? <><Check className="w-4 h-4" /> Hecho</> : <>Comenzar <ArrowRight className="w-3.5 h-3.5" /></>}
      </span>
      <div className="relative p-5 max-w-[66%]">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7950F5]"><Sparkles className="w-3.5 h-3.5" /> Ejercicio de hoy</span>
        <h3 className="mt-1 font-display font-bold text-[18px] leading-tight text-[#211C32]">{done ? "Completaste tu ejercicio de hoy 🌿" : "Completa este ejercicio de hoy 🌿"}</h3>
        <p className="mt-1 text-[12.5px] text-[#45405a]">Recuperar la capacidad de disfrutar sin culpa, como cuando eras niño.</p>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#7950F5]/10 px-3 h-8 text-[12px] font-bold text-[#7950F5]">
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
    <section className="rounded-[22px] bg-gradient-to-br from-[#FFFCFF] to-[#F1EBFF] dark:from-card dark:to-card border border-[#7950F5]/10 p-4 shadow-[0_1px_3px_rgba(30,25,20,.06)]">
      <SectionHead title="Biblioteca Digital" sub={`Lecturas que acompañan tu proceso · ${EBOOKS.length} libros`} to="/biblioteca" cta="Ver biblioteca"
        icon={<span className="grid place-items-center w-9 h-9 rounded-[12px] bg-[#7950F5]/10 text-[#7950F5] shrink-0"><Library className="w-5 h-5" /></span>} />
      <div className="relative">
        <div ref={ref} className={scroller}>
          {EBOOKS.slice(0, 16).map((b) => (
            <Link key={b.id} to="/biblioteca" aria-label={b.title} className="snap-start shrink-0 w-[118px] rounded-[10px] overflow-hidden shadow-[0_6px_16px_rgba(33,28,50,.18)] active:scale-[.97] transition-transform">
              <img src={b.cover} alt={`Portada de ${b.title}`} loading="lazy" className="w-full aspect-[2/3] object-cover bg-secondary"
                onError={(e) => { const el = e.currentTarget; if (el.dataset["f"]) return; el.dataset["f"] = "1"; el.src = coverFallback; }} />
            </Link>
          ))}
        </div>
        <button type="button" aria-label="Anterior" onClick={() => by(-1)} className="hidden sm:grid absolute -left-2 top-1/2 -translate-y-1/2 w-9 h-9 place-items-center rounded-full bg-white shadow text-[#7950F5]"><ChevronLeft className="w-5 h-5" /></button>
        <button type="button" aria-label="Siguiente" onClick={() => by(1)} className="grid absolute -right-2 top-1/2 -translate-y-1/2 w-9 h-9 place-items-center rounded-full bg-white shadow text-[#7950F5]"><ChevronRight className="w-5 h-5" /></button>
      </div>
    </section>
  );
}

/* 5 · MENSAJE */
export function DailyMessageBanner({ name }: { name: string }) {
  return (
    <section className={`relative min-h-[180px] ${card}`}>
      <img src={mensaje} alt="" loading="lazy" width={1536} height={640} className="absolute inset-0 h-full w-full object-cover object-[80%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#fbf6ee] via-[#fbf6ee]/85 to-transparent" />
      <div className="relative p-5 max-w-[72%] sm:max-w-[55%]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7950F5]">Mensaje de hoy</span>
        <h3 className="mt-1 font-serif text-[21px] leading-tight text-[#211C32]">{name}, vuelve hoy a tu memoria sana</h3>
        <p className="mt-1 text-[12.5px] leading-snug text-[#45405a] line-clamp-3">A veces la mente corre más rápido que el corazón, y ahí es donde volver al centro se vuelve necesario. No se trata de negar lo que sientes, sino de darte espacio para comprenderlo.</p>
        <Link to="/palabra" className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#45258E] px-4 text-[13px] font-bold text-white">Ver completo <ArrowRight className="w-4 h-4" /></Link>
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
          {[avatar1, avatar5, avatar12].map((a, i) => (
            <img key={i} src={a} alt="" loading="lazy" className="w-11 h-11 rounded-full border-2 border-white/80 bg-white/20 object-cover" />
          ))}
        </div>
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/80">Comunidad ORÍGEN · Abierta para todos</p>
        <h3 className="mt-1 font-display font-bold text-[20px] leading-tight">No tienes que vivirlo en soledad.</h3>
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
];
export function HealingPracticesCarousel() {
  return (
    <section>
      <SectionHead title="Elige el dolor que quieres sanar" sub="Cada día abre una práctica corta: entiendes algo, lo trabajas y lo cierras." to="/categorias" cta="Ver todas" />
      <div className={scroller}>
        {PRACTICES.map((p) => (
          <Link key={p.id} to="/programas/$programaId" params={{ programaId: p.id }} className={`relative snap-start shrink-0 w-[46%] sm:w-[23.5%] aspect-[4/5] ${card}`}>
            <img src={p.img} alt="" loading="lazy" width={768} height={1024} className="absolute inset-0 h-full w-full object-cover" />
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

/* 9 · VISUALÍZALO */
const VISUALIZE = [
  { img: vvVis, title: "Visualización" },
  { img: vvMed, title: "Meditación" },
  { img: vvMan, title: "Manifestación" },
  { img: vvAbu, title: "Abundancia" },
  { img: vvBien, title: "Bienestar" },
];
export function VisualizeAndLiveCarousel() {
  return (
    <section>
      <SectionHead title="Visualízalo y Vívelo" sub="Crea la vida que deseas con el poder de tu mente y tu energía." to="/visualiza" cta="Ver todos"
        icon={<span className="grid place-items-center w-9 h-9 rounded-[12px] bg-[#7950F5]/10 text-[#7950F5] shrink-0"><Shield className="w-5 h-5" /></span>} />
      <div className={scroller}>
        {VISUALIZE.map((v) => (
          <Link key={v.title} to="/visualiza" className={`relative snap-start shrink-0 w-[40%] sm:w-[19%] aspect-[6/5] ${card}`}>
            <img src={v.img} alt="" loading="lazy" width={896} height={752} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211C32]/80 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-2.5 flex items-center justify-between text-white">
              <span className="font-display font-bold text-[13px]">{v.title}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* 10 · JUEGOS */
const GAMES = [
  { id: "sopa", title: "Encuentra la palabra", desc: "Sopa de letras · 2 min", Icon: Search, bg: "from-[#7950F5] to-[#9d7bff]" },
  { id: "memoria", title: "Memoria del alma", desc: "Empareja las palabras", Icon: Brain, bg: "from-[#e85fa5] to-[#F4A1D1]" },
  { id: "hojas", title: "El árbol de los sueños", desc: "Recoge hojas de sanación", Icon: TreePine, bg: "from-[#1a9e90] to-[#25B9A9]" },
  { id: "escribe", title: "Si lo crees, lo creas", desc: "El poder de tu mente", Icon: Star, bg: "from-[#d9a23f] to-[#E8C47C]" },
];
export function DailyGamesSection() {
  return (
    <section>
      <SectionHead title="Juegos del día" sub="Diez juegos mentales que trabajan justo lo que estás sanando." to="/juegos" cta="Ver los 10" />
      <div className={scroller + " sm:grid sm:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0"}>
        {GAMES.map((g) => (
          <Link key={g.id} to="/juegos/$gameId" params={{ gameId: g.id }} className={`snap-start shrink-0 w-[62%] sm:w-auto rounded-[18px] bg-gradient-to-br ${g.bg} p-3.5 text-white flex items-center gap-3 shadow-[0_4px_14px_rgba(69,37,142,.2)] active:scale-[.97] transition-transform`}>
            <span className="grid place-items-center w-11 h-11 rounded-[14px] bg-white/25 shrink-0"><g.Icon className="w-6 h-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-display font-bold text-[13.5px] leading-tight">{g.title}</span>
              <span className="block text-[11px] opacity-85">{g.desc}</span>
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
