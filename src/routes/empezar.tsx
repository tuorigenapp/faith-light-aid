import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, X, Heart, Sparkles, Brain, Coins, Users, Compass, Headphones, NotebookPen, BookOpen, Lock, ShieldCheck, Star, Map, FileText, Gamepad2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-origen.png";
import dSanar from "@/assets/funnel/d-sanar.jpg";
import dFe from "@/assets/funnel/d-fe.jpg";
import dAbund from "@/assets/funnel/d-abundancia.jpg";
import dIdent from "@/assets/funnel/d-identidad.jpg";
import tMiedo from "@/assets/funnel/t-miedo.jpg";
import tCulpa from "@/assets/funnel/t-culpa.jpg";
import tConst from "@/assets/funnel/t-constancia.jpg";
import tClar from "@/assets/funnel/t-claridad.jpg";
import antes from "@/assets/funnel/antes.jpg";
import despues from "@/assets/funnel/despues.jpg";
import gift from "@/assets/funnel/gift.png";
import mockup from "@/assets/funnel/mockup.png";
import eHeadphones from "@/assets/e3d-headphones.png";
import ePractice from "@/assets/e3d-practice.png";
import eBook from "@/assets/e3d-book.png";

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

const HOTMART = {
  monthly: "https://pay.hotmart.com/D107250120S?off=2tqo0bnc&checkoutMode=6",
  annual: "https://pay.hotmart.com/D107250120S?off=0kyotde7&checkoutMode=6",
};

const DESEOS = [
  { id: "sanar", img: dSanar, t: "Sanar heridas emocionales", d: "Superar el pasado y dejar de repetir los mismos errores." },
  { id: "fe", img: dFe, t: "Fortalecer mi paz interior y fe", d: "Encontrar dirección y calmar el ruido mental." },
  { id: "abundancia", img: dAbund, t: "Manifestar abundancia y propósito", d: "Romper la culpa económica y alinearme con mi valor." },
  { id: "identidad", img: dIdent, t: "Renovar mi identidad y autoestima", d: "Seguridad interna sin buscar aprobación." },
];
const AREAS = [
  { id: "Emocional", icon: Heart }, { id: "Espiritual", icon: Sparkles }, { id: "Mental", icon: Brain },
  { id: "Financiera", icon: Coins }, { id: "Relaciones", icon: Users }, { id: "Propósito", icon: Compass },
];
const DETONANTES = [
  { id: "miedo", img: tMiedo, t: "Miedos e inseguridades que paralizan mis decisiones." },
  { id: "culpa", img: tCulpa, t: "Pensamientos repetitivos, culpa y cargas del pasado." },
  { id: "constancia", img: tConst, t: "Falta de constancia: empiezo y abandono." },
  { id: "claridad", img: tClar, t: "No tengo claridad de por dónde empezar a sanar." },
];
const GUIAS = [
  { id: "audio", img: eHeadphones, icon: Headphones, t: "Con audios, respiración y afirmaciones", d: "Para calmar la ansiedad y conectar rápido." },
  { id: "practica", img: ePractice, icon: NotebookPen, t: "Con ejercicios prácticos y reflexión", d: "Para escribir y desahogar en tu diario." },
  { id: "fe", img: eBook, icon: BookOpen, t: "Con enseñanzas de fe y sabiduría interior", d: "Para conectar con principios espirituales." },
];

type Plan = { id: string; label: string; old?: string; price: string; perDay: string; badge?: string; url?: string };
const PLANS_MAIN: Plan[] = [
  { id: "m1", label: "1 mes", price: "US$14.99", perDay: "0.50", url: HOTMART.monthly },
  { id: "m3", label: "3 meses", price: "US$18.00", perDay: "0.20", badge: "Más popular" },
  { id: "y1", label: "Anual", price: "US$49.99", perDay: "0.14", badge: "Mejor valor · Ahorra 72%", url: HOTMART.annual },
];
const PLANS_80: Plan[] = [
  { id: "m1", label: "1 mes", old: "US$14.99", price: "US$8.00", perDay: "0.26" },
  { id: "m3", label: "3 meses", old: "US$18.00", price: "US$12.00", perDay: "0.13", badge: "Más popular" },
  { id: "m6", label: "6 meses", old: "US$49.99", price: "US$18.00", perDay: "0.10" },
];

type Stage = "quiz" | "paywall" | "scratch" | "offer80" | "free";

