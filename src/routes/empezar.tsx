import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import bookImg from "@/assets/libro-oficial-mockup.png";
import { BOOK_AMAZON_URL } from "@/lib/pdf-brand";
import { ArrowLeft, Check, X, Heart, Sparkles, Brain, Coins, Users, Compass, Headphones, NotebookPen, BookOpen, Lock, ShieldCheck, Map, FileText, Gamepad2, Clock, Gift, Globe2, Download, Sun, TreePine, HeartHandshake, Smartphone, BadgeCheck, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ReviewsSlider } from "@/components/ReviewsSlider";
import { printConsulta } from "@/lib/print-pdf";
import { detectCurrency, discounted, formatLocal, formatUsd, USD, type LocalCurrency } from "@/lib/currency";
import logo from "@/assets/logo-origen.png";
import { DESIRE_PHOTOS, STRUGGLE_PHOTOS, RESULT_PHOTOS, TODAY_PHOTOS, FUTURE_PHOTOS } from "@/lib/funnel-visuals";
import { nextFunnelVariation } from "@/lib/funnel-visual-rotation";
import { illustrativeImpactScore } from "@/lib/funnel-impact";
import { FUNNEL_BOOKS } from "@/lib/funnel-books";
import { ChevronLeft, ChevronRight } from "lucide-react";
import gift from "@/assets/funnel/gift.png";
import mockup from "@/assets/funnel/mockup.png";
import dashboardAsset from "@/assets/funnel/shots/dashboard.png.asset.json";
const shotDashboard = dashboardAsset.url;
import shotChat from "@/assets/funnel/shots/chat.jpg";
import shotPareja from "@/assets/funnel/shots/pareja.jpg";
import shotPatrones from "@/assets/funnel/shots/patrones.jpg";
import shotMinistracion from "@/assets/funnel/shots/ministracion.jpg";
import shotEjercicios from "@/assets/funnel/shots/ejercicios.jpg";
import shotBiblioteca from "@/assets/funnel/shots/biblioteca.jpg";
import shotCategorias from "@/assets/funnel/shots/categorias.jpg";
import shotRuleta from "@/assets/funnel/shots/ruleta.jpg";
import juegosAsset from "@/assets/funnel/shots/juegos.png.asset.json";
import shotComprar from "@/assets/funnel/shots/comprarmonedas.jpg";
import shotHistorial from "@/assets/funnel/shots/historial.jpg";
import shotArbol from "@/assets/funnel/shots/arbol.jpg";
import shotInvita from "@/assets/funnel/shots/invita.jpg";
import palabraAsset from "@/assets/funnel/shots/palabra.png.asset.json";
import familyTreeAsset from "@/assets/funnel/shots/mi-arbol.png.asset.json";
import eHeadphones from "@/assets/e3d-headphones.png";
import ePractice from "@/assets/e3d-practice.png";
import eBook from "@/assets/e3d-book.png";
import eCross from "@/assets/e3d-cross.png";
import eCouple from "@/assets/e3d-couple.png";
import eHeart from "@/assets/e3d-heartgem.png";
import eStar from "@/assets/e3d-star.png";

