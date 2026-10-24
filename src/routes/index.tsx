import { ManagedImage } from "@/components/ManagedImage";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ShieldCheck, Sparkles } from "lucide-react";
import logo from "@/assets/logo-origen.png";
import mockup from "@/assets/origen-mockup.png.asset.json";
import eHeartPurple from "@/assets/e3d-heart-purple.png";
import eCross from "@/assets/e3d-cross.png";
import eStar from "@/assets/e3d-star.png";
import ePractice from "@/assets/e3d-practice.png";
import eHeadphones from "@/assets/e3d-headphones.png";
import eBrain from "@/assets/e3d-brain.png";
import { ReviewsSlider } from "@/components/ReviewsSlider";
import { LiveActivityToasts } from "@/components/LiveActivityToasts";
import { DiosTeDiceHoy } from "@/components/DiosTeDiceHoy";
import screenExercises from "@/assets/screens-current/ejercicios.png.asset.json";
import screenVisualiza from "@/assets/screens-current/visualiza.png.asset.json";
import screenCommunity from "@/assets/screens-current/comunidad.png.asset.json";
import screenRewards from "@/assets/screens-current/premiosorigen.png.asset.json";
import screenProfile from "@/assets/screens-current/perfil.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ORÍGEN — sana el patrón familiar que se repite en tu vida" },
      {
        name: "description",
        content:
          "Repites los mismos errores, sientes un vacío que no sabes explicar y empiezas cosas que abandonas. ORÍGEN te muestra de qué lado de tu familia viene ese patrón y qué hacer hoy. Empieza gratis.",
      },
      {
        name: "keywords",
        content:
          "sanar patrones familiares, heridas de la infancia, niño interior, ansiedad y depresión, relación narcisista, límites sin culpa, sanación espiritual cristiana, Dios te dice hoy",
      },
      { property: "og:title", content: "ORÍGEN — rompe el patrón que se repite" },
      {
        property: "og:description",
        content: "Descubre hoy qué se repite en tu historia y da el primer paso para cerrarlo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const PAINS = [
  { img: eHeartPurple, text: "“Repito los mismos errores.”" },
  { img: eCross, text: "“Siento un vacío que no sé explicar.”" },
  { img: eStar, text: "“Empiezo con todo y lo abandono.”" },
];

const STEPS = [
  { img: eBrain, title: "Lo nombras", body: "Sabes qué se repite y de qué lado de tu familia viene." },
  { img: ePractice, title: "Lo trabajas", body: "Un paso al día. Cinco minutos, no una biblioteca." },
  { img: eHeadphones, title: "Lo vives", body: "Audios, mentora y tu progreso siempre contigo." },
];

const FAQ = [
  {
    q: "Ya probé terapia, libros y otras apps.",
    a: "Aquí no empezamos por contenido general: empezamos por tu historia y tu línea familiar. Lo que recibes responde a tu caso.",
  },
  {
    q: "No tengo tiempo.",
    a: "Cinco minutos al día. Un solo paso, a propósito: el cambio necesita asentarse, no acumularse.",
  },
  {
    q: "No quiero que me impongan una religión.",
    a: "Partimos de la fe cristiana con respeto absoluto. Te invitamos, nunca te presionamos.",
  },
  {
    q: "¿Y si no es para mí?",
    a: "Tienes 7 días completos para probarlo. Si no sientes que algo se movió, sales cuando quieras.",
  },
];