function useCountdown(seconds: number, active: boolean) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { if (!active) return; setLeft(seconds); const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, [active, seconds]);
  return `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
}

function Funnel() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [stage, setStage] = useState<Stage>("quiz");
  const [name, setName] = useState("");
  const [deseo, setDeseo] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [raices, setRaices] = useState("");
  const [deton, setDeton] = useState("");
  const [guia, setGuia] = useState("");
  const [exitOpen, setExitOpen] = useState(false);
  const [exitShown, setExitShown] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("origen_preonboarding", JSON.stringify({ name, deseo, areas, raices, detonante: deton, guia })); } catch { /* no storage */ }
  }, [name, deseo, areas, raices, deton, guia]);

  // Exit-intent on the paywall: mouse leaving the top of the window or browser back.
  useEffect(() => {
    if (stage !== "paywall" || exitShown) return;
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) { setExitOpen(true); setExitShown(true); } };
    const onPop = () => { setExitOpen(true); setExitShown(true); history.pushState(null, "", location.href); };
    history.pushState(null, "", location.href);
    document.addEventListener("mouseout", onLeave);
    window.addEventListener("popstate", onPop);
    return () => { document.removeEventListener("mouseout", onLeave); window.removeEventListener("popstate", onPop); };
  }, [stage, exitShown]);

  const progress = [5, 15, 25, 35, 45, 55, 70, 95, 100][step - 1];
  const first = name.trim().split(" ")[0] || "";
  const next = () => setStep((s) => s + 1);
  const autoNext = () => setTimeout(next, 300);

  if (stage === "paywall") return <Paywall name={first} onClose={() => { setExitOpen(true); setExitShown(true); }} exitOpen={exitOpen} onExitClaim={() => { setExitOpen(false); setStage("scratch"); }} onExitDismiss={() => { setExitOpen(false); setStage("free"); }} />;
  if (stage === "scratch") return <Scratch onDone={() => setStage("offer80")} />;
  if (stage === "offer80") return <Offer80 onClose={() => setStage("free")} />;
  if (stage === "free") return <FreeOffer onBack={() => setStage("offer80")} onSkip={() => navigate({ to: "/registro" })} />;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-primary/5 via-background to-background px-4 pb-8 pt-4">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md flex-col">
        <header className="flex items-center justify-between">
          {step > 1 && step < 8 ? <button aria-label="Atrás" onClick={() => setStep(step - 1)} className="grid h-11 w-11 place-items-center rounded-xl text-foreground"><ArrowLeft className="h-5 w-5" /></button> : <span className="h-11 w-11" />}
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground"><img src={logo} alt="" className="h-8 w-8 object-contain" />ORÍGEN</Link>
          <span className="h-11 w-11" />
        </header>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} /></div>

        <section key={step} className="flex flex-1 flex-col animate-in fade-in slide-in-from-right-4 duration-300">
          {step === 1 && <>
            <div className="mt-10 grid place-items-center"><img src={logo} alt="ORÍGEN" className="h-28 w-28 object-contain drop-shadow-xl" /></div>
            <h1 className="mt-8 text-center font-display text-3xl font-bold leading-tight text-foreground">Deja de repetir la historia que no elegiste.</h1>
            <p className="mt-4 text-center text-base text-muted-foreground">Hoy inicias el camino para identificar y romper los patrones invisibles que vienes cargando. Vamos a descubrir de dónde vienen y cómo transformarlos.</p>
            <div className="mt-auto pt-8"><Cta onClick={next}>Comenzar mi evaluación</Cta><p className="mt-3 text-center text-xs text-muted-foreground">Toma menos de 2 minutos</p></div>
          </>}

          {step === 2 && <>
            <Bubble>¿Cómo te gustaría que te llamemos?</Bubble>
            <p className="mt-3 text-center text-sm text-muted-foreground">Personalizaremos tu experiencia, tus reportes y tu mapa de sanación con tu nombre.</p>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Escribe tu nombre o apodo" className="mt-6 h-13 min-h-[52px] w-full rounded-xl border-[1.5px] border-border bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20" />
            <div className="mt-4"><Cta disabled={!name.trim()} onClick={next}>Continuar</Cta></div>
          </>}

          {step === 3 && <>
            <Bubble>Hola {first}, ¿qué deseas transformar hoy?</Bubble>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {DESEOS.map((o) => <button key={o.id} onClick={() => { setDeseo(o.id); autoNext(); }} className={cn("overflow-hidden rounded-2xl border-2 bg-card text-left transition active:scale-[.97]", deseo === o.id ? "border-primary" : "border-transparent shadow-sm")}>
                <img src={o.img} alt="" className="aspect-square w-full object-cover" />
                <div className="p-3"><p className="text-sm font-bold leading-snug text-foreground">{o.t}</p><p className="mt-1 text-xs text-muted-foreground">{o.d}</p></div>
              </button>)}
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
            <Bubble>¿De quién o de dónde sientes que viene este peso?</Bubble>
            <p className="mt-3 text-sm text-muted-foreground">Escribe una situación o patrón que se repite en tu familia (divorcios, escasez, miedos, silencios…).</p>
            <textarea value={raices} onChange={(e) => setRaices(e.target.value)} maxLength={1000} rows={6} placeholder="Escribe aquí lo que sientes o vives en tu familia…" className="mt-5 w-full rounded-2xl border-[1.5px] border-border bg-card p-4 text-base text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20" />
            <p className="mt-1 text-right text-xs text-muted-foreground">{raices.length}/1000</p>
            <div className="mt-auto pt-6"><Cta disabled={raices.trim().length < 3} onClick={next}>Continuar</Cta></div>
          </>}

          {step === 6 && <>
            <Bubble>¿Qué te frena más cuando intentas cambiar?</Bubble>
            <div className="mt-6 grid gap-3">
              {DETONANTES.map((o) => <button key={o.id} onClick={() => { setDeton(o.id); autoNext(); }} className={cn("flex items-center gap-3 overflow-hidden rounded-2xl border-2 bg-card p-2 pr-4 text-left transition active:scale-[.97]", deton === o.id ? "border-primary" : "border-transparent shadow-sm")}>
                <img src={o.img} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" /><span className="text-sm font-semibold text-foreground">{o.t}</span>
              </button>)}
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

          {step === 9 && <Result name={first} areas={areas} onNext={() => setStage("paywall")} />}
        </section>
      </div>
    </main>
  );
}

function Cta({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return <button disabled={disabled} onClick={onClick} className={cn("min-h-[56px] w-full rounded-xl bg-primary px-5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[.97] disabled:opacity-40 disabled:shadow-none", className)}>{children}</button>;
}

function Bubble({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 flex items-center gap-3">
    <img src={logo} alt="" className="h-16 w-16 shrink-0 object-contain drop-shadow-lg" />
    <div className="relative flex-1 rounded-2xl bg-card p-4 shadow-sm"><h1 className="font-display text-xl font-bold leading-snug text-foreground">{children}</h1></div>
  </div>;
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

function Result({ name, areas, onNext }: { name: string; areas: string[]; onNext: () => void }) {
  const score = 68;
  const shown = areas.length ? areas.slice(0, 2).join(" y ") : "Emocional y Relaciones";
  return <div className="flex flex-1 flex-col pt-6">
    <h1 className="text-center font-display text-2xl font-bold text-foreground">El mapa de {name} está listo</h1>
    <img src={despues} alt="" className="mt-5 aspect-[4/3] w-full rounded-2xl object-cover" />
    <div className="mt-4 rounded-2xl bg-card p-5 shadow-sm">
      <p className="text-sm text-foreground">Detectamos un patrón de repetición fuerte en el área <b>{shown}</b>, ligado a lealtades invisibles de tus raíces.</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Índice de impacto</p>
      <div className="relative mt-3 h-3 rounded-full bg-gradient-to-r from-primary/30 via-primary/60 to-primary">
        <span className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-4 border-card bg-primary shadow" style={{ left: `${score}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Leve</span><span>Moderado</span><span>Alto</span></div>
      <p className="mt-3 font-display text-lg font-bold text-primary">{score}% · moderado-alto</p>
      <p className="mt-1 text-sm text-muted-foreground">Estás a tiempo de cortar el ciclo. ORÍGEN te guía paso a paso, 5 a 10 minutos al día.</p>
    </div>
    <div className="mt-auto pt-6"><Cta onClick={onNext}>Ver mi plan personalizado</Cta></div>
  </div>;
}

