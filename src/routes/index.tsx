import { ManagedImage } from "@/components/ManagedImage";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, CircleAlert, CircleX, ShieldCheck, Sparkles } from "lucide-react";
import logo from "@/assets/logo-origen.png";
import heroImg from "@/assets/landing/hero-oracion.jpg";
import triedImg from "@/assets/landing/probaste-todo.jpg";
import familyImg from "@/assets/landing/familia-libre.jpg";
import eHeartPurple from "@/assets/e3d-heart-purple.png";
import eHeartGem from "@/assets/e3d-heartgem.png";
import eCross from "@/assets/e3d-cross.png";
import eStar from "@/assets/e3d-star.png";
import ePractice from "@/assets/e3d-practice.png";
import eHeadphones from "@/assets/e3d-headphones.png";
import eBrain from "@/assets/e3d-brain.png";
import eButterfly from "@/assets/e3d-butterfly.png";
import { ReviewsSlider } from "@/components/ReviewsSlider";
import { LiveActivityToasts } from "@/components/LiveActivityToasts";
import { DiosTeDiceHoy } from "@/components/DiosTeDiceHoy";
import { AppScreens, BeforeAfter, BooksGift, Includes, TryConsulta } from "@/components/funnel/FunnelShared";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ORÍGEN — rompe con Dios el patrón que se repite en tu familia" },
      {
        name: "description",
        content:
          "Repites los mismos errores, sientes un vacío que no sabes explicar y empiezas cosas que abandonas. El Método ORÍGEN te muestra de dónde viene y qué hacer hoy, con Dios en el centro. Pruébalo gratis.",
      },
      { property: "og:title", content: "ORÍGEN — lo que no se sana, se hereda" },
      { property: "og:description", content: "El Método ORÍGEN: sana la raíz del patrón que se repite en tu vida, un paso al día con Dios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FLAGS = [
  { t: "Te prometes que esta vez será distinto.", d: "Y vuelves a terminar en el mismo lugar, con otra persona, otro trabajo, otra excusa." },
  { t: "Das todo y te quedas vacía(o).", d: "Cuidas a todos, pero nadie te pregunta cómo estás de verdad." },
  { t: "Empiezas con fuerza y abandonas.", d: "La dieta, la oración diaria, el proyecto. Siempre a la segunda semana." },
  { t: "Ves en ti a tu mamá o a tu papá.", d: "Esa reacción, ese miedo, esa forma de amar que juraste no repetir." },
  { t: "Oras, pero sientes el cielo cerrado.", d: "Crees en Dios, pero hay algo pesado que no se va." },
  { t: "Ya probaste terapia, libros y apps.", d: "Te ayudaron un rato. El patrón volvió." },
];

const PHASES = [
  { img: eBrain, t: "Fase 1 · Lo nombras", d: "Un diagnóstico de 2 minutos te muestra qué se repite y de qué lado de tu familia viene." },
  { img: eHeartPurple, t: "Fase 2 · Lo entiendes", d: "Consultas personalizadas sobre tus patrones familiares, tu pareja y lo que Dios te dice hoy." },
  { img: eCross, t: "Fase 3 · Lo entregas", d: "La Palabra del día, oración y perdón guiado para soltar lo que no te corresponde cargar." },
  { img: ePractice, t: "Fase 4 · Lo trabajas", d: "Un ejercicio de 5 minutos al día y tu Camino ORÍGEN de 20 etapas, a tu ritmo." },
  { img: eHeadphones, t: "Fase 5 · Lo vives", d: "Visualízalo y Vívelo: audios, afirmaciones y programas para renovar tu mente." },
  { img: eButterfly, t: "Fase 6 · Lo sostienes", d: "Diario, mentora, racha y Árbol de Sanación para que el cambio no se apague." },
];

