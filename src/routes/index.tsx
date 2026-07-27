import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight,
  HeartHandshake, MessageCircle, Sparkles, Shield, Clock, Star, Leaf, Lock,
  TreeDeciduous, Headphones, BookHeart, Dumbbell, Trophy, Layers, Play, Pause,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import audioCierre from "@/assets/origen-cierre.mp3.asset.json";
import pilarMentora from "@/assets/pilar-mentora.png.asset.json";
import pilarPareja from "@/assets/pilar-pareja.png.asset.json";
import pilarPatron from "@/assets/pilar-patron.png.asset.json";
import pilarMinistracion from "@/assets/dios-te-dice-hoy.png.asset.json";
import vivMusic from "@/assets/viv-music.jpg";
import vivCamino from "@/assets/viv-camino.jpg";

/* ───────────────────────── CTA ───────────────────────── */

function useStartTrial() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  async function start() {
    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) { navigate({ to: "/onboarding" }); return; }
      const rand = Math.random().toString(36).slice(2, 10);
      const email = `invitado_${Date.now()}_${rand}@origen.test`;
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

function StartButton({ children, className = "", size }: { children: ReactNode; className?: string; size?: "lg" | "default" }) {
  const { start, loading } = useStartTrial();
  return (
    <Button onClick={start} disabled={loading} size={size} className={className}>
      {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparando tu espacio…</> : children}
    </Button>
  );
}

const CTA_CLASS = "w-full sm:w-auto h-[56px] px-8 rounded-[14px] btn-primary-gradient text-[16px] font-bold shadow-[0_10px_30px_-8px_rgba(124,92,255,.55)] active:scale-[.98] transition";

/* ───────────────────────── ROUTE ───────────────────────── */

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ORIGEN — Entiende por qué repites lo mismo y empieza a romperlo hoy" },
      { name: "description", content: "Una guía espiritual personalizada, basada en tus respuestas: patrón familiar, mentora, audios, ejercicios y diario. Empieza gratis en 3 minutos." },
      { property: "og:title", content: "ORIGEN — Entiende tu historia. Rompe el ciclo." },
      { property: "og:description", content: "Diagnóstico guiado en 3 minutos, mentora acompañante, árbol familiar y audios. Versión gratis disponible." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
        <Problem />
        <Discover />
        <HowItWorks />
        <Benefits />
        <InsideApp />
        <Includes />
        <AudioInvite />
        <Reviews />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}

/* ───────────────────────── NAV ───────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 inset-x-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <div className="w-9 h-9 shrink-0 rounded-2xl bg-brand-gradient grid place-items-center shadow-glow">
            <Leaf className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-black tracking-tight truncate">ORIGEN</span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/auth" className="hidden sm:inline-flex h-10 items-center px-4 rounded-[12px] text-sm font-semibold text-foreground/70 hover:text-foreground">
            Entrar
          </Link>
          <StartButton className="h-10 px-5 rounded-[12px] btn-primary-gradient text-sm font-bold">Empezar gratis</StartButton>
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────── 1. HERO ───────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "radial-gradient(120% 70% at 50% 0%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 70%)" }}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-14 lg:pt-16 lg:pb-20 grid lg:grid-cols-2 gap-10 items-center">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-secondary text-primary text-[12px] font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Basado en el método ORIGEN
          </span>
          <h1 className="font-display font-black leading-[1.08] text-[32px] sm:text-[42px] lg:text-[50px] mt-4">
            Entiende por qué se repite lo mismo{" "}
            <span className="bg-brand-gradient bg-clip-text text-transparent">en tu historia</span>
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground max-w-[46ch]">
            ORIGEN te hace las preguntas correctas, ordena tu historia familiar y te devuelve una guía personalizada
            con pasos de 5 minutos al día. No sustituye terapia: te acompaña todos los días.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <StartButton className={CTA_CLASS}>
              Empezar gratis <ArrowRight className="w-4 h-4 ml-2" />
            </StartButton>
            <a href="#por-dentro" className="h-[56px] px-6 inline-flex items-center justify-center rounded-[14px] border-2 border-border bg-card text-[15px] font-semibold">
              Ver la app por dentro
            </a>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">Sin tarjeta. 3 minutos. Puedes quedarte en el plan gratis.</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-[#F7B955]" /> 4.8 / 5 en la comunidad</span>
            <span className="inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" /> Privado y confidencial</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> 5 min al día</span>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[28px] overflow-hidden shadow-[0_30px_70px_-30px_rgba(124,92,255,.55)] border border-border">
            <img src={heroImg} alt="Mujer en calma iniciando su camino de sanación con ORIGEN" className="w-full h-auto block" />
          </div>
          <div className="absolute -bottom-5 left-4 right-4 sm:left-8 sm:right-8 rounded-[20px] bg-card border border-border shadow-soft p-4 flex items-center gap-3">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-secondary grid place-items-center"><Sparkles className="w-5 h-5 text-primary" /></span>
            <p className="text-[13px] leading-snug min-w-0">
              <strong className="font-display">Tu guía se arma con tus respuestas</strong>
              <span className="block text-muted-foreground">Nada genérico: parte de lo que tú cuentas.</span>
            </p>
          </div>
        </div>
      </div>
      <div className="h-6" />
    </section>
  );
}

/* ───────────────────────── 2. EL PROBLEMA ───────────────────────── */