function PlanPicker({ plans, selected, onSelect }: { plans: Plan[]; selected: string; onSelect: (id: string) => void }) {
  return <div className="grid gap-3">{plans.map((p) => { const on = p.id === selected; const [i, d] = p.perDay.split("."); return <button key={p.id} onClick={() => onSelect(p.id)} className={cn("overflow-hidden rounded-2xl border-2 bg-card text-left transition active:scale-[.98]", on ? "border-primary" : "border-border")}>
    {p.badge && <div className={cn("py-1 text-center text-xs font-bold", on ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>{p.badge}</div>}
    <div className="flex items-center gap-3 p-4">
      <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2", on ? "border-primary" : "border-border")}>{on && <span className="h-3 w-3 rounded-full bg-primary" />}</span>
      <span className="flex-1"><span className="block font-display text-lg font-bold text-foreground">{p.label}</span><span className="text-sm text-muted-foreground">{p.old && <s className="mr-2">{p.old}</s>}<span className="font-semibold text-foreground">{p.price}</span></span></span>
      <span className={cn("flex items-start rounded-xl px-3 py-1.5", on ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}><span className="text-xs">$</span><span className="font-display text-3xl font-bold leading-none">{i}</span><span className="ml-0.5 text-xs leading-tight"><b className="block text-sm">{d}</b>al día</span></span>
    </div>
  </button>; })}</div>;
}

function PayModal({ plan, onClose, trial }: { plan: Plan; onClose: () => void; trial?: boolean }) {
  const navigate = useNavigate();
  const go = () => { if (plan.url) window.open(plan.url, "_blank", "noopener"); else navigate({ to: "/membresia" }); };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl animate-in slide-in-from-bottom-8 sm:rounded-3xl">
      <div className="flex justify-end"><button aria-label="Cerrar" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-foreground"><X className="h-5 w-5" /></button></div>
      <h2 className="text-center font-display text-xl font-bold text-foreground">Elige cómo pagar</h2>
      <div className="mt-5 flex items-center justify-between text-foreground"><span className="font-bold">Total hoy</span><span className="font-display text-xl font-bold">{plan.old && <s className="mr-2 text-base text-muted-foreground">{plan.old}</s>}{trial ? "US$0.00" : plan.price}</span></div>
      <button onClick={go} className="mt-5 min-h-[56px] w-full rounded-xl bg-foreground text-base font-semibold text-background">Pagar con tarjeta, PayPal o Google Pay</button>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Lock className="h-4 w-4 text-primary" />Pago seguro con cifrado SSL a través de Hotmart</div>
      <p className="mt-4 text-xs text-muted-foreground">{trial ? "7 días gratis. Luego se renueva a US$14.99 al mes." : `Pagas ${plan.price} por el primer periodo. Se renueva automáticamente.`} Cancela cuando quieras desde tu cuenta o escribiendo a soporte.</p>
    </div>
  </div>;
}

function Paywall({ name, onClose, exitOpen, onExitClaim, onExitDismiss }: { name: string; onClose: () => void; exitOpen: boolean; onExitClaim: () => void; onExitDismiss: () => void }) {
  const [sel, setSel] = useState("y1");
  const [pay, setPay] = useState(false);
  const time = useCountdown(590, true);
  const plan = PLANS_MAIN.find((p) => p.id === sel)!;
  const stats = [["5.000+", "personas acompañadas"], ["20", "etapas guiadas"], ["365", "ejercicios diarios"], ["24/7", "acceso desde tu teléfono"]];
  const incl = [{ i: Map, t: "Camino ORÍGEN: 20 etapas con avance diario" }, { i: FileText, t: "Consultas profundas con reporte en PDF" }, { i: NotebookPen, t: "Diario de sanación y desahogo" }, { i: Headphones, t: "Audios, respiración y afirmaciones guiadas" }, { i: Gamepad2, t: "Gimnasia emocional con juegos diarios" }];
  return <main className="min-h-dvh bg-background pb-10">
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <button aria-label="Cerrar" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-foreground"><X className="h-5 w-5" /></button>
        <div className="flex-1"><p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><img src={gift} alt="" className="h-5 w-5" />-70% con código</p><p className="font-display text-2xl font-bold text-primary">{time}</p></div>
        <button onClick={() => setPay(true)} className="min-h-[48px] rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Obtener mi plan</button>
      </div>
    </div>
    <div className="mx-auto max-w-md px-4">
      <section className="mt-5 rounded-3xl bg-card p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          {[{ img: antes, tag: "Hoy", tone: "bg-muted text-foreground", lv: [2, 2, 1], lbl: ["Carga", "Inquieta", "Bloqueada"] }, { img: despues, tag: "En 6 meses", tone: "bg-primary text-primary-foreground", lv: [5, 5, 4], lbl: ["Libre", "En paz", "Fluyendo"] }].map((c) => <div key={c.tag}>
            <span className={cn("block rounded-full py-1.5 text-center text-sm font-bold", c.tone)}>{c.tag}</span>
            <img src={c.img} alt="" className="mt-3 aspect-[4/5] w-full rounded-2xl object-cover" />
            {["Paz interior", "Mente", "Relaciones"].map((k, i) => <div key={k} className="mt-3"><p className="text-sm font-bold text-foreground">{k}</p><p className="text-xs text-muted-foreground">{c.lbl[i]}</p><div className="mt-1 flex gap-1">{[0, 1, 2, 3, 4].map((n) => <span key={n} className={cn("h-1.5 flex-1 rounded-full", n < c.lv[i] ? "bg-primary" : "bg-muted")} />)}</div></div>)}
          </div>)}
        </div>
      </section>
      <h1 className="mt-6 text-center font-display text-2xl font-bold text-foreground">Tu plan para {name ? `${name}, ` : ""}romper el ciclo está listo</h1>
      <PromoBox time={time} />
      <section className="mt-4 rounded-3xl bg-card p-4 shadow-sm"><PlanPicker plans={PLANS_MAIN} selected={sel} onSelect={setSel} /><Cta className="mt-4" onClick={() => setPay(true)}>Obtener mi plan ahora</Cta>
        <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">{["Cancela cuando quieras", "Te avisamos antes del cobro", "Garantía de 7 días de Hotmart"].map((b) => <li key={b} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15"><Check className="h-3 w-3 text-primary" /></span>{b}</li>)}</ul>
      </section>
      <section className="mt-8 grid grid-cols-2 gap-4 text-center">{stats.map(([n, l]) => <div key={l}><p className="font-display text-3xl font-bold text-primary">{n}</p><p className="text-sm text-muted-foreground">{l}</p></div>)}</section>
      <h2 className="mt-10 text-center font-display text-xl font-bold text-foreground">Lo que incluye tu plan ORÍGEN</h2>
      <img src={mockup} alt="Pantallas de la app ORÍGEN" loading="lazy" className="mx-auto mt-4 w-full max-w-sm drop-shadow-2xl" />
      <div className="mt-4 grid gap-3">{incl.map(({ i: I, t }) => <div key={t} className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-foreground/15"><I className="h-6 w-6" /></span><span className="font-semibold">{t}</span></div>)}</div>
      <section className="-mx-4 mt-10 bg-primary/10 px-4 py-8">
        <h2 className="text-center font-display text-xl font-bold text-primary">Historias de nuestra comunidad</h2>
        <div className="mt-5 rounded-2xl bg-card p-5 shadow-sm"><div className="flex gap-1 text-primary">{[0, 1, 2, 3, 4].map((n) => <Star key={n} className="h-4 w-4 fill-current" />)}</div><p className="mt-3 text-sm text-foreground">“Llevaba años cargando culpas familiares y repitiendo relaciones vacías. En 3 semanas con ORÍGEN mi paz mental dio un giro.”</p><p className="mt-3 text-sm font-bold text-foreground">María R., 34 años</p></div>
      </section>
      <h2 className="mt-8 text-center font-display text-xl font-bold text-foreground">Empieza tu plan hoy</h2>
      <section className="mt-4 rounded-3xl bg-card p-4 shadow-sm"><PlanPicker plans={PLANS_MAIN} selected={sel} onSelect={setSel} /><Cta className="mt-4" onClick={() => setPay(true)}>Obtener mi plan ahora</Cta></section>
      <p className="mt-4 text-xs text-muted-foreground">Pagas {plan.price} por el primer periodo y se renueva automáticamente al mismo precio. Cancela cuando quieras. Lee los <Link to="/" className="underline">términos</Link>.</p>
    </div>
    {pay && <PayModal plan={plan} onClose={() => setPay(false)} />}
    {exitOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-primary/15 to-card bg-card p-6 text-center shadow-2xl animate-in zoom-in-95">
        <img src={gift} alt="" className="mx-auto h-28 w-28 object-contain" />
        <h2 className="mt-3 font-display text-2xl font-bold text-foreground">¡Espera{name ? `, ${name}` : ""}! No dejes tu proceso a la mitad</h2>
        <p className="mt-2 text-sm text-muted-foreground">Activamos un regalo especial de último momento solo para ti.</p>
        <p className="mt-3 font-display text-xl font-bold text-primary">{time}</p>
        <Cta className="mt-4" onClick={onExitClaim}>Abrir mi regalo</Cta>
        <button onClick={onExitDismiss} className="mt-3 min-h-[44px] w-full text-sm text-muted-foreground">No, gracias</button>
      </div>
    </div>}
  </main>;
}

function PromoBox({ time }: { time: string }) {
  return <div className="mt-4 flex items-center gap-3 rounded-3xl bg-primary p-4 text-primary-foreground">
    <img src={gift} alt="" className="h-20 w-20 shrink-0 object-contain" />
    <div className="flex-1"><div className="flex items-center justify-between gap-2"><p className="font-display text-lg font-bold">¡Descuento aplicado!</p><span className="rounded-full bg-foreground/30 px-3 py-1 font-bold">{time}</span></div><p className="mt-2 rounded-full bg-card px-4 py-2 text-sm font-bold text-foreground">ORIGEN_2026</p></div>
  </div>;
}

function Scratch({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d")!;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    const g = ctx.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, "#f2c94c"); g.addColorStop(1, "#c99a1e");
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(90,60,0,.75)"; ctx.font = `bold ${c.height / 5}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("¡Raspa aquí!", c.width / 2, c.height / 2);
  }, []);
  const scratch = (e: React.PointerEvent) => {
    if (!drawing.current || done) return; const c = ref.current!; const r = c.getBoundingClientRect(); const ctx = c.getContext("2d")!;
    ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc((e.clientX - r.left) * 2, (e.clientY - r.top) * 2, 44, 0, Math.PI * 2); ctx.fill();
    const data = ctx.getImageData(0, 0, c.width, c.height).data; let clear = 0; for (let i = 3; i < data.length; i += 64) if (data[i] === 0) clear++;
    if (clear / (data.length / 64) > 0.45) setDone(true);
  };
  return <main className="min-h-dvh bg-background px-4 py-6"><div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md flex-col items-center">
    <img src={logo} alt="ORÍGEN" className="h-10 w-10 object-contain" />
    <img src={gift} alt="" className="mt-6 h-40 w-40 object-contain" />
    <h1 className="mt-4 text-center font-display text-2xl font-bold text-foreground">Tenemos un regalo especial para ti</h1>
    <p className="mt-2 text-center text-muted-foreground">Desliza tu dedo sobre el recuadro para revelarlo.</p>
    <div className="mt-6 w-full rounded-3xl border-2 border-dashed border-primary-foreground/40 bg-primary p-5">
      <p className="text-center font-display text-xl font-bold text-primary-foreground">RASPA Y GANA</p>
      <div className="relative mt-4 h-32 overflow-hidden rounded-2xl bg-foreground/20">
        <div className="absolute inset-0 grid place-items-center text-center"><p className="font-display text-4xl font-bold text-primary-foreground">80% OFF<span className="block text-sm font-semibold">extra en tu plan</span></p></div>
        <canvas ref={ref} className={cn("absolute inset-0 h-full w-full touch-none transition-opacity duration-500", done && "opacity-0")} onPointerDown={(e) => { drawing.current = true; scratch(e); }} onPointerUp={() => (drawing.current = false)} onPointerLeave={() => (drawing.current = false)} onPointerMove={scratch} />
      </div>
    </div>
    <div className="mt-auto w-full pt-8"><Cta disabled={!done} onClick={onDone}>Aplicar descuento y continuar</Cta></div>
  </div></main>;
}

