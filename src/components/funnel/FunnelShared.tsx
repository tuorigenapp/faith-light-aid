import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Download, FileText, Gamepad2, Gift, Headphones, Map, NotebookPen, TreePine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { printConsulta } from "@/lib/print-pdf";
import { BOOK_AMAZON_URL } from "@/lib/pdf-brand";
import { FUNNEL_BOOKS } from "@/lib/funnel-books";
import { TODAY_PHOTOS, FUTURE_PHOTOS } from "@/lib/funnel-visuals";
import { APP_SCREENS } from "@/lib/app-screens";
import bookImg from "@/assets/libro-oficial-mockup.png";
import mockup from "@/assets/funnel/mockup.png";
import eBook from "@/assets/e3d-book.png";
import eCross from "@/assets/e3d-cross.png";
import eCouple from "@/assets/e3d-couple.png";
import eHeart from "@/assets/e3d-heartgem.png";

/** Bloques compartidos por /empezar y la página de inicio. */
export function Cta({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return <button disabled={disabled} onClick={onClick} className={cn("min-h-[56px] w-full rounded-xl bg-primary px-5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[.97] disabled:opacity-40 disabled:shadow-none", className)}>{children}</button>;
}

export function Tick({ children }: { children: React.ReactNode }) {
  return <li className="flex items-start gap-2 text-sm text-foreground"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15"><Check className="h-3 w-3 text-primary" /></span>{children}</li>;
}
export function SectionTitle({ kicker, children }: { kicker?: string; children: React.ReactNode }) {
  return <div className="mt-12 text-center">{kicker && <p className="text-xs font-bold uppercase tracking-widest text-primary">{kicker}</p>}<h2 className="mt-1 font-display text-2xl font-bold leading-tight text-foreground">{children}</h2></div>;
}

export function AppScreens() {
  return <>
    <SectionTitle kicker="La app por dentro">Así se ve ORÍGEN en tu teléfono</SectionTitle>
    <div className="-mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
      {APP_SCREENS.map((s) => <figure key={s.t} className="w-[62%] shrink-0 snap-center sm:w-56">
        <div className="overflow-hidden rounded-[28px] border-[6px] border-foreground/85 bg-card shadow-xl"><img src={s.img} alt={`Pantalla ${s.t} de ORÍGEN`} loading="lazy" className="aspect-[390/844] w-full object-cover object-top" /></div>
        <figcaption className="mt-3 text-center"><p className="text-sm font-bold text-foreground">{s.t}</p><p className="text-xs text-muted-foreground">{s.d}</p></figcaption>
      </figure>)}
    </div>
    <p className="text-center text-xs text-muted-foreground">Desliza para ver más pantallas</p>
  </>;
}

export function BooksGift() {
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

export function Includes() {
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

export function BeforeAfter({ variant }: { variant: number }) {
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

export type PdfLinkGroup = { group: string; items: { label: string; url: string }[] };
export function TryConsulta({ name, links = [] }: { name: string; links?: PdfLinkGroup[] }) {
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
    links,
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