export const Route = createFileRoute("/empezar")({
  head: () => ({
    meta: [
      { title: "Tu evaluación ORÍGEN — descubre tu patrón" },
      { name: "description", content: "Responde 7 preguntas y recibe tu mapa personalizado para romper los patrones que vienes cargando." },
      { property: "og:title", content: "Tu evaluación ORÍGEN" },
      { property: "og:description", content: "Descubre de dónde viene lo que repites y cómo transformarlo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Funnel,
});

// ---------- Plans (Hotmart) ----------
type Cadence = "weekly" | "monthly" | "annual";
type Level = { id: string; name: string; claim: string; img: string; usd: Record<Cadence, number>; url: Record<Cadence, string>; off: Record<Cadence, string>; perks: string[] };
const H = (o: string) => `https://pay.hotmart.com/D107250120S?off=${o}&checkoutMode=6`;
const LEVELS: Level[] = [
  { id: "explorador", name: "EXPLORADOR ORÍGEN", claim: "Para dar tu primer paso", img: eStar, usd: { weekly: 2.99, monthly: 14.99, annual: 49.99 },
    url: { weekly: H("pz5lp6r7"), monthly: H("2tqo0bnc"), annual: H("0kyotde7") }, off: { weekly: H("1n9cgz6n"), monthly: H("9mne3xdg"), annual: H("3si9u63f") },
    perks: ["Diagnóstico de tu origen", "Etapa 1 del Camino ORÍGEN", "Diario y Palabra del día"] },
  { id: "caminante", name: "CAMINANTE ORÍGEN", claim: "La experiencia completa", img: eHeart, usd: { weekly: 4.99, monthly: 19.99, annual: 69.99 },
    url: { weekly: H("m3mf4woy"), monthly: H("m9cvnhi4"), annual: H("ip8loh6o") }, off: { weekly: H("gv5wx433"), monthly: H("7jifsui7"), annual: H("zqn998l2") },
    perks: ["Camino de 20 etapas completo", "Visualízalo y Vívelo", "Consultas con PDF"] },
  { id: "proposito", name: "PROPÓSITO ORÍGEN", claim: "Acompañamiento total", img: eCross, usd: { weekly: 7.99, monthly: 29.99, annual: 99.99 },
    url: { weekly: H("rpp21n33"), monthly: H("z12ipqpy"), annual: H("lf0finnj") }, off: { weekly: H("8yqx728h"), monthly: H("k7ymwjcn"), annual: H("fcbnhwb8") },
    perks: ["Todo lo de Caminante", "Mentora y consultas sin límite", "Biblioteca y bonos VIP"] },
];
const CAD: { id: Cadence; label: string; per: string; days: number }[] = [
  { id: "weekly", label: "Semanal", per: "semana", days: 7 },
  { id: "monthly", label: "Mensual", per: "mes", days: 30 },
  { id: "annual", label: "Anual", per: "año", days: 365 },
];
const OFF_PCT: Record<Cadence, number> = { weekly: 65, monthly: 80, annual: 80 };
type Mode = "normal" | "discount" | "trial";

function priceOf(l: Level, c: Cadence, mode: Mode) {
  return mode === "discount" ? discounted(l.usd[c], OFF_PCT[c]) : l.usd[c];
}
function linkOf(l: Level, c: Cadence, mode: Mode) {
  return mode === "discount" ? l.off[c] : l.url[c];
}

// ---------- Quiz data ----------
const DESEOS = [
  { id: "sanar", img: DESIRE_PHOTOS.sanar, t: "Sanar heridas emocionales", d: "Superar el pasado y dejar de repetir los mismos errores." },
  { id: "fe", img: DESIRE_PHOTOS.fe, t: "Fortalecer mi paz interior y fe", d: "Encontrar dirección y calmar el ruido mental." },
  { id: "abundancia", img: DESIRE_PHOTOS.abundancia, t: "Encontrar bienestar y propósito", d: "Cuidar mis finanzas sin culpa y reconocer mi valor." },
  { id: "identidad", img: DESIRE_PHOTOS.identidad, t: "Renovar mi identidad y autoestima", d: "Seguridad interna sin buscar aprobación." },
];
const AREAS = [
  { id: "Emocional", icon: Heart }, { id: "Espiritual", icon: Sparkles }, { id: "Mental", icon: Brain },
  { id: "Financiera", icon: Coins }, { id: "Relaciones", icon: Users }, { id: "Propósito", icon: Compass },
];
const DETONANTES = [
  { id: "miedo", img: STRUGGLE_PHOTOS.miedo, t: "Miedos e inseguridades que paralizan mis decisiones." },
  { id: "culpa", img: STRUGGLE_PHOTOS.culpa, t: "Pensamientos repetitivos, culpa y cargas del pasado." },
  { id: "constancia", img: STRUGGLE_PHOTOS.constancia, t: "Falta de constancia: empiezo y abandono." },
  { id: "claridad", img: STRUGGLE_PHOTOS.claridad, t: "No tengo claridad de por dónde empezar a sanar." },
];
const GUIAS = [
  { id: "audio", img: eHeadphones, t: "Con audios, respiración y afirmaciones", d: "Para calmar la ansiedad y conectar rápido." },
  { id: "practica", img: ePractice, t: "Con ejercicios prácticos y reflexión", d: "Para escribir y desahogar en tu diario." },
  { id: "fe", img: eBook, t: "Con enseñanzas de fe y sabiduría interior", d: "Para conectar con principios espirituales." },
];
const SCREENS = [
  { img: shotDashboard, t: "Tu inicio", d: "Tu misión del día, racha y todo tu camino" },
  { img: shotCategorias, t: "Caminos ORÍGEN", d: "20 etapas, una lección nueva cada día" },
  { img: shotChat, t: "Mentora ORÍGEN", d: "Te acompaña y te escucha 24/7" },
  { img: shotMinistracion, t: "Dios te dice hoy", d: "Una palabra personal cada día" },
  { img: shotPareja, t: "Tu pareja de destino", d: "Entiende lo que hay entre ustedes" },
  { img: shotPatrones, t: "Patrones generacionales", d: "Descubre lo que se repite en tu familia" },
  { img: shotEjercicios, t: "Ejercicios diarios", d: "Prácticas cortas que sí se sienten" },
  { img: shotBiblioteca, t: "Biblioteca digital", d: "Un pack de libros nuevo cada semana" },
  { img: juegosAsset.url, t: "Juegos del día", d: "Gimnasia emocional de 3 minutos" },
  { img: shotRuleta, t: "Ruleta de premios", d: "Un giro cada 24 horas, siempre ganas" },
  { img: shotArbol, t: "Árbol de Sanación", d: "Mira crecer tu avance con cada paso" },
  { img: familyTreeAsset.url, t: "Tu árbol generacional", d: "Conoce tus raíces y organiza tu historia familiar" },
  { img: palabraAsset.url, t: "Palabra del día", d: "Escritura, reflexión y oración para cada día" },
  { img: shotComprar, t: "Hojas de Sanación", d: "Tu moneda de avance dentro de la app" },
  { img: shotHistorial, t: "Tu historial", d: "Todas tus respuestas guardadas en PDF" },
  { img: shotInvita, t: "Programa de afiliados", d: "Gana compartiendo ORÍGEN" },
];

type Stage = "quiz" | "paywall" | "offer80";
type Popup = null | "scratch" | "free";

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, []);
  return `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
}

function Funnel() {
  const [step, setStep] = useState(1);
  const [stage, setStage] = useState<Stage>("quiz");
  const [popup, setPopup] = useState<Popup>(null);
  const shown = useRef<{ scratch: boolean; free: boolean }>({ scratch: false, free: false });
  const [cur, setCur] = useState<LocalCurrency>(USD);
  const [name, setName] = useState("");
  const [deseo, setDeseo] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [raices, setRaices] = useState("");
  const [deton, setDeton] = useState("");
  const [guia, setGuia] = useState("");
  const [visualVariant, setVisualVariant] = useState<number | null>(null);

  useEffect(() => {
    if (step !== 9 || visualVariant !== null) return;
    let previous: number | null = null;
    try {
      const stored = localStorage.getItem("origen-funnel-last-visual");
      if (stored !== null) previous = Number(stored);
    } catch { /* Visuals still work without browser storage. */ }
    const variant = nextFunnelVariation(`${deseo}|${deton}|${areas.join("|")}`, previous);
    setVisualVariant(variant);
    try { localStorage.setItem("origen-funnel-last-visual", String(variant)); } catch { /* no storage */ }
  }, [step, visualVariant, deseo, deton, areas]);

  useEffect(() => { setCur(detectCurrency()); }, []);
  useEffect(() => {
    try { localStorage.setItem("origen_preonboarding", JSON.stringify({ name, deseo, areas, raices, detonante: deton, guia })); } catch { /* no storage */ }
  }, [name, deseo, areas, raices, deton, guia]);

  // Exit intent: 1st attempt on the paywall → scratch card; attempt on the discount page → free trial.
  const tryExit = useCallback(() => {
    if (stage === "paywall" && !shown.current.scratch) { shown.current.scratch = true; setPopup("scratch"); return true; }
    if (stage === "offer80" && !shown.current.free) { shown.current.free = true; setPopup("free"); return true; }
    return false;
  }, [stage]);
  useEffect(() => {
    if (stage === "quiz") return;
    const onOut = (e: MouseEvent) => { if (!e.relatedTarget && e.clientY <= 8) tryExit(); };
    const onPop = () => { if (tryExit()) history.pushState(null, "", location.href); };
    const onVis = () => { if (document.visibilityState === "hidden") tryExit(); };
    const onUnload = (e: BeforeUnloadEvent) => { if (tryExit()) { e.preventDefault(); e.returnValue = ""; } };
    history.pushState(null, "", location.href);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("popstate", onPop);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onUnload);
    return () => { document.removeEventListener("mouseout", onOut); window.removeEventListener("popstate", onPop); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("beforeunload", onUnload); };
  }, [stage, tryExit]);

  const progress = [5, 15, 25, 35, 45, 55, 70, 95, 100][step - 1];
  const first = name.trim().split(" ")[0] || "";
  const next = () => setStep((s) => s + 1);
  const autoNext = () => setTimeout(next, 300);
  // Sin suscripción no hay acceso: salir siempre devuelve a la oferta con descuento.
  const leave = () => { if (!tryExit()) { setStage("offer80"); window.scrollTo(0, 0); } };

  const popups = <>
    {popup === "scratch" && <ScratchPopup name={first} onClaim={() => { setPopup(null); setStage("offer80"); window.scrollTo(0, 0); }} onClose={() => setPopup(null)} />}
    {popup === "free" && <FreePopup cur={cur} onClose={() => setPopup(null)} onSkip={() => { setPopup(null); setStage("offer80"); setTimeout(toPlans, 60); }} />}
  </>;

  if (stage === "paywall") return <><Paywall name={first} cur={cur} variant={visualVariant ?? 0} onClose={leave} />{popups}</>;
  if (stage === "offer80") return <><Offer80 name={first} cur={cur} onClose={leave} />{popups}</>;

  const welcome = step === 1;
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background px-4 pb-8 pt-4">
      {welcome && <>
        <img src={DESIRE_PHOTOS.fe} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
      </>}
      {!welcome && <div aria-hidden className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/10 to-transparent" />}
      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md flex-col">
        <header className="flex items-center justify-between">
          {step > 1 && step < 8 ? <button aria-label="Atrás" onClick={() => setStep(step - 1)} className="grid h-11 w-11 place-items-center rounded-xl text-foreground"><ArrowLeft className="h-5 w-5" /></button> : <span className="h-11 w-11" />}
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground"><img src={logo} alt="" className="h-8 w-8 object-contain" />ORÍGEN</Link>
          <span className="h-11 w-11" />
        </header>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/70"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} /></div>

        <section key={step} className="flex flex-1 flex-col animate-in fade-in slide-in-from-right-4 duration-300">
          {step === 1 && <>
            <div className="mt-auto" />
            <img src={logo} alt="ORÍGEN" className="mx-auto h-24 w-24 object-contain drop-shadow-2xl" />
            <h1 className="mt-6 text-center font-display text-[34px] font-bold leading-tight text-foreground">Deja de repetir la historia que no elegiste.</h1>
            <p className="mt-4 text-center text-base text-foreground/80">En 2 minutos descubrimos de dónde vienen tus patrones y cómo empezar a romperlos.</p>
            <div className="mt-6 flex justify-center gap-4 text-xs font-semibold text-foreground/80">
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-primary" />Privado</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" />2 minutos</span>
              <span className="flex items-center gap-1"><Heart className="h-4 w-4 text-primary" />Respeta tu fe</span>
            </div>
            <div className="pt-8"><Cta onClick={next}>Comenzar mi evaluación</Cta></div>
          </>}

          {step === 2 && <>
            <Bubble>¿Cómo te gustaría que te llamemos?</Bubble>
            <p className="mt-3 text-center text-sm text-muted-foreground">Personalizaremos tu experiencia y tu mapa de sanación con tu nombre.</p>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Escribe tu nombre o apodo" className="mt-6 min-h-[52px] w-full rounded-xl border-[1.5px] border-border bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20" />
            <div className="mt-4"><Cta disabled={!name.trim()} onClick={next}>Continuar</Cta></div>
          </>}

          {step === 3 && <>
            <Bubble>Hola {first}, ¿qué deseas transformar hoy?</Bubble>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {DESEOS.map((o) => <Button variant="outline" key={o.id} onClick={() => { setDeseo(o.id); autoNext(); }} className={cn("block h-auto whitespace-normal overflow-hidden rounded-2xl border-2 bg-card p-0 text-left transition active:scale-[.97]", deseo === o.id ? "border-primary" : "border-transparent shadow-sm")}>
                <img src={o.img} alt={`Escena ilustrativa: ${o.t}`} width={768} height={768} className="aspect-square w-full object-contain" />
                <div className="p-3"><p className="text-sm font-bold leading-snug text-foreground">{o.t}</p><p className="mt-1 text-xs text-muted-foreground">{o.d}</p></div>
              </Button>)}
            </div>
          </>}

          {step === 4 && <>
            <Bubble>¿Qué áreas sientes hoy más bloqueadas?</Bubble>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {AREAS.map(({ id, icon: Icon }) => { const on = areas.includes(id); return <button key={id} onClick={() => setAreas(on ? areas.filter((a) => a !== id) : [...areas, id])} className={cn("flex min-h-[60px] items-center gap-3 rounded-full border-[1.5px] px-4 text-left text-sm font-semibold transition active:scale-[.97]", on ? "border-primary bg-primary text-primary-foreground" : "border-primary/40 bg-card text-primary")}><Icon className="h-5 w-5 shrink-0" />{id}</button>; })}
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">Puedes elegir varias</p>
            <div className="mt-auto pt-6"><Cta disabled={!areas.length} onClick={next}>Continuar</Cta></div>
          </>}

          {step === 5 && <>
            <Bubble>¿De dónde sientes que viene este peso?</Bubble>
            <p className="mt-3 text-sm text-muted-foreground">Escribe una situación o patrón que se repite en tu familia (divorcios, escasez, miedos, silencios…).</p>
            <textarea value={raices} onChange={(e) => setRaices(e.target.value)} maxLength={1000} rows={6} placeholder="Escribe aquí lo que sientes o vives en tu familia…" className="mt-5 w-full rounded-2xl border-[1.5px] border-border bg-card p-4 text-base text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20" />
            <p className="mt-1 text-right text-xs text-muted-foreground">{raices.length}/1000</p>
            <div className="mt-auto pt-6"><Cta disabled={raices.trim().length < 3} onClick={next}>Continuar</Cta></div>
          </>}

          {step === 6 && <>
            <Bubble>¿Qué te frena más cuando intentas cambiar?</Bubble>
            <div className="mt-6 grid gap-3">
              {DETONANTES.map((o) => <Button variant="outline" key={o.id} onClick={() => { setDeton(o.id); autoNext(); }} className={cn("flex h-auto whitespace-normal items-center gap-3 overflow-hidden rounded-2xl border-2 bg-card p-2 pr-4 text-left transition active:scale-[.97]", deton === o.id ? "border-primary" : "border-transparent shadow-sm")}>
                <img src={o.img} alt="Escena ilustrativa de reflexión personal" width={768} height={768} className="h-24 w-24 shrink-0 rounded-xl object-contain" /><span className="text-sm font-semibold text-foreground">{o.t}</span>
              </Button>)}
            </div>
          </>}

          {step === 7 && <>
            <Bubble>¿Cómo prefieres recibir tus herramientas diarias?</Bubble>
            <div className="mt-6 grid gap-3">
              {GUIAS.map((o) => <button key={o.id} onClick={() => { setGuia(o.id); setTimeout(() => setStep(8), 300); }} className={cn("flex items-center gap-3 rounded-2xl border-2 bg-card p-4 text-left transition active:scale-[.97]", guia === o.id ? "border-primary" : "border-transparent shadow-sm")}>
                <img src={o.img} alt="" className="h-14 w-14 shrink-0 object-contain" /><span><span className="block text-sm font-bold text-foreground">{o.t}</span><span className="block text-xs text-muted-foreground">{o.d}</span></span>
              </button>)}
            </div>
          </>}

          {step === 8 && <Analysis name={first} onDone={next} />}
          {step === 9 && <Result name={first} areas={areas} variant={visualVariant} onNext={() => { setStage("paywall"); window.scrollTo(0, 0); }} />}
        </section>
      </div>
    </main>
  );
}

// ---------- Shared UI ----------
function Cta({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return <button disabled={disabled} onClick={onClick} className={cn("min-h-[56px] w-full rounded-xl bg-primary px-5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[.97] disabled:opacity-40 disabled:shadow-none", className)}>{children}</button>;
}
function Bubble({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 flex items-center gap-3">
    <img src={logo} alt="" className="h-16 w-16 shrink-0 object-contain drop-shadow-lg" />
    <div className="relative flex-1 rounded-2xl bg-card p-4 shadow-sm"><h1 className="font-display text-xl font-bold leading-snug text-foreground">{children}</h1></div>
  </div>;
}
function Tick({ children }: { children: React.ReactNode }) {
  return <li className="flex items-start gap-2 text-sm text-foreground"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15"><Check className="h-3 w-3 text-primary" /></span>{children}</li>;
}
function SectionTitle({ kicker, children }: { kicker?: string; children: React.ReactNode }) {
  return <div className="mt-12 text-center">{kicker && <p className="text-xs font-bold uppercase tracking-widest text-primary">{kicker}</p>}<h2 className="mt-1 font-display text-2xl font-bold leading-tight text-foreground">{children}</h2></div>;
}

function Analysis({ name, onDone }: { name: string; onDone: () => void }) {
  const lines = ["Cruzando tus respuestas con patrones generacionales", "Evaluando impacto en relaciones y prosperidad", "Diseñando tu mapa personalizado de 20 etapas"];
  const [p, setP] = useState(0);
  useEffect(() => { const t = setInterval(() => setP((v) => { if (v >= 300) { clearInterval(t); return v; } return v + 3; }), 50); return () => clearInterval(t); }, []);
  useEffect(() => { if (p >= 300) { const t = setTimeout(onDone, 600); return () => clearTimeout(t); } }, [p, onDone]);
  const total = Math.round(p / 3);
  return <div className="flex flex-1 flex-col items-center pt-8">
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90"><circle cx="50" cy="50" r="44" className="fill-none stroke-muted" strokeWidth="8" /><circle cx="50" cy="50" r="44" className="fill-none stroke-primary" strokeWidth="8" strokeLinecap="round" strokeDasharray={276.5} strokeDashoffset={276.5 * (1 - total / 100)} /></svg>
      <span className="absolute inset-0 grid place-items-center font-display text-3xl font-bold text-primary">{total}%</span>
    </div>
    <h1 className="mt-6 text-center font-display text-xl font-bold text-foreground">Analizando el perfil de {name}…</h1>
    <div className="mt-6 w-full rounded-2xl bg-card p-5 shadow-sm">
      {lines.map((l, i) => { const v = Math.min(100, Math.max(0, p - i * 100)); return <div key={l} className="mb-4 last:mb-0">
        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-foreground"><span>{l}</span><span className="flex items-center gap-1">{v}%{v >= 100 && <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15"><Check className="h-3 w-3 text-primary" /></span>}</span></div>
        <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${v}%` }} /></div>
      </div>; })}
    </div>
  </div>;
}