function Landing() {
  const [faq, setFaq] = useState<number | null>(null);
  const [sticky, setSticky] = useState(false);
  const [screen, setScreen] = useState(0);
  const screens = [
    { image: screenExercises.url, title: "Tu camino, un día a la vez", caption: "Ejercicios diarios y progreso visible." },
    { image: screenVisualiza.url, title: "Visualízalo y Vívelo", caption: "Programas guiados de fe, identidad y bienestar." },
    { image: screenRewards.url, title: "Tu constancia tiene raíces", caption: "Tu árbol, tus logros y tus Hojas de Sanación." },
    { image: screenProfile.url, title: "Tu historia importa", caption: "Tu perfil y el avance de tu camino." },
    { image: screenCommunity.url, title: "Personas que te escuchan", caption: "Preguntas, respuestas y acompañamiento en comunidad." },
  ];

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 520);
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
        {/* HERO — poco texto, mucho aire */}
        <section
          className="relative -mx-4 overflow-hidden px-4 pb-10 pt-10"
          style={{
            background: "radial-gradient(120% 90% at 50% 0%, #EFE7FF 0%, var(--background) 62%)",
          }}
        >
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> 7 días gratis · sin tarjeta
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 max-w-2xl font-display text-[34px] font-extrabold leading-[1.08] sm:text-[46px]">
              Lo que no se sana, se hereda.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
              Descubre hoy qué se repite en tu historia — y da el primer paso para cerrarlo.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/empezar"
                className="grid h-14 place-items-center rounded-[12px] px-7 text-[16.5px] font-bold text-primary-foreground shadow-glow transition active:scale-[.98]"
                style={{ background: "var(--gradient-primary)" }}
              >
                Empezar gratis
              </Link>
              <a
                href="#dios-te-dice-hoy"
                className="grid h-14 place-items-center rounded-[12px] bg-primary/10 px-7 text-[15.5px] font-bold text-primary"
              >
                Ver qué dice Dios hoy
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <img
              src={mockup.url}
              alt="La app ORÍGEN en el celular: diagnóstico, audios guiados y ejercicios diarios"
              width={1400}
              height={1000}
              className="mt-8 w-full"
            />
          </Reveal>
        </section>

        <section className="mt-12 border-y border-border bg-secondary/30 py-8" aria-label="Conoce ORÍGEN desde adentro">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-widest text-primary">La app por dentro</p><h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Un lugar para volver a ti.</h2><p className="mt-2 text-sm text-muted-foreground">Explora las pantallas reales antes de empezar.</p></div>
            <div className="flex gap-2"><button type="button" onClick={() => setScreen((screen + screens.length - 1) % screens.length)} aria-label="Pantalla anterior" className="grid h-11 w-11 place-items-center rounded-full border border-primary/20 bg-card text-primary">←</button><button type="button" onClick={() => setScreen((screen + 1) % screens.length)} aria-label="Siguiente pantalla" className="grid h-11 w-11 place-items-center rounded-full border border-primary/20 bg-card text-primary">→</button></div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
            <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[24px] border border-border bg-card shadow-soft"><img key={screen} src={screens[screen].image} alt={`Captura real de ORÍGEN: ${screens[screen].title}`} className="h-auto w-full" loading="lazy" /></div>
            <div><span className="text-xs font-bold text-primary">0{screen + 1} / 0{screens.length}</span><h3 className="mt-2 font-display text-xl font-bold">{screens[screen].title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{screens[screen].caption}</p><div className="mt-5 flex gap-2">{screens.map((s, i) => <button key={s.title} type="button" onClick={() => setScreen(i)} aria-label={`Ver ${s.title}`} className={`h-2 rounded-full transition-all ${screen === i ? "w-8 bg-primary" : "w-2 bg-primary/25"}`} />)}</div></div>
          </div>
        </section>

        <section className="mt-8 rounded-[24px] bg-[#45317e] p-6 text-white sm:p-9"><p className="text-xs font-bold uppercase tracking-widest text-pink-200">Comunidad ORÍGEN</p><h2 className="mt-2 font-display text-2xl font-bold">Tu historia merece ser escuchada.</h2><p className="mt-2 max-w-xl text-sm text-white/80">Comparte preguntas, encuentra respuestas y conversa con personas en un camino parecido al tuyo. Abierta a todas las membresías.</p><Link to="/empezar" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-bold text-primary">Conocer la comunidad <ArrowRight className="ml-2 h-4 w-4" /></Link></section>

        {/* DIOS TE DICE HOY */}
        <Reveal>
          <div className="mt-10">
            <DiosTeDiceHoy />
          </div>
        </Reveal>

        {/* DOLORES */}
        <section className="mt-14">
          <Reveal>
            <h2 className="font-display text-[26px] font-extrabold leading-tight">
              ¿Te suena?
            </h2>
          </Reveal>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {PAINS.map((p, i) => (
              <Reveal key={p.text} delay={i * 90}>
                <div className="flex h-full items-center gap-3 rounded-[16px] border border-border bg-card p-4">
                  <img src={p.img} alt="" width={48} height={48} loading="lazy" className="h-12 w-12 shrink-0 object-contain" />
                  <p className="min-w-0 text-[14.5px] font-semibold leading-snug">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={280}>
            <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-muted-foreground">
              No es falta de voluntad. Es un patrón que aprendiste antes de poder elegirlo.
            </p>
          </Reveal>
        </section>

        {/* MÉTODO */}
        <section className="mt-14">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
              El método ORÍGEN
            </p>
            <h2 className="mt-1 font-display text-[26px] font-extrabold leading-tight">
              Tres pasos. Cinco minutos al día.
            </h2>
            <div className="hairline-brand mt-3" />
          </Reveal>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <div className="h-full rounded-[16px] border border-border bg-card p-5 shadow-soft">
                  <img src={s.img} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 object-contain" />
                  <h3 className="mt-3 font-display text-[18px] font-bold leading-tight">{s.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* GARANTÍA */}
        <Reveal>
          <section className="mt-14 flex items-start gap-3 rounded-[16px] border border-border bg-card p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-[17px] font-bold">Pruébalo 7 días completos</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
                Entra, haz tu diagnóstico y vive tus primeros días. Decides después, con calma.
              </p>
            </div>
          </section>
        </Reveal>

        <ReviewsSlider />

        {/* FAQ */}
        <section className="mt-14">
          <Reveal>
            <h2 className="font-display text-[26px] font-extrabold leading-tight">
              Antes de empezar
            </h2>
          </Reveal>
          <div className="mt-4 space-y-2">
            {FAQ.map((f, i) => (
              <div key={f.q} className="overflow-hidden rounded-[16px] border border-border bg-card">
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  className="grid min-h-[52px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="min-w-0 text-[14.5px] font-semibold leading-snug">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${faq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {faq === i && (
                  <p className="px-4 pb-4 text-[13.5px] leading-relaxed text-muted-foreground">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <Reveal>
          <section
            className="mt-14 rounded-[16px] p-7 text-center"
            style={{ background: "var(--gradient-brand-soft)" }}
          >
            <h2 className="font-display text-[26px] font-extrabold leading-tight">
              Hoy puedes cortar la cadena.
            </h2>
            <Link
              to="/empezar"
              className="mt-5 grid h-14 w-full place-items-center rounded-[12px] text-[16.5px] font-bold text-primary-foreground shadow-glow active:scale-[.98]"
              style={{ background: "var(--gradient-primary)" }}
            >
              Empezar gratis <ArrowRight className="ml-2 inline h-4 w-4" />
            </Link>
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
          <p className="mt-1">
            © {new Date().getFullYear()} ORÍGEN. Acompañamiento espiritual, no sustituye atención
            médica o psicológica.
          </p>
        </footer>
      </div>

      {sticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <Link
            to="/empezar"
            className="grid h-14 w-full place-items-center rounded-[12px] text-[16px] font-bold text-primary-foreground shadow-glow active:scale-[.98]"
            style={{ background: "var(--gradient-primary)" }}
          >
            Empezar gratis
          </Link>
        </div>
      )}
    </main>
  );
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
