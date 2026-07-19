import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import heroImg from "@/assets/spiritual-hero.jpg";
import dailyImg from "@/assets/daily-devotional.jpg";
import stageImg from "@/assets/stage-journey.jpg";
import exerciseImg from "@/assets/prayer-exercise.jpg";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight, BookOpen, Check, ChevronDown, Flame, Heart, MessageCircle,
  Play, Shield, Sparkles, Sun, Moon, HeartHandshake, Star, Lock, Clock,
} from "lucide-react";

function useStartTrial() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  async function start() {
    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) { navigate({ to: "/onboarding" }); return; }
      const rand = Math.random().toString(36).slice(2, 10);
      const email = `invitado_${Date.now()}_${rand}@reconectando.test`;
      const password = `Prueba_${rand}${Math.random().toString(36).slice(2, 8)}!A9`;
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw error;
      const { error: sErr } = await supabase.auth.signInWithPassword({ email, password });
      if (sErr) throw sErr;
      navigate({ to: "/onboarding" });
    } catch (e) {
      toast.error((e as Error).message || "No se pudo iniciar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }
  return { start, loading };
}

function StartButton({ children, className, size }: { children: ReactNode; className?: string; size?: "lg" | "default" }) {
  const { start, loading } = useStartTrial();
  return (
    <Button onClick={start} disabled={loading} size={size} className={className}>
      {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparando tu espacio…</> : children}
    </Button>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reconectando el Espíritu con Dios — 5 minutos al día para volver a sentirlo" },
      { name: "description", content: "Deja de sentirte lejos de Dios. Un método diario cristiano de 5 minutos con IA, devocional, oración guiada y ejercicios que te devuelven la paz." },
      { property: "og:title", content: "Reconectando el Espíritu con Dios" },
      { property: "og:description", content: "Un método diario cristiano de 5 minutos para volver a sentir a Dios." },
      { property: "og:image", content: heroImg },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: heroImg },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Pain />
        <WhyFailed />
        <Method />
        <Inside />
        <Features />
        <Pricing />
        <Author />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ───────────────────────── NAV ───────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 inset-x-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-divine grid place-items-center shadow-soft">
            <Sparkles className="w-4 h-4 text-gold" />
          </div>
          <div className="leading-none">
            <div className="font-display font-extrabold text-base">Reconectando</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-bold">Espíritu con Dios</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden sm:block text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2">
            Entrar
          </Link>
          <StartButton className="rounded-full bg-primary shadow-glow px-5 h-10 font-bold">
            Empezar gratis
          </StartButton>
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────── HERO ───────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 sm:px-6 pt-10 sm:pt-16 pb-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 -left-20 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gold/25 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-bold text-primary shadow-soft">
            <Sparkles className="w-3.5 h-3.5" /> Si ya oraste y sigues sintiéndote lejos, esto es para ti
          </div>

          <h1 className="mt-6 font-display font-extrabold text-[2.6rem] sm:text-6xl lg:text-[4.4rem] leading-[0.98] tracking-tight">
            Deja de sentir que Dios ya no te escucha.
            <span className="block mt-4 text-primary">Vuelve a sentirlo, cada día, en 5 minutos.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Un método diario cristiano guiado por IA, con devocional, oración y ejercicios cortos que te devuelven la paz, rompen ciclos y te acercan otra vez a Dios.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <StartButton size="lg" className="rounded-full h-14 px-8 bg-primary shadow-glow font-bold text-base">
              Crear mi camino gratis <ArrowRight className="ml-2 w-4 h-4" />
            </StartButton>
            <a href="#metodo">
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 bg-card/70 font-bold">
                <Play className="mr-2 w-4 h-4" /> Ver cómo funciona
              </Button>
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground font-semibold">
            Empieza gratis hoy · 7 días de prueba · cancela cuando quieras
          </p>

          <div className="mt-10 flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">+2,300 creyentes</span> ya volvieron a sentir a Dios cada mañana.
            </p>
          </div>
        </div>

        <HeroCard />
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div className="absolute -inset-8 bg-gold/25 blur-3xl rounded-full -z-10" />

      <div className="rounded-[2rem] bg-card border border-border shadow-glow p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest bg-foreground text-background rounded-full px-3 py-1.5">
            Tu ritual listo en 5 min
          </span>
          <div className="flex items-center gap-1 text-xs font-bold text-primary">
            <Flame className="w-3.5 h-3.5" /> 12 días
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-secondary p-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/15 grid place-items-center text-primary"><Heart className="w-3.5 h-3.5" /></div>
              <span className="text-xs font-bold">Intención</span>
            </div>
            <div className="mt-2 font-display font-bold text-sm">Recuperar la paz</div>
          </div>
          <div className="rounded-2xl bg-accent/50 p-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gold/30 grid place-items-center text-gold"><Sun className="w-3.5 h-3.5" /></div>
              <span className="text-xs font-bold">Hoy</span>
            </div>
            <div className="mt-2 font-display font-bold text-sm">Palabra: Confianza</div>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-primary">Diagnóstico de hoy</div>
          <p className="mt-2 font-display font-bold text-base leading-snug">
            Tu bloqueo no es falta de fe. Es orar solo cuando ya no puedes más.
          </p>
          <div className="mt-3 rounded-xl bg-gold/15 p-3 text-xs">
            <span className="font-bold">Micro-paso:</span> antes de abrir el celular, cierra los ojos y dile a Dios una frase corta de gratitud.
          </div>
        </div>

        <div className="rounded-2xl bg-divine text-primary-foreground p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-gold">Tu oración personalizada</div>
          <p className="mt-2 scripture text-base leading-snug">
            "Señor, hoy suelto lo que no controlo y confío en tu tiempo."
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-gold" /> Versículo del día</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-gold" /> Oración guiada</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-gold" /> Un pequeño paso</li>
          </ul>
          <div className="mt-4 flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-background text-foreground grid place-items-center shadow-soft">
              <Play className="w-4 h-4 ml-0.5" />
            </button>
            <StartButton className="flex-1 h-10 rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm font-bold">
              Empezar ahora
            </StartButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── PAIN ───────────────────────── */

function Pain() {
  const items = [
    { t: "Oraste… y sentiste que hablabas al techo", d: "Repetir oraciones sin sentir nada te hizo dudar. Y cuando dudas, dejas de acercarte." },
    { t: "Leíste la Biblia y no entendiste nada", d: "Abriste páginas al azar, buscaste señales, y cerraste el libro más confundido que cuando empezaste." },
    { t: "Empiezas con fuego y a los 3 días lo dejas", d: "No es falta de fe. Es que nadie te dio un método diario tan pequeño que sea difícil soltarlo." },
  ];
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24 border-t border-border/60">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight">
          Si esto te pasa, no necesitas <span className="text-primary">más motivación</span>
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Hiciste tu parte: oraste, leíste, lo intentaste una y otra vez. Y por dentro seguías igual. Entonces llegó la peor mentira: <span className="font-bold text-foreground">"será que Dios ya no me escucha"</span>.
        </p>
      </div>

      <div className="mx-auto max-w-6xl mt-12 grid md:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.t} className="app-card p-6">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="mt-4 font-display font-bold text-lg leading-tight">{it.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── WHY FAILED ───────────────────────── */

function WhyFailed() {
  const tried = [
    "Escuchar prédicas motivacionales",
    "Apps bíblicas que abandonaste en una semana",
    "Devocionales impresos que nunca terminaste",
    "Retiros que te movieron un rato… y después nada",
    "Diarios de oración empezados con ilusión",
    "Promesas de \"desde mañana leo la Biblia todos los días\"",
  ];
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24 bg-secondary/40">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight">
            Por qué nada te funcionó antes <span className="text-primary">(y no es tu culpa)</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Probablemente ya intentaste más de una de estas cosas:</p>
        </div>

        <ul className="mt-10 grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
          {tried.map((t) => (
            <li key={t} className="flex items-start gap-3 rounded-2xl bg-card border border-border p-4">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary grid place-items-center flex-shrink-0 mt-0.5">✕</div>
              <span className="text-sm font-medium">{t}</span>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-lg max-w-3xl mx-auto leading-relaxed">
          Todo eso te enseñó a <span className="italic">querer</span> estar cerca de Dios. Nunca a <span className="font-bold text-primary">caminar con Él, con método, cada día</span>. No te faltó fe. Te faltó la otra mitad.
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────── METHOD ───────────────────────── */

function Method() {
  const steps = [
    { n: 1, t: "Cuéntale a Dios dónde estás", d: "Un diagnóstico honesto guiado por IA identifica tu patrón: miedo, culpa, ciclos, distancia. Sin juicio." },
    { n: 2, t: "Recibe tu camino personalizado", d: "8 etapas que se reordenan según tu caso. No es el mismo programa para todos. Es el tuyo." },
    { n: 3, t: "Tu paso 'si… entonces' diario", d: "Un ejercicio mínimo para cuando aparezca la ansiedad, el miedo o la duda. Respuesta clara, no improvisación." },
    { n: 4, t: "Riega cada día 5 minutos", d: "Devocional en la mañana, oración en la noche. Tu constancia echa raíz y tu paz crece contigo." },
  ];
  return (
    <section id="metodo" className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> El Método Raíz
          </div>
          <h2 className="mt-5 font-display font-extrabold text-3xl sm:text-5xl tracking-tight">
            Tus dos mitades, <span className="text-primary">por fin juntas</span>
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Reconectando une lo que la fe te dio —el deseo de acercarte a Dios— con lo que siempre le faltó: un método diario, guiado y sostenible. Cuatro pasos que se vuelven un ritual de 5 minutos, hasta que tu vida espiritual echa raíz.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="app-card p-6 relative overflow-hidden">
              <div className="absolute -top-6 -right-4 font-display font-black text-8xl text-primary/5 select-none">
                {s.n}
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-primary">Paso {s.n}</div>
              <h3 className="mt-3 font-display font-bold text-xl leading-tight">{s.t}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── INSIDE (mockups) ───────────────────────── */

function Inside() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24 bg-secondary/40 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight">
            Mira Reconectando <span className="text-primary">por dentro</span>
          </h2>
          <p className="mt-4 text-muted-foreground">No es otra app de devocionales. Así se ve tu camino cada día.</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Screen title="Buenos días, María" subtitle="Tu palabra de hoy" image={dailyImg} kicker="Devocional" quote="El SEÑOR es mi pastor, nada me faltará." reference="Salmo 23:1" />
          <Screen title="El Consultor" subtitle="Tu compañía cristiana" image={heroImg} kicker="Chat IA" quote="Ese miedo es señal de que te importa. Demos hoy un solo paso pequeño y dejemos que Dios haga el resto." reference="El Consultor · IA" dark />
          <Screen title="Etapa 3 · Rompiendo ciclos" subtitle="12 de 21 días" image={stageImg} kicker="Camino" quote="Suelto la idea de que nunca cambiaré." reference="Ejercicio de hoy" />
        </div>
      </div>
    </section>
  );
}

function Screen({ title, subtitle, image, kicker, quote, reference, dark }: {
  title: string; subtitle: string; image: string; kicker: string; quote: string; reference: string; dark?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className="rounded-[2.2rem] border-[10px] border-foreground bg-card shadow-glow overflow-hidden aspect-[9/17]">
        <div className="relative h-1/2">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest bg-foreground text-background rounded-full px-2.5 py-1">
            {kicker}
          </div>
        </div>
        <div className={`p-4 h-1/2 flex flex-col ${dark ? "bg-divine text-primary-foreground" : ""}`}>
          <div className={`text-xs font-bold ${dark ? "text-gold" : "text-muted-foreground"}`}>{subtitle}</div>
          <div className="font-display font-bold text-lg leading-tight">{title}</div>
          <div className={`mt-auto rounded-2xl p-3 ${dark ? "bg-white/10" : "bg-secondary"}`}>
            <p className="scripture text-sm leading-snug">"{quote}"</p>
            <p className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${dark ? "text-gold" : "text-primary"}`}>{reference}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── FEATURES ───────────────────────── */

function Features() {
  const items = [
    { icon: Sparkles, t: "Tu camino, hecho para ti", d: "El diagnóstico y la IA arman tu ruta. Dejas de improvisar y sabes qué hacer hoy." },
    { icon: BookOpen, t: "El libro y sus ejercicios", d: "Reconectando el Espíritu con Dios completo. Capítulos, notas, marcadores y prácticas guiadas." },
    { icon: MessageCircle, t: "El Consultor Espiritual IA", d: "Acompañamiento cristiano, con Biblia real. Cuando estés triste, ansioso o solo, tienes con quién hablar." },
    { icon: Flame, t: "Racha y check verde", d: "Cada día que abres la app suma. Un mal día no borra tu progreso: tus escudos protegen tu constancia." },
    { icon: HeartHandshake, t: "Oración registrada", d: "Guarda por qué oras. Con el tiempo verás lo que Dios respondió, cuándo y cómo." },
    { icon: Moon, t: "Ritual de mañana y noche", d: "Devocional al despertar, entrega antes de dormir. Dos anclas que ordenan tu día en Dios." },
    { icon: Shield, t: "Diario privado y seguro", d: "Lo que escribes es tuyo. Nadie lo lee. Ni siquiera nosotros." },
    { icon: Heart, t: "Comunidad de fe", d: "Testimonios reales, moderados. Ver a otros avanzar te recuerda que no estás sola." },
  ];
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs font-black uppercase tracking-widest text-primary">Tu ritual diario de 5 minutos</div>
          <h2 className="mt-3 font-display font-extrabold text-3xl sm:text-5xl tracking-tight">
            Todo lo que <span className="text-primary">recibes</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Cada herramienta riega una parte de tu vida espiritual.</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map(({ icon: Icon, t, d }) => (
            <div key={t} className="app-card p-5 hover:-translate-y-1 transition-transform">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-display font-bold text-base leading-tight">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── PRICING ───────────────────────── */

function Pricing() {
  const included = [
    { t: "Ritual diario con IA (mañana y noche)", v: "$120" },
    { t: "Devocionales y oraciones guiadas", v: "$60" },
    { t: "El libro completo + ejercicios", v: "$45" },
    { t: "Consultor Espiritual IA ilimitado", v: "$80" },
    { t: "Diario privado, racha y hitos", v: "$40" },
    { t: "Método 3-6-9: Visualízalo y Vívelo", v: "$50" },
  ];
  return (
    <section id="planes" className="px-4 sm:px-6 py-16 sm:py-24 bg-secondary/40">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight">
            No lo dejes para <span className="text-primary">otro lunes</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Empieza hoy con el plan completo. Si no es para ti, cancelas antes del cobro.</p>
        </div>

        <div className="mt-10 mx-auto max-w-3xl rounded-3xl bg-card border border-border p-6 shadow-soft">
          <ul className="space-y-2.5">
            {included.map((i) => (
              <li key={i.t} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium">{i.t}</span>
                </span>
                <span className="text-muted-foreground line-through font-semibold">{i.v}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-sm">
            Valor real <span className="line-through text-muted-foreground">$395</span> — hoy desde <span className="font-display font-extrabold text-lg text-primary">$4.08/mes</span>.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          <PricingCard
            featured
            title="Anual"
            price="$4.08"
            unit="USD/mes"
            was="antes $6.99"
            note="Un solo pago de $49/año. Hoy pagas $0."
            badge="La más elegida ✨"
            savings="Ahorras 41%"
            bullets={["Acceso completo a todo", "El precio más bajo, todo el año"]}
            cta="Probar completo por $0"
          />
          <PricingCard
            title="Mensual"
            price="$6.99"
            unit="USD/mes"
            note="7 días gratis, luego se cobra cada mes."
            bullets={["Acceso completo", "Sin compromiso anual"]}
            cta="Probar mensual por $0"
          />
        </div>

        <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { n: "Paso 1", t: "Empiezas gratis", d: "Validamos tu prueba con tarjeta. Hoy pagas $0." },
            { n: "Paso 2", t: "Activas con tu correo", d: "Acceso al instante desde cualquier dispositivo." },
            { n: "Paso 3", t: "Tu primer ritual hoy", d: "Diagnóstico, plan personalizado y a caminar." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl bg-card border border-border p-5">
              <div className="text-[10px] font-black uppercase tracking-widest text-primary">{s.n}</div>
              <div className="mt-2 font-display font-bold">{s.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5" /> Pago 100% seguro · Acceso inmediato · Cancelas en 1 clic
        </p>
      </div>
    </section>
  );
}

function PricingCard({ featured, title, price, unit, was, note, badge, savings, bullets, cta }: {
  featured?: boolean; title: string; price: string; unit: string; was?: string; note: string;
  badge?: string; savings?: string; bullets: string[]; cta: string;
}) {
  return (
    <div className={`relative rounded-3xl p-7 border shadow-soft ${featured ? "bg-divine text-primary-foreground border-transparent shadow-glow" : "bg-card border-border"}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground text-[11px] font-black uppercase tracking-widest rounded-full px-3 py-1">
          {badge}
        </div>
      )}
      {savings && (
        <div className={`inline-block text-[11px] font-bold rounded-full px-2.5 py-1 mb-3 ${featured ? "bg-gold/25 text-gold" : "bg-primary/10 text-primary"}`}>
          {savings}
        </div>
      )}
      <div className="font-display font-extrabold text-2xl">{title}</div>
      <div className="mt-3 flex items-end gap-2">
        <span className="font-display font-black text-5xl">{price}</span>
        <span className={`pb-2 text-sm ${featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{unit}</span>
      </div>
      {was && <div className={`text-xs ${featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{was}</div>}
      <p className={`mt-3 text-sm ${featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{note}</p>

      <ul className="mt-5 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm">
            <Check className={`w-4 h-4 ${featured ? "text-gold" : "text-primary"}`} /> {b}
          </li>
        ))}
      </ul>

      <StartButton size="lg" className={`w-full mt-6 rounded-full h-13 font-bold ${featured ? "bg-gold text-gold-foreground hover:bg-gold/90" : "bg-foreground text-background hover:bg-foreground/90"}`}>
        {cta}
      </StartButton>

      {featured && (
        <ul className="mt-5 space-y-1.5 text-xs text-primary-foreground/80">
          <li>• Hoy: acceso total, sin pagar nada</li>
          <li>• Día 5: te avisamos antes del cobro</li>
          <li>• Día 7: recién ahí se cobra, o cancelas en 1 clic</li>
        </ul>
      )}
    </div>
  );
}

/* ───────────────────────── AUTHOR ───────────────────────── */

function Author() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl grid md:grid-cols-[240px_1fr] gap-8 items-center">
        <div className="relative mx-auto">
          <div className="absolute -inset-4 bg-gold/30 blur-2xl rounded-full" />
          <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-card shadow-glow">
            <img src={exerciseImg} alt="El autor" className="w-full h-full object-cover" />
          </div>
        </div>
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-primary">Sobre esta obra</div>
          <h2 className="mt-2 font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
            Hecha con oración, no solo con código.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Reconectando el Espíritu con Dios nace de años de acompañar creyentes que sentían que su vida espiritual se había secado. Aquí encuentras lo que aprendimos: cómo volver, paso a paso, sin fingir, sin apurar, con Dios de vuelta en el centro.
          </p>
          <p className="mt-4 text-sm font-bold">
            Te acompañamos en el camino 💛
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FAQ ───────────────────────── */

function FAQ() {
  const faqs = [
    {
      q: "¿Funciona si mi fe está tibia o dudando?",
      a: "Sí, y es justo para ti. No te pedimos creer más de lo que hoy crees. El método se apoya en 5 minutos diarios de práctica real: una palabra, una oración corta, un paso pequeño. La fe la vuelves a encender tú; el método lo ponemos nosotros.",
    },
    {
      q: "Ya probé apps bíblicas y las dejé a los 3 días. ¿Qué cambia aquí?",
      a: "No fallaste tú: falló el método. Aquí el ritual te espera cada mañana, el Consultor IA te guía cuando estás mal, la racha te sostiene los días flojos y tus escudos perdonan un mal día. No es más contenido; es un camino sostenible.",
    },
    {
      q: "¿La IA reemplaza a un pastor o consejero?",
      a: "No. El Consultor te acompaña 24/7 con Biblia real y con el contenido del libro, pero si hay una situación seria (crisis emocional, salud mental) siempre te recomienda buscar ayuda profesional o espiritual humana. Es compañía, no sustituto.",
    },
    {
      q: "¿Necesito tarjeta para la prueba?",
      a: "Para ver tu diagnóstico y primer ritual no necesitas pagar. Para activar la prueba completa validamos el método de pago, pero hoy se cobra $0. Si cancelas antes de que termine, no pagas nada.",
    },
    {
      q: "¿Me van a cobrar sin avisar?",
      a: "No. Te decimos desde el inicio cuándo termina la prueba. Al día 5 te enviamos aviso. Si cancelas antes del día 7, no se cobra nada.",
    },
    {
      q: "¿Es cristiano-evangélico, católico, o de qué corriente?",
      a: "Es cristiano bíblico. Cuando hay diferentes interpretaciones entre tradiciones cristianas, las reconocemos con respeto. No inventamos doctrinas: lo que enseñamos se apoya en la Biblia y en el contenido autorizado del libro.",
    },
    {
      q: "¿Y si después de probarlo siento que no es para mí?",
      a: "Lo cancelas antes de que terminen tus 7 días, sin llamadas ni explicaciones. Pruebas con todo a tu favor: el único riesgo es quedarte donde estás hoy.",
    },
  ];
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24 bg-secondary/40">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-center">
          Preguntas <span className="text-primary">frecuentes</span>
        </h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => <FAQItem key={f.q} {...f} />)}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
        <span className="font-display font-bold text-base leading-tight">{q}</span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</div>}
    </div>
  );
}

/* ───────────────────────── FINAL CTA ───────────────────────── */

function FinalCTA() {
  return (
    <section className="px-4 sm:px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-divine p-8 sm:p-14 text-center text-primary-foreground shadow-glow relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 text-gold px-3 py-1.5 text-xs font-bold backdrop-blur">
            <Clock className="w-3.5 h-3.5" /> En 90 días…
          </div>
          <h2 className="mt-6 font-display font-extrabold text-3xl sm:text-5xl tracking-tight leading-tight">
            Puedes seguir igual… <br className="hidden sm:block" />
            <span className="text-gold">o llevar 90 días de vuelta con Dios.</span>
          </h2>
          <p className="mt-5 text-primary-foreground/80 max-w-2xl mx-auto">
            La versión de ti que ya vive esa paz empezó un día como hoy, con 5 minutos. Hoy lo pruebas gratis. ¿Lo empiezas o lo dejas para "algún día"?
          </p>
          <StartButton size="lg" className="mt-8 rounded-full bg-gold text-gold-foreground hover:bg-gold/90 h-14 px-10 font-bold text-base shadow-glow">
            Sí, quiero empezar mi camino <ArrowRight className="ml-2 w-4 h-4" />
          </StartButton>
          <p className="mt-4 text-xs text-primary-foreground/70">
            Empieza gratis hoy · prueba completa por $0 · cancelas cuando quieras
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FOOTER ───────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border/60 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-divine grid place-items-center">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
          </div>
          <span className="font-display font-bold text-foreground">Reconectando el Espíritu con Dios</span>
        </div>
        <p>© {new Date().getFullYear()} · Hecho con oración.</p>
      </div>
    </footer>
  );
}

// keep referenced imports used (types)
export type _ = ReactNode;