function Result({ name, areas, variant, onNext }: { name: string; areas: string[]; variant: number | null; onNext: () => void }) {
  const score = variant === null ? null : illustrativeImpactScore(variant);
  const shownAreas = areas.length ? areas.slice(0, 2).join(" y ") : "Emocional y Relaciones";
  return <div className="flex flex-1 flex-col pt-6">
    <h1 className="text-center font-display text-2xl font-bold text-foreground">El mapa de {name} está listo</h1>
    {variant === null ? <div className="mt-5 aspect-[10/9] w-full animate-pulse rounded-2xl bg-muted" /> : <img src={RESULT_PHOTOS[variant]} alt="Escena ilustrativa de acompañamiento cristiano y paz interior" width={640} height={576} className="mt-5 h-auto w-full rounded-2xl" />}
    <div className="mt-4 rounded-2xl bg-card p-5 shadow-sm">
      <p className="text-sm text-foreground">Tus respuestas señalan que deseas trabajar en el área <b>{shownAreas}</b>. Tu mapa es un punto de partida para explorar tus raíces y dar pasos hacia el cambio.</p>
      <p id="impact-label" className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Índice de impacto</p>
      <div role="meter" aria-labelledby="impact-label" aria-describedby="impact-note" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score ?? undefined} aria-valuetext={score === null ? "Preparando indicador ilustrativo" : `${score}% · impulso positivo, ilustrativo`} className="relative mt-3 h-3 rounded-full bg-gradient-to-r from-impact-low via-impact-mid to-impact-high shadow-[0_0_12px_color-mix(in_oklab,var(--impact-high)_35%,transparent)]">
        {score !== null && <span className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-4 border-card bg-impact-high shadow-soft motion-safe:transition-[left] motion-safe:duration-300" style={{ left: `${score}%` }} />}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span className="text-impact-low">Menor</span><span>Intermedio</span><span className="text-impact-high">Positivo</span></div>
      {score === null ? <div className="mt-3 h-7 w-48 animate-pulse rounded-lg bg-muted" /> : <p className="mt-3 font-display text-lg font-bold text-impact-high">{score}% · impulso positivo</p>}
      <p id="impact-note" className="mt-2 text-xs text-muted-foreground">Indicador ilustrativo, no una medición clínica ni una garantía de resultados.</p>
      <p className="mt-1 text-sm text-muted-foreground">Estás a tiempo de cortar el ciclo. ORÍGEN te guía paso a paso, 5 a 10 minutos al día.</p>
    </div>
    <div className="mt-auto pt-6"><Cta onClick={onNext}>Ver mi plan personalizado</Cta></div>
  </div>;
}