const FOR_WHO = [
  "Siente que carga heridas que no son solo suyas.",
  "Quiere paz real, no frases bonitas.",
  "Tiene poco tiempo y necesita pasos cortos y claros.",
  "Busca a Dios sin que le impongan una religión.",
  "Quiere que sus hijos no hereden lo mismo.",
];

const FAILED = ["“Ten paciencia.”", "“Piensa positivo.”", "“Ya pasará.”", "“Lee otro libro.”"];

const FAQ = [
  { q: "Ya probé terapia, libros y otras apps.", a: "ORÍGEN no empieza por contenido general: empieza por tu historia y tu línea familiar. Lo que recibes responde a tu caso, cada día." },
  { q: "No tengo tiempo.", a: "Cinco minutos al día. Un solo paso, a propósito: el cambio necesita asentarse, no acumularse." },
  { q: "No quiero que me impongan una religión.", a: "Partimos de la fe cristiana con respeto absoluto. Te invitamos, nunca te presionamos." },
  { q: "¿Cuánto cuesta?", a: "Puedes probarlo gratis ahora mismo. Si decides seguir, eliges tu plan después, con 7 días gratis y cancelación cuando quieras." },
  { q: "¿Funciona si no tengo pareja o mi familia no participa?", a: "Sí. El trabajo es contigo y con Dios. Tu cambio ya transforma la forma en que te relacionas." },
  { q: "¿Sustituye a un médico o psicólogo?", a: "No. ORÍGEN es acompañamiento espiritual y emocional; si lo necesitas, complementa la atención profesional." },
];