function Offer80({ onClose }: { onClose: () => void }) {
  const [sel, setSel] = useState("m3");
  const [pay, setPay] = useState(false);
  const time = useCountdown(30, true);
  const plan = PLANS_80.find((p) => p.id === sel)!;
  useEffect(() => { if (time === "00:00") onClose(); }, [time, onClose]);
  return <main className="min-h-dvh bg-background px-4 pb-10 pt-4"><div className="mx-auto max-w-md">
    <div className="sticky top-2 z-30 flex items-center justify-between rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg"><span className="flex items-center gap-2 font-bold"><Clock className="h-5 w-5" />Oferta disponible por:</span><span className="rounded-full bg-foreground/30 px-4 py-1 font-display text-lg font-bold">{time}</span></div>
    <h1 className="mt-5 text-center font-display text-2xl font-bold text-foreground">Elige tu plan</h1>
    <div className="mt-4 overflow-hidden rounded-3xl bg-card shadow-sm">
      <div className="relative grid h-44 place-items-center bg-gradient-to-br from-primary/80 to-primary"><img src={gift} alt="" className="h-36 w-36 object-contain" /><span className="absolute right-6 top-6 rotate-12 rounded-2xl bg-card px-3 py-1 font-display text-3xl font-bold text-primary shadow">-80%</span></div>
      <div className="p-4"><PlanPicker plans={PLANS_80} selected={sel} onSelect={setSel} /><Cta className="mt-4" onClick={() => setPay(true)}>Obtener mi plan</Cta></div>
    </div>
    <p className="mt-4 text-xs text-muted-foreground">Pagas {plan.price} por el primer periodo; luego se renueva al precio normal. Cancela cuando quieras.</p>
    <button onClick={onClose} className="mt-3 min-h-[44px] w-full text-sm text-muted-foreground">Ahora no</button>
    {pay && <PayModal plan={plan} onClose={() => setPay(false)} />}
  </div></main>;
}