function CurrencyNote({ cur }: { cur: LocalCurrency }) {
  return <p className="mt-3 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground"><Globe2 className="h-4 w-4 shrink-0 text-primary" />
    {cur.detected && cur.code !== "USD"
      ? `Precios aproximados en tu moneda (${cur.code}). Hotmart te cobra en tu moneda local con tarjeta de crédito, débito u otros métodos de tu país.`
      : "Precios en dólares (USD). Podrás pagar en tu moneda local con tarjeta de crédito, débito u otros métodos disponibles en tu país."}
  </p>;
}

function money(usd: number, cur: LocalCurrency) {
  return cur.detected && cur.code !== "USD" ? formatLocal(usd, cur) : formatUsd(usd);
}

/** 3 levels × 3 cadences, each opening its own Hotmart checkout. */
function PlansBoard({ cur, mode, title }: { cur: LocalCurrency; mode: Mode; title?: string }) {
  const [cad, setCad] = useState<Cadence>("annual");
  const [lvl, setLvl] = useState("caminante");
  const charge = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }); }, []);
  const level = LEVELS.find((l) => l.id === lvl) ?? LEVELS[1];
  const c = CAD.find((x) => x.id === cad) ?? CAD[2];
  if (!level || !c) return null;
  const price = priceOf(level, cad, mode);
  const go = () => window.open(linkOf(level, cad, mode), "_blank", "noopener");
  return <section className="mt-5 rounded-3xl bg-card p-4 shadow-sm">
    {title && <h3 className="mb-3 text-center font-display text-lg font-bold text-foreground">{title}</h3>}
    <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
      {CAD.map((x) => <Button variant="membershipPeriod" key={x.id} role="tab" aria-selected={cad === x.id} data-selected={cad === x.id} onClick={() => setCad(x.id)} className="h-auto min-h-[44px] flex-col gap-0 rounded-lg px-1 text-sm font-semibold">{x.label}{mode === "discount" && <span className="block text-[11px] font-bold">-{OFF_PCT[x.id]}%</span>}</Button>)}
    </div>
    <div className="mt-4 grid gap-3">
      {LEVELS.map((l) => { const on = l.id === lvl; const p = priceOf(l, cad, mode); return <Button variant="membership" key={l.id} aria-pressed={on} data-selected={on} onClick={() => setLvl(l.id)} className="relative block h-auto w-full overflow-hidden rounded-2xl p-4 text-left transition active:scale-[.98]">
        {l.id === "caminante" && <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">Más elegido</span>}
        <div className="flex items-center gap-3">
          <img src={l.img} alt="" className="h-12 w-12 shrink-0 object-contain" />
          <div className={cn("min-w-0 flex-1", l.id === "caminante" && "pr-20")}>
            <p className="font-display text-base font-bold text-foreground">{l.name}</p>
            <p className="text-xs text-muted-foreground">{l.claim}</p>
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            {mode === "trial" && <p className="font-display text-2xl font-bold text-primary">{money(0, cur)} <span className="text-sm font-semibold text-muted-foreground">hoy</span></p>}
            {mode !== "trial" && <p className="font-display text-2xl font-bold text-foreground">{money(p, cur)}<span className="text-sm font-semibold text-muted-foreground"> / {c.per}</span></p>}
            {mode === "discount" && <p className="text-xs text-muted-foreground"><s>{money(l.usd[cad], cur)}</s> · ahorras {OFF_PCT[cad]}%</p>}
            {mode === "trial" && <p className="text-xs text-muted-foreground">Luego {money(l.usd[cad], cur)} / {c.per}</p>}
            {cur.detected && cur.code !== "USD" && <p className="text-[11px] text-muted-foreground">≈ {formatUsd(mode === "trial" ? l.usd[cad] : p)} USD</p>}
          </div>
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border-2", on ? "border-primary bg-primary" : "border-border")}>{on && <Check className="h-4 w-4 text-primary-foreground" />}</span>
        </div>
        {on && <ul className="mt-3 grid gap-1.5 border-t border-border pt-3">{l.perks.map((x) => <Tick key={x}>{x}</Tick>)}</ul>}
      </Button>; })}
    </div>
    {mode === "trial" && <div className="mt-4 rounded-2xl bg-primary/10 p-4">
      <p className="font-display text-base font-bold text-foreground">Quiero un período gratis</p>
      <p className="mt-1 text-sm text-foreground">Tendrás 7 día(s) para probar el producto.</p>
      <p className="mt-1 text-sm text-muted-foreground">Después de este período se cobrará el importe de <b className="text-foreground">{money(level.usd[cad], cur)} / {c.per}</b> (primer cobro el {charge}).</p>
      <div className="mt-3 flex items-center justify-between border-t border-primary/20 pt-3 text-foreground"><span className="font-bold">Total a pagar hoy</span><span className="font-display text-xl font-bold">{money(0, cur)}</span></div>
    </div>}
    {mode !== "trial" && <div className="mt-4 rounded-2xl bg-primary/10 p-4">
      <p className="font-display text-base font-bold text-foreground">Incluye 7 días gratis</p>
      <p className="mt-1 text-sm text-muted-foreground">Hoy pagas <b className="text-foreground">{money(0, cur)}</b>. Después de los 7 días se cobrará el importe de <b className="text-foreground">{money(price, cur)} / {c.per}</b> (primer cobro el {charge}). Puedes cancelar antes sin que se te cobre nada.</p>
      <div className="mt-3 flex items-center justify-between border-t border-primary/20 pt-3 text-foreground"><span className="font-bold">Total a pagar hoy</span><span className="font-display text-xl font-bold">{money(0, cur)}</span></div>
    </div>}
    <Cta className="mt-4" onClick={go}>{mode === "trial" ? "Empezar mis 7 días gratis" : mode === "discount" ? `Obtener ${OFF_PCT[cad]}% de descuento` : `Obtener ${level.name.split(" ")[0][0] + level.name.split(" ")[0].slice(1).toLowerCase()} por ${money(price, cur)}`}</Cta>
    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Lock className="h-4 w-4 text-primary" />Pago seguro con Hotmart · tarjeta, PayPal, Google Pay y más</div>
    <CurrencyNote cur={cur} />
    <ul className="mt-3 grid gap-2">
      <Tick>7 días gratis: te avisamos antes del primer cobro</Tick>
      <Tick>Cancela cuando quieras</Tick>
      <Tick>Garantía de 7 días de Hotmart</Tick>
    </ul>
  </section>;
}