const PAINS = [
  { t: "“Vuelvo a caer en lo mismo”", d: "Otra relación, otra deuda, otra promesa rota. Cambian los nombres, no el final." },
  { t: "“Siento un vacío que no sé explicar”", d: "Tienes motivos para estar bien y aun así algo dentro no termina de encajar." },
  { t: "“Empiezo con todo y abandono”", d: "El libro, la app, la terapia. Arrancas con fe y a la semana se apaga." },
  { t: "“Ya probé de todo”", d: "Consejos genéricos que no tocan tu historia real ni de dónde vienes." },
];

function Problem() {
  return (
    <Section id="problema" eyebrow="El problema" title="Si algo se repite, no es falta de voluntad" sub="Es una historia que nadie te ayudó a leer. Ver estas frases y decir “esa soy yo” ya es el primer paso.">
      <div className="grid sm:grid-cols-2 gap-3">
        {PAINS.map((p) => (
          <div key={p.t} className="rounded-[20px] border border-border bg-card p-5 shadow-soft">
            <div className="w-11 h-11 rounded-2xl bg-secondary grid place-items-center mb-3">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-[16px]">{p.t}</h3>
            <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">{p.d}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-center text-[14px] text-muted-foreground">
        No es tu culpa. Y tampoco tienes que resolverlo sola.
      </p>
    </Section>
  );
}

/* ───────────────────────── 3. QUÉ DESCUBRIRÁ ───────────────────────── */

const DISCOVER = [
  { icon: TreeDeciduous, color: "#3FBE8F", t: "De dónde viene lo que repites", d: "Ordenamos tu línea materna y paterna para ver el hilo que se hereda." },
  { icon: Sparkles, color: "#7C5CFF", t: "El nombre de tu patrón", d: "Una lectura clara de tu situación, escrita a partir de tus propias respuestas." },
  { icon: Layers, color: "#61A8FF", t: "Tu primer paso concreto", d: "Una misión de hoy, corta y realista, no una lista imposible." },
];

function Discover() {
  return (
    <Section eyebrow="En 3 minutos" title="Qué vas a descubrir hoy mismo" sub="Nada de promesas mágicas: una guía personalizada construida con lo que tú respondes.">
      <div className="grid sm:grid-cols-3 gap-3">
        {DISCOVER.map(({ icon: Icon, color, t, d }) => (
          <div key={t} className="rounded-[20px] border border-border bg-card p-5 shadow-soft">
            <span className="w-12 h-12 rounded-2xl grid place-items-center" style={{ background: `${color}1F`, color }}>
              <Icon className="w-5 h-5" />
            </span>
            <h3 className="font-display font-bold text-[16px] mt-3">{t}</h3>
            <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────── 4. CÓMO FUNCIONA ───────────────────────── */

const STEPS = [
  { n: "1", t: "Cuentas tu historia", d: "Preguntas suaves sobre tu familia, tu infancia y lo que hoy te pesa. Una a la vez." },
  { n: "2", t: "Recibes tu guía", d: "Te devolvemos una lectura personalizada y tu Camino ORIGEN por etapas." },
  { n: "3", t: "Practicas 5 min al día", d: "Audio, ejercicio o escritura. Tu racha y tus hojas de sanación se van sumando." },
];

function HowItWorks() {
  return (
    <Section eyebrow="Cómo funciona" title="Tres pasos. Sin complicarte." sub="Diseñado para que lo termines, no para que lo abandones.">
      <div className="grid sm:grid-cols-3 gap-3">
        {STEPS.map((s) => (
          <div key={s.n} className="relative rounded-[20px] border border-border bg-card p-5 shadow-soft">
            <span className="w-11 h-11 rounded-2xl bg-brand-gradient text-primary-foreground grid place-items-center font-display font-black text-lg">{s.n}</span>
            <h3 className="font-display font-bold text-[16px] mt-3">{s.t}</h3>
            <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────── 5. BENEFICIOS ───────────────────────── */

const BENEFITS = [
  { t: "Dejas de improvisar", d: "Cada día sabes exactamente qué hacer y por qué te sirve." },
  { t: "Te entiendes sin juzgarte", d: "Ver el origen quita culpa y devuelve claridad." },
  { t: "Avanzas sin abandonar", d: "Sesiones de 5 minutos, racha visible y logros reales." },
  { t: "No estás sola en el proceso", d: "Una mentora acompañante disponible cuando lo necesites." },
];

function Benefits() {
  return (
    <Section eyebrow="Lo que cambia" title="Cómo se siente tu día con ORIGEN" sub="No son funciones sueltas: es una rutina que sostiene.">
      <div className="grid sm:grid-cols-2 gap-3">
        {BENEFITS.map((b) => (
          <div key={b.t} className="rounded-[20px] border border-border bg-card p-5 shadow-soft flex gap-3">
            <span className="w-11 h-11 shrink-0 rounded-2xl bg-secondary grid place-items-center">
              <Check className="w-5 h-5 text-primary" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-[16px]">{b.t}</h3>
              <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">{b.d}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────── 6. LA APP POR DENTRO (sin registro, sin slider) ───────────── */

const SCREENS = [
  { img: pilarMentora.url, t: "Chat con tu mentora", d: "Conversa sobre lo que sientes hoy y recibe una respuesta guiada, con base en el método." },
  { img: pilarPareja.url, t: "¿Tu pareja es deuda o propósito?", d: "Un análisis honesto del vínculo que estás viviendo y qué toca sanar en ti." },
  { img: pilarPatron.url, t: "Patrones familiares", d: "Descubre qué se repite en tu linaje y del lado de quién viene." },
  { img: pilarMinistracion.url, t: "Consulta al Cielo", d: "Escribe tu duda del día y recibe una palabra clara, con un paso para romper el ciclo." },
];

function InsideApp() {
  return (
    <Section id="por-dentro" eyebrow="Mira antes de registrarte" title="Así se ve ORIGEN por dentro" sub="Estas son las secciones que usarás desde el primer día.">
      <div className="grid sm:grid-cols-2 gap-4">
        {SCREENS.map((s) => (
          <article key={s.t} className="rounded-[24px] overflow-hidden border border-border bg-card shadow-soft">
            <img src={s.img} alt={s.t} loading="lazy" className="w-full h-auto block" />
            <div className="p-5">
              <h3 className="font-display font-bold text-[16px]">{s.t}</h3>
              <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">{s.d}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <article className="rounded-[24px] overflow-hidden border border-border bg-card shadow-soft">
          <img src={vivMusic} alt="Visualízalo y Vívelo: playlist guiada de manifestación" loading="lazy" className="w-full h-48 object-cover" />
          <div className="p-5">
            <h3 className="font-display font-bold text-[16px]">Visualízalo y Vívelo</h3>
            <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">
              Audios guiados, afirmaciones, juegos y ejercicios por categoría: música, limpieza espiritual, identidad y método 3·6·9.
            </p>
          </div>
        </article>
        <article className="rounded-[24px] overflow-hidden border border-border bg-card shadow-soft">
          <img src={vivCamino} alt="Camino ORIGEN por etapas según tu situación" loading="lazy" className="w-full h-48 object-cover" />
          <div className="p-5">
            <h3 className="font-display font-bold text-[16px]">Tu Camino por etapas</h3>
            <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">
              Etapas ordenadas según tu situación, con lecciones, quiz, sopa de letras y ejercicios que cambian cada día.
            </p>
          </div>
        </article>
      </div>
    </Section>
  );
}

/* ───────────────────────── 7. TODO LO QUE INCLUYE ───────────────────────── */

const INCLUDES = [
  { icon: MessageCircle, t: "Mentora acompañante", d: "Responde tus dudas con el lenguaje del método." },
  { icon: TreeDeciduous, t: "Árbol familiar", d: "Registra a los tuyos, con foto, y ve el linaje completo." },
  { icon: HeartHandshake, t: "Análisis de pareja y patrones", d: "Lecturas guardadas y descargables en PDF." },
  { icon: Headphones, t: "Audios y meditaciones", d: "Playlist guiada para escuchar mientras respiras." },
  { icon: Dumbbell, t: "Ejercicios diarios", d: "Prácticas cortas que cambian todos los días." },
  { icon: BookHeart, t: "Diario íntimo", d: "Un lugar privado para escribir lo que no dices." },
  { icon: Layers, t: "Seguimiento y racha", d: "Tu progreso guardado, día a día, hasta 365." },
  { icon: Trophy, t: "Hojas de sanación", d: "Puntos canjeables por más consultas y premios." },
];

function Includes() {
  return (
    <Section eyebrow="Todo lo que incluye" title="Un solo lugar para tu proceso" sub="Todo conectado: lo que descubres se refleja en tu camino.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {INCLUDES.map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-[20px] border border-border bg-card p-4 shadow-soft">
            <span className="w-11 h-11 rounded-2xl bg-secondary grid place-items-center"><Icon className="w-5 h-5 text-primary" /></span>
            <h3 className="font-display font-bold text-[14px] mt-3">{t}</h3>
            <p className="text-[13px] text-muted-foreground mt-1 leading-snug">{d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────── AUDIO CTA ───────────────────────── */

function AudioInvite() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("ended", onEnd); };
  }, []);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="rounded-[28px] p-6 sm:p-8 bg-brand-gradient text-primary-foreground shadow-[0_25px_60px_-25px_rgba(124,92,255,.65)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] gap-6 items-center">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
              <Headphones className="w-3.5 h-3.5" /> Audio · 1 minuto
            </span>
            <h2 className="font-display font-black text-[24px] sm:text-[30px] leading-tight mt-3">
              Escucha el cierre del método ORIGEN
            </h2>
            <p className="text-[15px] opacity-90 mt-2 max-w-[52ch] leading-relaxed">
              Un minuto para entender por qué tu pasado explica tu presente… y cómo podemos acompañarte desde hoy.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={toggle}
                aria-label={playing ? "Pausar audio" : "Reproducir audio"}
                className="w-14 h-14 shrink-0 rounded-full bg-card text-primary grid place-items-center shadow-soft active:scale-95 transition"
              >
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="h-2 rounded-full bg-white/25 overflow-hidden">
                  <div className="h-full bg-card transition-[width] duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[12px] opacity-85 mt-1.5">Ruth Esther · Invitación del método ORIGEN</p>
              </div>
            </div>
            <audio ref={ref} src={audioCierre.url} preload="none" />
          </div>

          <StartButton className="w-full lg:w-auto h-[56px] px-8 rounded-[14px] bg-card text-primary hover:bg-card/90 text-[16px] font-bold">
            Quiero conocer mi origen <ArrowRight className="w-4 h-4 ml-2" />
          </StartButton>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── 8. TESTIMONIOS (slider) ───────────────────────── */

const REVIEWS = [
  { n: "Marielys, 34", c: "Llevaba años diciendo que tenía mala suerte con los hombres. Ver el patrón del lado de mi mamá me cayó como un balde de agua… y por fin entendí." },
  { n: "Jocelyn, 41", c: "Lo que más me sirvió fue lo corto. Cinco minutos al día sí los tengo. Llevo 26 días seguidos y es la primera vez que no abandono." },
  { n: "Andrés, 29", c: "Entré escéptico. No me impusieron religión, me hicieron preguntas. La lectura de pareja me dolió, pero era verdad." },
  { n: "Rosa, 47", c: "El diario y los audios se volvieron mi rato de paz en la noche. Mi casa está igual, yo no." },
  { n: "Katherine, 38", c: "Armar el árbol con las fotos de mi familia me removió. Verlo ordenado explicó cosas que nadie me había dicho." },
];

function Reviews() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % REVIEWS.length), 6000);
    return () => clearInterval(id);
  }, []);
  const r = REVIEWS[i];
  return (
    <Section eyebrow="Testimonios" title="Lo que cuentan quienes ya empezaron" sub="Historias reales de la comunidad ORIGEN.">
      <div className="rounded-[24px] border border-border bg-card shadow-soft p-6 sm:p-8">
        <div className="flex gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="w-4 h-4 text-[#F7B955] fill-[#F7B955]" />)}
        </div>
        <p key={r.n} className="text-[16px] sm:text-[18px] leading-relaxed font-display animate-fade-in">“{r.c}”</p>
        <p className="text-[13px] text-muted-foreground mt-3 font-semibold">{r.n}</p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {REVIEWS.map((_, k) => (
              <button
                key={k} onClick={() => setI(k)} aria-label={`Testimonio ${k + 1}`}
                className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-primary" : "w-2 bg-border"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setI((v) => (v - 1 + REVIEWS.length) % REVIEWS.length)} aria-label="Anterior" className="w-11 h-11 rounded-full border border-border grid place-items-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setI((v) => (v + 1) % REVIEWS.length)} aria-label="Siguiente" className="w-11 h-11 rounded-full border border-border grid place-items-center">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ───────────────────────── 9. PLANES ───────────────────────── */

const FREE = [
  "Diagnóstico completo y tu guía personalizada",
  "Etapa 1 del Camino ORIGEN",
  "Visualízalo y Vívelo: primer audio del playlist + afirmaciones, juegos y ejercicios",
  "1 consulta al día en cada sección: mentora, pareja y patrones familiares",
  "Diario íntimo (hasta 5 entradas)",
  "Hojas de sanación canjeables por consultas extra",
];

const PAID = [
  "Todo lo del plan Explorador, sin límites diarios",
  "Las 8 etapas y el Camino 365 completo",
  "Playlist completa de audios y meditaciones",
  "Análisis ilimitados de pareja, patrones y Consulta al Cielo",
  "Árbol familiar con fotos y ejercicios diarios nuevos",
  "Historial completo y descarga en PDF",
];

function Pricing() {
  return (
    <Section id="planes" eyebrow="Planes" title="Empieza gratis. Sube solo si te sirve." sub="Sin letra chica: aquí ves exactamente qué incluye cada plan.">
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Gratis */}
        <div className="rounded-[24px] border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display font-bold text-[18px]">Explorador</h3>
          <p className="text-[13px] text-muted-foreground mt-1">Para conocerte y empezar hoy.</p>
          <div className="mt-4 flex items-end gap-1">
            <span className="font-display font-black text-[36px] leading-none">US$0</span>
            <span className="text-[13px] text-muted-foreground mb-1">para siempre</span>
          </div>
          <ul className="mt-5 space-y-2.5">
            {FREE.map((f) => (
              <li key={f} className="flex gap-2.5 text-[14px] leading-snug">
                <span className="w-5 h-5 shrink-0 rounded-full bg-secondary grid place-items-center mt-0.5"><Check className="w-3 h-3 text-primary" /></span>
                {f}
              </li>
            ))}
          </ul>
          <StartButton className="mt-6 w-full h-[52px] rounded-[14px] border-2 border-primary bg-transparent text-primary hover:bg-secondary text-[15px] font-bold">
            Empezar gratis
          </StartButton>
        </div>

        {/* Pago */}
        <div className="relative rounded-[24px] border-2 border-primary bg-card p-6 shadow-[0_20px_50px_-20px_rgba(124,92,255,.5)]">
          <span className="absolute -top-3 left-6 h-7 px-3 rounded-full bg-brand-gradient text-primary-foreground text-[11px] font-bold grid place-items-center">
            6 meses gratis al año
          </span>
          <h3 className="font-display font-bold text-[18px]">Camino Origen</h3>
          <p className="text-[13px] text-muted-foreground mt-1">Para ir hasta el fondo, sin límites.</p>
          <div className="mt-4 flex items-end gap-1">
            <span className="font-display font-black text-[36px] leading-none">US$5.99</span>
            <span className="text-[13px] text-muted-foreground mb-1">/mes (plan anual US$71.88)</span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">O US$14.99 al mes si prefieres mes a mes. Cancela cuando quieras.</p>
          <ul className="mt-5 space-y-2.5">
            {PAID.map((f) => (
              <li key={f} className="flex gap-2.5 text-[14px] leading-snug">
                <span className="w-5 h-5 shrink-0 rounded-full bg-brand-gradient grid place-items-center mt-0.5"><Check className="w-3 h-3 text-primary-foreground" /></span>
                {f}
              </li>
            ))}
          </ul>
          <StartButton className="mt-6 w-full h-[56px] rounded-[14px] btn-primary-gradient text-[16px] font-bold">
            Empezar mis 7 días gratis
          </StartButton>
          <p className="text-[12px] text-muted-foreground mt-3 text-center">Te avisamos antes de cualquier cobro.</p>
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-border bg-secondary/50 p-5 flex gap-3">
        <span className="w-11 h-11 shrink-0 rounded-2xl bg-card grid place-items-center"><Shield className="w-5 h-5 text-primary" /></span>
        <div>
          <h3 className="font-display font-bold text-[15px]">Garantía humana de 7 días</h3>
          <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">
            Si sientes que ORIGEN no es para ti, escríbenos dentro de los primeros 7 días y te devolvemos tu dinero. Sin preguntas incómodas.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ───────────────────────── 10. FAQ ───────────────────────── */

const FAQS = [
  { q: "¿Esto reemplaza la terapia?", a: "No. ORIGEN es acompañamiento y guía espiritual personalizada a partir de tus respuestas. No da diagnósticos clínicos ni sustituye atención psicológica o médica." },
  { q: "Ya probé apps y libros y siempre abandono. ¿Por qué esto sí?", a: "Porque son sesiones de 5 minutos con un paso concreto al día, con racha y recordatorios. No te pide una hora libre que no tienes." },
  { q: "¿Me van a imponer una religión?", a: "No. El método usa lenguaje espiritual y bíblico como referencia, pero no exige que creas nada. Puedes usar solo la parte práctica." },
  { q: "¿Qué pasa con el precio? ¿Y si no puedo pagar ahora?", a: "Puedes quedarte en el plan Explorador gratis para siempre y ganar hojas de sanación para hacer más consultas. Cuando quieras más, subes." },
  { q: "¿Mi información es privada?", a: "Sí. Tu diario, tu árbol y tus lecturas solo los ves tú desde tu cuenta. Puedes borrar tu contenido cuando quieras." },
  { q: "¿La app sabe mi patrón antes de que yo responda?", a: "No. Tu lectura se construye con lo que tú compartes en el diagnóstico. Si respondes con honestidad, la guía se ajusta mejor." },
  { q: "¿Cuánto tardo en empezar?", a: "Unos 3 minutos. Al terminar el diagnóstico ya recibes tu guía y tu primera misión." },
];

function FAQ() {
  return (
    <Section id="faq" eyebrow="Preguntas frecuentes" title="Lo que suelen preguntarnos antes de empezar">
      <div className="space-y-2.5">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-[18px] border border-border bg-card p-4 shadow-soft">
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
              <span className="font-display font-bold text-[15px]">{f.q}</span>
              <ChevronDown className="w-4 h-4 shrink-0 text-primary transition-transform group-open:rotate-180" />
            </summary>
            <p className="text-[14px] text-muted-foreground mt-2.5 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────── CTA FINAL ───────────────────────── */

function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
      <div className="rounded-[28px] border border-border bg-card p-8 sm:p-12 text-center shadow-soft relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "radial-gradient(90% 70% at 50% 0%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 70%)" }}
        />
        <span className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-secondary text-primary text-[12px] font-bold">
          <Leaf className="w-3.5 h-3.5" /> Empieza hoy
        </span>
        <h2 className="font-display font-black text-[28px] sm:text-[38px] leading-tight mt-4 max-w-[20ch] mx-auto">
          Lo que sanas en ti, deja de heredarse
        </h2>
        <p className="text-[16px] text-muted-foreground mt-3 max-w-[52ch] mx-auto leading-relaxed">
          No tienes que entenderlo todo hoy. Solo empezar. Tres minutos y verás tu historia con otros ojos.
        </p>
        <div className="mt-6 flex justify-center">
          <StartButton className={CTA_CLASS}>Empezar gratis <ArrowRight className="w-4 h-4 ml-2" /></StartButton>
        </div>
        <p className="text-[12px] text-muted-foreground mt-3">Sin tarjeta · Plan gratis para siempre · Cancela cuando quieras</p>
        <p className="text-[13px] text-muted-foreground mt-6 max-w-[54ch] mx-auto italic">
          P.D. Si llegaste hasta aquí, algo dentro de ti ya sabe que esto se repite. Darle nombre es el principio de romperlo.
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────── FOOTER + STICKY ───────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-gradient grid place-items-center"><Leaf className="w-4 h-4 text-primary-foreground" /></div>
          <span className="font-display font-bold">ORIGEN</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
          <Link to="/auth">Entrar</Link>
          <a href="#planes">Planes</a>
          <a href="#faq">Preguntas</a>
          <a href="mailto:infodenegociorm@gmail.com">infodenegociorm@gmail.com</a>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-8 text-[11px] text-muted-foreground leading-relaxed">
        ORIGEN ofrece acompañamiento espiritual y educativo. No sustituye atención psicológica, médica ni tratamiento profesional.
        Si atraviesas una crisis, busca ayuda profesional en tu país. © {new Date().getFullYear()} ORIGEN.
      </div>
    </footer>
  );
}

function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-background/90 backdrop-blur-xl border-t border-border" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
      <StartButton className="w-full h-[54px] rounded-[14px] btn-primary-gradient text-[16px] font-bold">
        Empezar gratis <ArrowRight className="w-4 h-4 ml-2" />
      </StartButton>
    </div>
  );
}

/* ───────────────────────── SECTION SHELL ───────────────────────── */

function Section({ id, eyebrow, title, sub, children }: { id?: string; eyebrow: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 sm:px-6 py-10 lg:py-14 scroll-mt-16">
      <div className="max-w-2xl mb-6">
        <span className="text-[11px] uppercase tracking-widest font-bold text-primary">{eyebrow}</span>
        <h2 className="font-display font-black text-[26px] sm:text-[34px] leading-tight mt-2">{title}</h2>
        {sub && <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">{sub}</p>}
        <div className="hairline-brand mt-4" />
      </div>
      {children}
    </section>
  );
}

/* deja Lock referenciado para futuras secciones bloqueadas */
export const _icons = { Lock };