function FreeOffer({ onBack, onSkip }: { onBack: () => void; onSkip: () => void }) {
  const [pay, setPay] = useState(false);
  const charge = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toLocaleDateString("es", { day: "numeric", month: "long" }); }, []);
  const bonos = [
    { img: mockup, t: "Plan completo ORÍGEN", items: ["Camino de 20 etapas", "Consultas profundas", "Audios y juegos diarios"], v: "US$14.99" },
    { img: ePractice, t: "Hojas de trabajo de sanación", items: ["Guía en PDF imprimible", "Ejercicios paso a paso", "Descarga inmediata"], v: "US$29.99" },
    { img: eBook, t: "Diario y biblioteca", items: ["Diario de desahogo", "Lecturas y afirmaciones", "Acceso desde el día 1"], v: "US$19.99" },
  ];
  return <main className="min-h-dvh bg-gradient-to-b from-primary/10 to-background px-4 pb-10 pt-4"><div className="mx-auto max-w-md">
    <div className="flex items-center"><button aria-label="Atrás" onClick={onBack} className="grid h-11 w-11 place-items-center rounded-xl text-foreground"><ArrowLeft className="h-5 w-5" /></button><p className="flex-1 pr-11 text-center text-sm font-bold uppercase tracking-widest text-primary">Oferta especial</p></div>
    <h1 className="mt-4 text-center font-display text-3xl font-bold leading-tight text-foreground">Queremos que pruebes ORÍGEN sin riesgo</h1>
    <p className="mt-2 text-center text-muted-foreground">Solo hoy, todo esto incluido por US$0.00:</p>
    <div className="mt-6 grid gap-4">{bonos.map((b) => <div key={b.t} className="overflow-hidden rounded-3xl bg-card shadow-sm">
      <div className="flex gap-4 p-4"><img src={b.img} alt="" className="h-24 w-24 shrink-0 rounded-2xl bg-primary/10 object-contain p-1" /><div className="flex-1"><div className="flex items-start justify-between gap-2"><p className="font-display text-lg font-bold text-primary">{b.t}</p><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary"><Check className="h-4 w-4 text-primary-foreground" /></span></div><ul className="mt-1 text-sm text-muted-foreground">{b.items.map((i) => <li key={i}>• {i}</li>)}</ul></div></div>
      <div className="bg-primary/15 py-2 text-center font-bold text-foreground">GRATIS <s className="ml-1 font-normal text-muted-foreground">{b.v}</s></div>
    </div>)}</div>
    <p className="mt-5 text-xs text-muted-foreground">7 días gratis. El {charge} se renueva a US$14.99 al mes si no cancelas. Te avisamos antes del cobro.</p>
    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Pago seguro por Hotmart</div>
    <Cta className="mt-4" onClick={() => setPay(true)}>Reclamar mi oferta gratis</Cta>
    <button onClick={onSkip} className="mt-3 min-h-[44px] w-full text-sm text-muted-foreground">Ahora no, seguir con el plan gratis</button>
    {pay && <PayModal trial plan={{ id: "trial", label: "Prueba", old: "US$64.97", price: "US$0.00", perDay: "0.00" }} onClose={() => setPay(false)} />}
  </div></main>;
}