function AppScreens() {
  return <>
    <SectionTitle kicker="La app por dentro">Así se ve ORÍGEN en tu teléfono</SectionTitle>
    <div className="-mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
      {SCREENS.map((s) => <figure key={s.t} className="w-[62%] shrink-0 snap-center sm:w-56">
        <div className="overflow-hidden rounded-[28px] border-[6px] border-foreground/85 bg-card shadow-xl"><img src={s.img} alt={`Pantalla ${s.t} de ORÍGEN`} loading="lazy" className="aspect-[390/844] w-full object-cover object-top" /></div>
        <figcaption className="mt-3 text-center"><p className="text-sm font-bold text-foreground">{s.t}</p><p className="text-xs text-muted-foreground">{s.d}</p></figcaption>
      </figure>)}
    </div>
    <p className="text-center text-xs text-muted-foreground">Desliza para ver más pantallas</p>
  </>;
}

function TrustBar() {
  const items = [{ i: Lock, t: "Pago seguro Hotmart" }, { i: BadgeCheck, t: "Garantía 7 días" }, { i: Globe2, t: "Pagas en tu moneda" }, { i: Smartphone, t: "Celular y computadora" }];
  return <div className="mt-6 grid grid-cols-2 gap-3">{items.map(({ i: I, t }) => <div key={t} className="flex items-center gap-2 rounded-2xl bg-card p-3 shadow-sm"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10"><I className="h-5 w-5 text-primary" /></span><span className="text-xs font-bold text-foreground">{t}</span></div>)}</div>;
}

function BooksGift() {
  const rail = useRef<HTMLDivElement>(null);
  const scrollBooks = (direction: number) => rail.current?.scrollBy({ left: direction * 280, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  return <section aria-labelledby="books-gift-title" className="relative mt-10 overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground dark:bg-secondary dark:text-secondary-foreground">
    <div className="flex items-center gap-4">
      <img src={eBook} alt="" className="h-24 w-24 shrink-0 object-contain drop-shadow-xl" />
      <div><p className="text-xs font-bold uppercase tracking-widest opacity-80">Incluidos en tu suscripción</p><h3 id="books-gift-title" className="mt-1 font-display text-xl font-bold leading-tight">{FUNNEL_BOOKS.length} libros para ti, sin costo adicional</h3></div>
    </div>
    <p className="mt-3 text-sm opacity-90">Todo esto está incluido para ti. Cada semana actualizamos la biblioteca y agregamos contenido variado para acompañar tu sanación.</p>
    <div ref={rail} role="region" aria-label="Portadas de los libros disponibles en ORÍGEN" tabIndex={0} className="mt-5 flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none]">
      {FUNNEL_BOOKS.map((book) => <figure key={book.id} className="w-28 shrink-0 snap-start">
        <img src={book.cover} alt={`Portada de ${book.title}`} loading="lazy" width={224} height={336} className="aspect-[2/3] w-full rounded-lg bg-card object-contain shadow-soft" />
      </figure>)}
    </div>
    <div className="mt-2 flex items-center justify-between gap-3">
      <Button variant="secondary" size="icon" title="Libros anteriores" aria-label="Libros anteriores" onClick={() => scrollBooks(-1)} className="h-11 w-11"><ChevronLeft className="h-5 w-5" /></Button>
      <span className="text-xs font-semibold">{FUNNEL_BOOKS.length} lecturas · nuevos packs cada semana</span>
      <Button variant="secondary" size="icon" title="Más libros" aria-label="Más libros" onClick={() => scrollBooks(1)} className="h-11 w-11"><ChevronRight className="h-5 w-5" /></Button>
    </div>
    <p className="mt-3 text-xs opacity-90">Lectura y descarga según los cupos de tu plan.</p>
  </section>;
}

function Includes() {
  const incl = [{ i: Map, t: "Camino ORÍGEN", d: "20 etapas con una lección nueva cada día" }, { i: FileText, t: "Consultas con PDF", d: "Dios te dice hoy, tu patrón familiar y tu pareja" }, { i: NotebookPen, t: "Diario de sanación", d: "Escribe y desahoga en privado" }, { i: Headphones, t: "Audios guiados", d: "Respiración, afirmaciones y visualización" }, { i: Gamepad2, t: "Juegos del día", d: "Gimnasia emocional de 3 minutos" }, { i: TreePine, t: "Árbol de Sanación", d: "Mira crecer tu avance con cada paso" }];
  return <>
    <SectionTitle kicker="Todo en un solo lugar">Lo que incluye tu plan</SectionTitle>
    <img src={mockup} alt="Pantallas de la app ORÍGEN" loading="lazy" className="mx-auto mt-4 w-full max-w-sm drop-shadow-2xl" />
    <div className="mt-4 grid gap-3">{incl.map(({ i: I, t, d }) => <div key={t} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10"><I className="h-6 w-6 text-primary" /></span><span><span className="block font-semibold text-foreground">{t}</span><span className="block text-sm text-muted-foreground">{d}</span></span></div>)}</div>
    <div className="relative mt-4 grid grid-cols-[96px_1fr] items-center gap-4 overflow-hidden rounded-2xl border-2 border-primary bg-card p-4 shadow-sm">
      <img src={bookImg} alt="Libro Reconectando el Espíritu con Dios" width={96} height={128} loading="lazy" className="h-auto w-24" />
      <div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-bold text-primary"><Gift className="h-3.5 w-3.5" /> Regalo incluido</span>
        <p className="mt-1.5 font-display text-[17px] font-bold leading-tight text-foreground">Ebook «Reconectando el Espíritu con Dios» gratis</p>
        <p className="mt-1 text-sm text-muted-foreground">El libro de Ruth Esther Paredes Sufran, autora y fundadora de ORÍGEN, donde nace este método.</p>
        <a href={BOOK_AMAZON_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-primary">Comprar la edición física en Amazon</a>
      </div>
    </div>
  </>;
}

function BeforeAfter({ variant }: { variant: number }) {
  return <section className="mt-5 rounded-3xl bg-card p-4 shadow-sm">
    <div className="grid grid-cols-2 gap-3">
      {[{ img: TODAY_PHOTOS[variant], tag: "Hoy", grayscale: true, tone: "bg-muted text-foreground", lv: [2, 2, 1], lbl: ["Carga", "Inquietud", "Bloqueo"] }, { img: FUTURE_PHOTOS[variant], tag: "En 6 meses", grayscale: false, tone: "bg-primary text-primary-foreground", lv: [5, 5, 4], lbl: ["Libertad", "En paz", "Conexión"] }].map((c) => <div key={c.tag}>
        <span className={cn("block rounded-full py-1.5 text-center text-sm font-bold", c.tone)}>{c.tag}</span>
        <img src={c.img} alt={`Escena ilustrativa: ${c.tag}`} width={640} height={576} className={cn("mt-3 h-auto w-full rounded-2xl", c.grayscale && "grayscale")} />
        {["Paz interior", "Mente", "Relaciones"].map((k, i) => <div key={k} className="mt-3"><p className="text-sm font-bold text-foreground">{k}</p><p className="text-xs text-muted-foreground">{c.lbl[i]}</p><div className="mt-1 flex gap-1">{[0, 1, 2, 3, 4].map((n) => <span key={n} className={cn("h-1.5 flex-1 rounded-full", n < c.lv[i] ? "bg-primary" : "bg-muted")} />)}</div></div>)}
      </div>)}
    </div>
    <p className="mt-3 text-center text-xs text-muted-foreground">Escenas ilustrativas de lo que deseas trabajar; los resultados varían en cada persona.</p>
  </section>;
}

// ---------- Try a consulta ----------
const DEMOS = [
  { id: "dios", img: eCross, t: "Dios te dice hoy", ph: "¿Qué te gustaría preguntarle hoy?" },
  { id: "patron", img: eHeart, t: "Tu patrón familiar", ph: "¿Qué se repite en tu familia?" },
  { id: "pareja", img: eCouple, t: "¿Es tu pareja de destino?", ph: "¿Qué te inquieta de esta relación?" },
] as const;
type DemoResult = { headline: string; sections: { title: string; body: string }[] };

function TryConsulta({ name }: { name: string }) {
  const [kind, setKind] = useState<(typeof DEMOS)[number]["id"]>("dios");
  const [who, setWho] = useState(name);
  const [partner, setPartner] = useState("");
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [res, setRes] = useState<DemoResult | null>(null);
  // Una sola consulta de prueba por sección: se recuerda cuáles ya se usaron.
  const [used, setUsed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("origen-demo-used") || "[]"); } catch { return []; }
  });
  const demo = DEMOS.find((d) => d.id === kind)!;
  useEffect(() => { if (name && !who) setWho(name); }, [name, who]);
  const ask = async () => {
    if (used.includes(kind)) return;
    setState("loading"); setRes(null);
    try {
      const [r] = await Promise.all([
        fetch("/api/public/demo-consulta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, name: who, question: q, partner }) }),
        new Promise((ok) => setTimeout(ok, 2500)),
      ]);
      if (!r.ok) throw new Error();
      setRes(await r.json()); setState("done");
      const nextUsed = [...used, kind];
      setUsed(nextUsed);
      try { localStorage.setItem("origen-demo-used", JSON.stringify(nextUsed)); } catch { /* no storage */ }
    } catch { setState("error"); }
  };
  const pdf = () => res && printConsulta({
    kind: demo.t, title: res.headline, subtitle: "Respuesta de prueba del Método ORÍGEN", userName: who, plan: "Prueba",
    sections: res.sections.map((s) => ({ title: s.title, body: s.body })),
    links: LEVELS.map((l) => ({ group: l.name, items: CAD.map((c) => ({ label: `${c.label} · ${formatUsd(l.usd[c.id])}`, url: l.url[c.id] })) })),
  });
  return <section className="mt-12">
    <SectionTitle kicker="Pruébalo gratis ahora">¿El Método ORÍGEN es para ti? Compruébalo</SectionTitle>
    <p className="mt-2 text-center text-sm text-muted-foreground">Elige una consulta, escribe tu pregunta y recibe tu respuesta al instante.</p>
    <div className="mt-5 grid grid-cols-3 gap-2">
      {DEMOS.map((d) => { const done = used.includes(d.id); return <button key={d.id} onClick={() => { setKind(d.id); setState("idle"); setRes(null); }} className={cn("relative rounded-2xl border-2 bg-card p-2 text-center transition active:scale-[.97]", kind === d.id ? "border-primary" : "border-transparent shadow-sm", done && "opacity-60")}>
        <img src={d.img} alt="" className="mx-auto h-14 w-14 object-contain" /><span className="mt-1 block text-xs font-bold leading-tight text-foreground">{d.t}</span>
        {done && <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}
      </button>; })}
    </div>
    <p className="mt-2 text-center text-xs text-muted-foreground">Una consulta de prueba por sección. Dentro de la app son ilimitadas según tu plan.</p>
    <div className="mt-4 rounded-3xl bg-card p-4 shadow-sm">
      {state === "loading" ? <div className="py-10 text-center">
        <img src={demo.img} alt="" className="mx-auto h-20 w-20 animate-pulse object-contain" />
        <p className="mt-4 font-display text-lg font-bold text-foreground">Preparando tu respuesta, {who}…</p>
        <p className="mt-1 text-sm text-muted-foreground">“{q || demo.t}”</p>
      </div> : state === "done" && res ? <div className="animate-in fade-in">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{demo.t}</p>
        <h3 className="mt-1 font-display text-xl font-bold leading-snug text-foreground">{res.headline}</h3>
        <div className="mt-4 grid gap-3">{res.sections.map((s) => <div key={s.title} className="rounded-2xl bg-primary/5 p-4"><p className="text-sm font-bold text-primary">{s.title}</p><p className="mt-1 whitespace-pre-line text-sm text-foreground">{s.body}</p></div>)}</div>
        <button onClick={pdf} className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary/10 text-sm font-semibold text-primary"><Download className="h-4 w-4" />Descargar mi respuesta en PDF</button>
        {DEMOS.some((d) => !used.includes(d.id)) && <button onClick={() => { const nxt = DEMOS.find((d) => !used.includes(d.id)); if (nxt) setKind(nxt.id); setState("idle"); setRes(null); setQ(""); }} className="mt-2 min-h-[44px] w-full text-sm text-muted-foreground">Probar otra consulta</button>}
      </div> : <>
        <label className="text-sm font-semibold text-foreground">Tu nombre</label>
        <input value={who} onChange={(e) => setWho(e.target.value)} maxLength={60} placeholder="Tu nombre" className="mt-1 min-h-[48px] w-full rounded-xl border-[1.5px] border-border bg-background px-4 text-base text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20" />
        {kind === "pareja" && <><label className="mt-3 block text-sm font-semibold text-foreground">Nombre de esa persona</label>
          <input value={partner} onChange={(e) => setPartner(e.target.value)} maxLength={60} placeholder="Nombre de tu pareja" className="mt-1 min-h-[48px] w-full rounded-xl border-[1.5px] border-border bg-background px-4 text-base text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20" /></>}
        <label className="mt-3 block text-sm font-semibold text-foreground">Tu pregunta</label>
        <textarea value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} rows={3} placeholder={demo.ph} className="mt-1 w-full rounded-xl border-[1.5px] border-border bg-background p-3 text-base text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20" />
        {state === "error" && <p className="mt-2 text-sm text-destructive">No pudimos preparar tu respuesta. Revisa tu conexión e inténtalo otra vez.</p>}
        {used.includes(kind) ? <p className="mt-3 rounded-xl bg-primary/5 p-3 text-center text-sm text-muted-foreground">Ya usaste tu consulta de prueba de esta sección. Con tu plan tienes consultas ilimitadas.</p> : <Cta className="mt-3" disabled={!who.trim() || (kind === "pareja" && !partner.trim())} onClick={ask}>Recibir mi respuesta gratis</Cta>}
      </>}
    </div>
  </section>;
}

// ---------- Pages ----------
function TopBar({ onClose, time, label, cta }: { onClose: () => void; time: string; label: string; cta: () => void }) {
  return <div className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
    <div className="mx-auto flex max-w-md items-center gap-3">
      <button aria-label="Cerrar" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-foreground"><X className="h-5 w-5" /></button>
      <div className="flex-1"><p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><img src={gift} alt="" className="h-5 w-5" />{label}</p><p className="font-display text-2xl font-bold text-primary">{time}</p></div>
      <button onClick={cta} className="min-h-[48px] rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Ver planes</button>
    </div>
  </div>;
}
const toPlans = () => document.getElementById("planes")?.scrollIntoView({ behavior: "smooth" });

function Paywall({ name, cur, variant, onClose }: { name: string; cur: LocalCurrency; variant: number; onClose: () => void }) {
  const time = useCountdown(590);
  return <main className="min-h-dvh bg-gradient-to-b from-primary/5 via-background to-background pb-12">
    <TopBar onClose={onClose} time={time} label="Tu plan está reservado" cta={toPlans} />
    <div className="mx-auto max-w-md px-4">
      <BeforeAfter variant={variant} />
      <h1 className="mt-6 text-center font-display text-[28px] font-bold leading-tight text-foreground">Tu plan para {name ? `${name}, ` : ""}romper el ciclo está listo</h1>
      <div id="planes" className="scroll-mt-24"><PlansBoard cur={cur} mode="normal" /></div>
      <TrustBar />
      <AppScreens />
      <BooksGift />
      <Includes />
      <section className="-mx-4 mt-12 bg-primary/5 py-2"><ReviewsSlider /></section>
      <SectionTitle kicker="Sin riesgo">Garantía de 7 días</SectionTitle>
      <div className="mt-4 flex items-center gap-4 rounded-3xl bg-card p-5 shadow-sm"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10"><ShieldCheck className="h-7 w-7 text-primary" /></span><p className="text-sm text-foreground">Si en los primeros 7 días sientes que ORÍGEN no es para ti, pides tu reembolso desde Hotmart. Sin preguntas incómodas.</p></div>
      <TryConsulta name={name} />
      <PlansBoard cur={cur} mode="normal" title="Empieza tu plan hoy" />
    </div>
  </main>;
}

function Offer80({ name, cur, onClose }: { name: string; cur: LocalCurrency; onClose: () => void }) {
  const time = useCountdown(600);
  const bonos = [{ i: Gift, t: "Pack de libros semanal", d: "Un pack nuevo cada semana en tu Biblioteca" }, { i: Sun, t: "Visualízalo y Vívelo completo", d: "Todos los programas con audio" }, { i: HeartHandshake, t: "Consultas con PDF", d: "Descarga e imprime tus respuestas" }, { i: CalendarCheck, t: "Camino de 20 etapas", d: "Una lección nueva cada día" }];
  return <main className="min-h-dvh bg-gradient-to-b from-primary/10 via-background to-background pb-12">
    <TopBar onClose={onClose} time={time} label="Descuento activo por" cta={toPlans} />
    <div className="mx-auto max-w-md px-4">
      <div className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg shadow-primary/25">
        <img src={gift} alt="" className="absolute -right-4 -top-2 h-32 w-32 object-contain opacity-90" />
        <p className="text-xs font-bold uppercase tracking-widest opacity-80">Descuento desbloqueado</p>
        <p className="mt-1 font-display text-5xl font-bold">80% OFF</p>
        <p className="mt-1 max-w-[70%] text-sm opacity-90">{name ? `${name}, tu` : "Tu"} descuento ya está aplicado en mensual y anual (65% en semanal).</p>
        <div className="mt-3 inline-flex rounded-full bg-primary-foreground/20 px-3 py-1 text-sm font-bold">Cupón ORIGEN80 · aplicado</div>
      </div>
      <div id="planes" className="scroll-mt-24"><PlansBoard cur={cur} mode="discount" /></div>
      <SectionTitle kicker="Bonos incluidos">Todo esto entra con tu descuento</SectionTitle>
      <div className="mt-4 grid grid-cols-2 gap-3">{bonos.map(({ i: I, t, d }) => <div key={t} className="rounded-2xl bg-card p-4 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10"><I className="h-5 w-5 text-primary" /></span><p className="mt-2 text-sm font-bold text-foreground">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div>)}</div>
      <img src={mockup} alt="Pantallas de la app ORÍGEN" loading="lazy" className="mx-auto mt-8 w-full max-w-sm drop-shadow-2xl" />
      <AppScreens />
      <section className="-mx-4 mt-10 bg-primary/5 py-2"><ReviewsSlider /></section>
      <BooksGift />
      <PlansBoard cur={cur} mode="discount" title="Último paso: elige y ahorra" />
    </div>
  </main>;
}

// ---------- Popups ----------
function ScratchPopup({ name, onClaim, onClose }: { name: string; onClaim: () => void; onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    const css = getComputedStyle(document.documentElement);
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, "hsl(45 85% 62%)"); g.addColorStop(1, "hsl(40 75% 45%)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(70,45,0,.8)"; ctx.font = `bold ${c.height / 6}px ${css.getPropertyValue("--font-display") || "sans-serif"}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Raspa aquí", c.width / 2, c.height / 2);
  }, []);
  const scratch = (e: React.PointerEvent) => {
    if (!drawing.current || done) return; const c = ref.current; const ctx = c?.getContext("2d"); if (!c || !ctx) return; const r = c.getBoundingClientRect();
    ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc((e.clientX - r.left) * 2, (e.clientY - r.top) * 2, 50, 0, Math.PI * 2); ctx.fill();
    const data = ctx.getImageData(0, 0, c.width, c.height).data; let clear = 0; for (let i = 3; i < data.length; i += 64) if (data[i] === 0) clear++;
    if (clear / (data.length / 64) > 0.35) setDone(true);
  };
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background px-4 pb-6 pt-3 animate-in zoom-in-95 duration-300 sm:my-6 sm:min-h-0 sm:rounded-3xl">
      <div className="flex justify-end"><button aria-label="Cerrar" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-foreground"><X className="h-5 w-5" /></button></div>
      <img src={gift} alt="" className="mx-auto h-36 w-36 object-contain drop-shadow-xl" />
      <h2 className="mt-2 text-center font-display text-[28px] font-bold leading-tight text-foreground">¡Espera{name ? `, ${name}` : ""}! Tienes un regalo</h2>
      <p className="mt-2 text-center text-muted-foreground">Desliza tu dedo sobre la tarjeta para descubrir tu descuento.</p>
      <div className="mt-5 rounded-3xl border-2 border-dashed border-primary-foreground/40 bg-primary p-5 shadow-lg shadow-primary/25">
        <p className="text-center font-display text-xl font-bold text-primary-foreground">RASPA Y GANA</p>
        <div className="relative mt-4 h-44 overflow-hidden rounded-2xl bg-primary-foreground/15" onClick={() => setDone(true)}>
          <div className="absolute inset-0 grid place-items-center text-center"><p className="font-display text-6xl font-bold text-primary-foreground">80%<span className="block text-base font-semibold">de descuento en tu plan</span></p></div>
          <canvas ref={ref} className={cn("absolute inset-0 h-full w-full cursor-pointer touch-none transition-opacity duration-500", done && "pointer-events-none opacity-0")} onPointerDown={(e) => { drawing.current = true; scratch(e); }} onPointerUp={() => (drawing.current = false)} onPointerLeave={() => (drawing.current = false)} onPointerMove={scratch} />
        </div>
      </div>
      {done && <div className="mt-5 animate-in fade-in slide-in-from-bottom-4">
        <p className="text-center text-sm font-semibold text-primary">¡Ganaste 80% OFF! Tu descuento se aplica automáticamente.</p>
        <Cta className="mt-3" onClick={onClaim}>Obtener mi descuento</Cta>
      </div>}
      {!done && <p className="mt-5 text-center text-xs text-muted-foreground">También puedes tocar la tarjeta para revelarla.</p>}
    </div>
  </div>;
}

function FreePopup({ cur, onClose, onSkip }: { cur: LocalCurrency; onClose: () => void; onSkip: () => void }) {
  const bonos = [{ img: mockup, t: "Plan completo ORÍGEN", items: ["Camino de 20 etapas", "Consultas con PDF", "Audios y juegos diarios"] }, { img: eBook, t: "Pack de libros semanal", items: ["Un pack nuevo cada semana", "Lectura y descarga", "Desde el día 1"] }, { img: ePractice, t: "Diario y ejercicios", items: ["Diario privado", "Ejercicios paso a paso", "Respiración guiada"] }];
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="mx-auto min-h-dvh max-w-md bg-gradient-to-b from-primary/10 to-background bg-background px-4 pb-10 pt-3 animate-in slide-in-from-bottom-8 duration-300">
      <div className="flex items-center"><button aria-label="Cerrar" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-foreground"><X className="h-5 w-5" /></button><p className="flex-1 pr-11 text-center text-sm font-bold uppercase tracking-widest text-primary">Última oportunidad</p></div>
      <h2 className="mt-3 text-center font-display text-3xl font-bold leading-tight text-foreground">Prueba ORÍGEN 7 días por {money(0, cur)}</h2>
      <p className="mt-2 text-center text-muted-foreground">Hoy no pagas nada. Todo esto queda abierto para ti:</p>
      <div className="mt-5 grid gap-3">{bonos.map((b) => <div key={b.t} className="overflow-hidden rounded-3xl bg-card shadow-sm">
        <div className="flex gap-4 p-4"><img src={b.img} alt="" className="h-20 w-20 shrink-0 rounded-2xl bg-primary/10 object-contain p-1" /><div className="flex-1"><p className="font-display text-base font-bold text-primary">{b.t}</p><ul className="mt-1 grid gap-1">{b.items.map((i) => <Tick key={i}>{i}</Tick>)}</ul></div></div>
        <div className="bg-primary/15 py-2 text-center text-sm font-bold text-foreground">GRATIS por 7 días</div>
      </div>)}</div>
      <PlansBoard cur={cur} mode="trial" title="Elige tu plan para la prueba" />
      <button onClick={onSkip} className="mt-3 min-h-[44px] w-full text-sm font-semibold text-primary">Prefiero mi descuento del 80%</button>
    </div>
  </div>;
}