function Landing() {
  const [faq, setFaq] = useState<number | null>(0);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 620);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-dvh bg-background pb-28">
      <LiveActivityToasts variant="landing" />

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid max-w-[1100px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <ManagedImage imageKey="imagen:logo" src={logo} alt="ORÍGEN" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
            <span className="truncate font-display text-[15px] font-extrabold tracking-tight">ORÍGEN</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/auth"
              className="grid h-10 place-items-center rounded-[10px] px-3 text-[13px] font-semibold text-foreground/75"
            >
              Entrar
            </Link>
            <Link
              to="/empezar"
              className="grid h-10 place-items-center rounded-[12px] bg-primary px-4 text-[13px] font-bold text-primary-foreground shadow-glow"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-4">
        {/* 1. HERO */}
        <section className="relative -mx-4 overflow-hidden px-4 pb-10 pt-8" style={{ background: "radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, var(--primary) 14%, var(--background)) 0%, var(--background) 65%)" }}>
          <div className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
            <div>
              <Reveal><p className="text-[13px] font-semibold italic text-primary">Lo que no se sana, se hereda.</p></Reveal>
              <Reveal delay={60}>
                <h1 className="mt-3 font-display text-[32px] font-extrabold leading-[1.1] sm:text-[44px]">
                  No naciste repitiendo. <span className="text-primary">Lo aprendiste.</span> Y con Dios se puede desaprender.
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
                  Descubre con el <strong className="text-foreground">Método ORÍGEN</strong> de qué lado de tu familia viene el patrón que se repite en tu vida, y rómpelo en pasos de 5 minutos al día.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <ul className="mt-5 grid gap-2.5">
                  {["Entiende por qué repites lo que juraste no repetir.", "Recupera la paz sin dejar de ser tú.", "Rompe el ciclo para ti y para los tuyos."].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-[15px] font-medium"><CheckDot />{t}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={240}>
                <Link to="/empezar" className="mt-6 grid h-14 w-full place-items-center rounded-[12px] text-[16.5px] font-bold text-primary-foreground shadow-glow transition active:scale-[.97] sm:w-auto sm:px-10" style={{ background: "var(--gradient-primary)" }}>
                  Probar gratis ahora
                </Link>
                <p className="mt-2 text-center text-[13px] text-muted-foreground sm:text-left">Diagnóstico gratis · 2 minutos · sin tarjeta</p>
              </Reveal>
            </div>
            <Reveal delay={200}>
              <div className="relative mx-auto max-w-[420px]">
                <img src={heroImg} alt="Mujer orando en paz frente a su Biblia al amanecer" width={1200} height={1408} className="h-auto w-full rounded-[28px] object-cover shadow-[0_8px_30px_rgba(30,25,20,.12)]" />
                <div className="absolute -bottom-4 left-4 right-4 flex items-center gap-3 rounded-[16px] bg-card/95 p-3 shadow-[0_8px_30px_rgba(30,25,20,.12)] backdrop-blur">
                  <img src={eHeartGem} alt="" className="h-11 w-11 object-contain" />
                  <p className="text-[13px] font-semibold leading-snug">“Por fin entendí de dónde venía lo que sentía.”</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 2. RECONOCE ESTO */}
        <section className="mt-14">
          <Reveal><Kicker>La verdad que nadie te dice</Kicker><H2>Reconoce esto y deja de culparte…</H2></Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {FLAGS.map((f, i) => (
              <Reveal key={f.t} delay={i * 60}>
                <div className="flex h-full gap-3 rounded-[16px] bg-card p-4 shadow-[0_1px_3px_rgba(30,25,20,.06)]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-destructive/10 text-destructive"><CircleAlert className="h-5 w-5" /></span>
                  <div><p className="text-[16px] font-bold leading-snug">{f.t}</p><p className="mt-1 text-[14px] text-muted-foreground">{f.d}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mx-auto mt-6 max-w-xl rounded-[16px] bg-primary/5 p-5 text-center text-[16px] font-medium italic leading-relaxed">
              Eso no es mala suerte ni falta de fe. <strong className="not-italic text-primary">Es un patrón.</strong> Y los patrones se rompen cuando entiendes su raíz, no cuando esperas que se vayan solos.
            </p>
          </Reveal>
        </section>

        {/* 3. TE PRESENTO EL MÉTODO */}
        <section className="relative -mx-4 mt-14 overflow-hidden px-4 py-10" style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--primary) 7%, var(--background)), var(--background))" }}>
          <Reveal>
            <p className="text-center text-[14px] font-semibold text-muted-foreground">Te presento:</p>
            <h2 className="mt-1 text-center font-display text-[30px] font-extrabold leading-tight text-primary sm:text-[38px]">El Método ORÍGEN</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-[16px] leading-relaxed text-muted-foreground">
              Un camino de <strong className="text-foreground">6 fases</strong> para sanar la raíz de lo que se repite en tu vida, con la Palabra de Dios, tu historia familiar y pasos diarios de 5 minutos.
            </p>
          </Reveal>
          <Reveal>
            <div className="mx-auto mt-6 max-w-xl rounded-[16px] border border-primary/20 bg-card p-5 text-center">
              <p className="text-[16px] font-bold">Esto no es otro libro de autoayuda.</p>
              <p className="mt-1 text-[14px] text-muted-foreground">No te va a decir “piensa positivo”. Eso ya lo sabes y no alcanzó. Esto trabaja desde tu origen: lo que aprendiste en casa y lo que Dios dice de ti.</p>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PHASES.map((p, i) => (
              <Reveal key={p.t} delay={i * 60}>
                <div className="relative h-full rounded-[16px] bg-card p-5 shadow-[0_1px_3px_rgba(30,25,20,.06)]">
                  {i === 0 && <span aria-hidden className="absolute inset-x-6 top-0 h-[2px] rounded-full" style={{ background: "var(--gradient-primary)" }} />}
                  <img src={p.img} alt="" loading="lazy" className="h-14 w-14 object-contain" />
                  <p className="mt-3 font-display text-[18px] font-bold">{p.t}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 4. PARA QUIÉN */}
        <section className="mt-12 grid items-center gap-6 md:grid-cols-2">
          <Reveal><img src={eStar} alt="" loading="lazy" className="mx-auto h-40 w-40 object-contain drop-shadow-xl md:h-56 md:w-56" /></Reveal>
          <Reveal>
            <Kicker>¿Para quién es?</Kicker>
            <H2 left>Para la persona que…</H2>
            <ul className="mt-4 grid gap-3">{FOR_WHO.map((t) => <li key={t} className="flex items-start gap-2.5 text-[15px] font-medium"><CheckDot />{t}</li>)}</ul>
            <p className="mt-4 text-[15px] text-muted-foreground">Si te viste aquí, esto fue hecho para ti — y para la persona en la que te estás convirtiendo.</p>
          </Reveal>
        </section>

        {/* 5. ANTES Y DESPUÉS */}
        <section className="mt-14">
          <Reveal><Kicker>Lo que puede cambiar</Kicker><H2>De cargar el patrón a vivir en paz</H2></Reveal>
          <div className="mx-auto max-w-xl"><BeforeAfter variant={0} /></div>
          <div className="mt-5 text-center"><Link to="/empezar" className="inline-grid h-14 w-full place-items-center rounded-[12px] px-8 text-[16px] font-bold text-primary-foreground shadow-glow active:scale-[.97] sm:w-auto" style={{ background: "var(--gradient-primary)" }}>Quiero empezar mi cambio</Link></div>
        </section>

        {/* 6. LA APP POR DENTRO */}
        <section className="mx-auto mt-4 max-w-3xl"><AppScreens /></section>

        {/* 7. POR QUÉ FALLÓ LO ANTERIOR */}
        <section className="mt-14 overflow-hidden rounded-[24px] bg-card shadow-[0_1px_3px_rgba(30,25,20,.06)]">
          <img src={triedImg} alt="Pareja cansada después de intentar de todo" loading="lazy" width={1200} height={610} className="h-48 w-full object-cover grayscale sm:h-64" />
          <div className="p-5 sm:p-8">
            <H2 left>Por qué todo lo que probaste antes no alcanzó</H2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {FAILED.map((f) => <p key={f} className="flex items-center gap-2 rounded-[10px] bg-muted px-3 py-2.5 text-[14px] font-semibold"><CircleX className="h-4 w-4 shrink-0 text-destructive" />{f} <span className="text-muted-foreground">No alcanzó.</span></p>)}
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">No fue tu culpa. Esos consejos tratan el síntoma, no la raíz. <strong className="text-foreground">Lo que no se mira en su origen, vuelve.</strong> ORÍGEN te ayuda a mirarlo con Dios, paso a paso, sin juicio.</p>
          </div>
        </section>

        {/* 8. TODO LO QUE INCLUYE + LIBROS */}
        <section className="mx-auto max-w-3xl">
          <Includes />
          <BooksGift />
        </section>

        {/* 9. TESTIMONIOS */}
        <section className="-mx-4 mt-14 bg-primary/5 py-4"><ReviewsSlider /></section>

        {/* 10. PRUEBA UNA CONSULTA */}
        <section className="mx-auto max-w-2xl"><TryConsulta name="" /></section>

        <Reveal><div id="dios-te-dice-hoy" className="mt-12 scroll-mt-20"><DiosTeDiceHoy /></div></Reveal>

        {/* 11. GARANTÍA */}
        <section className="relative mx-auto mt-12 max-w-2xl overflow-hidden rounded-[24px] bg-card p-6 text-center shadow-[0_1px_3px_rgba(30,25,20,.06)]">
          <span aria-hidden className="absolute inset-x-10 top-0 h-[2px] rounded-full" style={{ background: "var(--gradient-primary)" }} />
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-[16px] bg-primary/10 text-primary"><ShieldCheck className="h-7 w-7" /></span>
          <H2>Pruébalo sin riesgo</H2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">Empiezas gratis. Si después eliges un plan, tienes 7 días gratis, te avisamos antes del cobro y cancelas cuando quieras. Sin preguntas incómodas.</p>
        </section>

        {/* 12. FAQ */}
        <section className="mx-auto mt-14 max-w-2xl">
          <Kicker>¿Tienes dudas?</Kicker><H2>Te respondemos</H2>
          <div className="mt-5 grid gap-2">
            {FAQ.map((f, i) => (
              <div key={f.q} className="rounded-[16px] bg-card shadow-[0_1px_3px_rgba(30,25,20,.06)]">
                <button type="button" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? null : i)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-[15px] font-semibold">
                  {f.q}<ChevronDown className={`h-5 w-5 shrink-0 text-primary transition-transform ${faq === i ? "rotate-180" : ""}`} />
                </button>
                {faq === i && <p className="px-4 pb-4 text-[14px] leading-relaxed text-muted-foreground">{f.a}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* 13. CTA FINAL */}
        <Reveal>
          <section className="mt-14 overflow-hidden rounded-[24px] bg-card shadow-[0_8px_30px_rgba(30,25,20,.12)]">
            <img src={familyImg} alt="Tres generaciones de una familia caminando juntas en paz" loading="lazy" width={1408} height={912} className="h-56 w-full object-cover sm:h-80" />
            <div className="p-6 text-center sm:p-10">
              <img src={logo} alt="" className="mx-auto -mt-16 h-20 w-20 object-contain drop-shadow-xl sm:-mt-20" />
              <h2 className="mt-3 font-display text-[28px] font-extrabold leading-tight">Hoy puedes cortar la cadena.</h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] text-muted-foreground">Lo que sanes hoy ya no lo heredarán los tuyos. El primer paso dura 2 minutos.</p>
              <Link to="/empezar" className="mt-5 grid h-14 w-full place-items-center rounded-[12px] text-[16.5px] font-bold text-primary-foreground shadow-glow active:scale-[.97]" style={{ background: "var(--gradient-primary)" }}>
                Probar gratis ahora <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <p className="mt-4 text-[13px] italic text-muted-foreground"><strong>PD:</strong> No tienes que tenerlo todo resuelto para empezar. Solo tienes que dejar de cargarlo sola(o).</p>
            </div>
          </section>
        </Reveal>

        <footer className="mt-12 border-t border-border pt-6 text-[12.5px] text-muted-foreground">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="/terminos" className="underline-offset-2 hover:underline">Términos</a>
            <a href="/privacidad" className="underline-offset-2 hover:underline">Privacidad</a>
            <a href="/reembolsos" className="underline-offset-2 hover:underline">Reembolsos</a>
            <a href="/disclaimer-ia" className="underline-offset-2 hover:underline">Uso de IA</a>
          </div>
          <p className="mt-3">Soporte: infodenegociorm@gmail.com</p>
          <p className="mt-1">© {new Date().getFullYear()} ORÍGEN. Acompañamiento espiritual, no sustituye atención médica o psicológica.</p>
        </footer>
      </div>

      {sticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl motion-safe:animate-in motion-safe:slide-in-from-bottom-4">
          <Link to="/empezar" className="mx-auto grid h-14 w-full max-w-md place-items-center rounded-[12px] text-[16px] font-bold text-primary-foreground shadow-glow active:scale-[.97]" style={{ background: "var(--gradient-primary)" }}>
            Probar gratis ahora
          </Link>
        </div>
      )}
    </main>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-[12px] font-bold uppercase tracking-widest text-primary">{children}</p>;
}
function H2({ children, left }: { children: React.ReactNode; left?: boolean }) {
  return <h2 className={`mt-1 font-display text-[26px] font-extrabold leading-tight sm:text-[32px] ${left ? "" : "text-center"}`}>{children}</h2>;
}
function CheckDot() {
  return <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/12 text-primary"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>;
}

/** Entrada suave al hacer scroll; respeta “reducir movimiento”. */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "-8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-500 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
    >
      {children}
    </div>
  );
}
