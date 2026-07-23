import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, ArrowRight, Check, ChevronDown, HeartHandshake, MessageCircle,
  Sparkles, Users2, Shield, Clock, Star, Flame, Leaf, Lock,
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
      { title: "ORIGEN — Entiende por qué repites lo mismo y rómpelo en 5 minutos al día" },
      { name: "description", content: "El método de Ruth Esther para descubrir el patrón que arrastras de tu familia, romper el ciclo y sentir paz real. Basado en el libro. Sin religión impuesta." },
      { property: "og:title", content: "ORIGEN — Rompe el patrón que arrastras" },
      { property: "og:description", content: "Descubre tu patrón familiar en 3 minutos. Método guiado + mentora IA. 7 días gratis." },
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
        <Pain />
        <Cost />
        <Method />
        <Inside />
        <Reviews />
        <Pricing />
        <Guarantee />
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
    <header className="sticky top-0 inset-x-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-brand-gradient grid place-items-center shadow-glow">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <div className="font-display font-extrabold text-[15px] tracking-tight">ORIGEN</div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-primary font-bold">Rompe el patrón</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden sm:block text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2">
            Entrar
          </Link>
          <StartButton className="rounded-full btn-primary-gradient px-4 h-10 font-bold text-[13px]">
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
    <section className="relative overflow-hidden bg-aura-top">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-14 pb-12 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-border/60 backdrop-blur px-3 py-1.5 text-[11px] font-bold text-primary shadow-soft">
            <Sparkles className="w-3.5 h-3.5" /> Basado en el libro de Ruth Esther
          </div>

          <h1 className="mt-5 font-display font-extrabold text-[34px] sm:text-6xl lg:text-[68px] leading-[1.02] tracking-tight">
            Repites lo mismo y no sabes por qué.
            <span className="block mt-3 text-transparent bg-clip-text bg-brand-gradient">
              En 3 minutos vas a saberlo.
            </span>
          </h1>

          <p className="mt-5 text-[16px] sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
            No es tu culpa. Es un patrón que heredaste. Con ORIGEN lo descubres, lo entiendes y aprendes a romperlo. Sin religión impuesta. Sin terapia genérica.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <StartButton size="lg" className="rounded-full h-14 px-7 btn-primary-gradient font-bold text-[15px]">
              Descubrir mi patrón gratis <ArrowRight className="ml-2 w-4 h-4" />
            </StartButton>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" /> 7 días gratis · cancelas en 1 clic · sin tarjeta al inicio
          </p>

          <div className="mt-7 flex items-center gap-4 flex-wrap">
            <div className="flex -space-x-2">
              {["#F58BCB","#7C5CFF","#5AA9FF","#3FBE8F"].map((c, i) => (
                <span key={i} className="w-8 h-8 rounded-full ring-2 ring-background" style={{ background: c }} />
              ))}
            </div>
            <p className="text-[13px] text-muted-foreground">
              <span className="font-bold text-foreground">+2,300 personas</span> ya entendieron su origen.
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
    <div className="relative mx-auto w-full max-w-[380px]">
      <div className="absolute -inset-10 bg-primary/25 blur-3xl rounded-full -z-10" />
      <div className="hero-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Tu mapa ORIGEN</span>
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#F58BCB]">
            <Flame className="w-3.5 h-3.5" /> 3 min
          </div>
        </div>
        <h3 className="font-display font-bold text-[19px] leading-tight">
          Patrón detectado: <span className="text-primary">"Cargo lo que no me toca"</span>
        </h3>
        <p className="text-[13px] text-muted-foreground">
          Vienes de mujeres que aguantaron en silencio. Repites la lealtad invisible sin darte cuenta.
        </p>

        <div className="rounded-2xl bg-secondary p-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-primary">Tu primer paso</div>
          <p className="mt-1.5 text-[13px] font-semibold">
            Escribir en una hoja lo que tu abuela nunca dijo. Hoy, 5 minutos.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { i: <MessageCircle className="w-4 h-4" />, t: "Mentora" },
            { i: <HeartHandshake className="w-4 h-4" />, t: "Pareja" },
            { i: <Users2 className="w-4 h-4" />, t: "Patrón" },
          ].map((x) => (
            <div key={x.t} className="rounded-xl bg-white border border-border/60 p-2.5 text-center">
              <div className="w-8 h-8 mx-auto rounded-lg bg-primary/10 text-primary grid place-items-center">{x.i}</div>
              <div className="mt-1.5 text-[11px] font-bold">{x.t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── PAIN ───────────────────────── */
function Pain() {
  const items = [
    { t: "\"Repito los mismos errores\"", d: "Cambias de pareja, de trabajo, de ciudad. El escenario cambia. El dolor no." },
    { t: "\"Siento un vacío que no sé explicar\"", d: "Tienes lo que pediste. Y por dentro sigues faltándote algo. Ni tú sabes qué." },
    { t: "\"Empiezo con todo y a los 5 días lo dejo\"", d: "Terapia, libros, apps. Nada te sostuvo. Volviste al mismo lugar." },
  ];
  return (
    <section className="px-4 sm:px-6 py-14 sm:py-20 border-t border-border/40">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-display font-extrabold text-[28px] sm:text-5xl tracking-tight leading-tight">
          ¿Te suena algo de esto?
        </h2>
      </div>
      <div className="mx-auto max-w-5xl mt-10 grid md:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.t} className="app-card p-5">
            <div className="w-11 h-11 rounded-2xl bg-[#F58BCB]/15 text-[#F58BCB] grid place-items-center">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-display font-bold text-[17px] leading-snug">{it.t}</h3>
            <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">{it.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── COST ───────────────────────── */
function Cost() {
  return (
    <section className="px-4 sm:px-6 py-14 sm:py-20 bg-secondary/40">
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-3 py-1.5 text-[11px] font-bold shadow-soft border border-border/60">
          <Clock className="w-3.5 h-3.5" /> Cada día que pasa
        </div>
        <h2 className="mt-5 font-display font-extrabold text-[28px] sm:text-5xl tracking-tight leading-tight">
          El patrón no espera. <span className="text-primary">Se transmite.</span>
        </h2>
        <p className="mt-5 text-muted-foreground leading-relaxed">
          Lo que no entiendes de tu historia, lo repites. Lo que no rompes, se lo pasas a tus hijos. Y a los suyos.
        </p>
        <p className="mt-4 font-display font-bold text-[18px]">
          No necesitas más fuerza de voluntad. Necesitas entender de dónde viene.
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────── METHOD ───────────────────────── */
function Method() {
  const steps = [
    { n: 1, i: <Users2 className="w-5 h-5" />, t: "Mapeas tu origen", d: "Tu árbol, tu infancia y tus vínculos. 3 minutos guiados." },
    { n: 2, i: <Sparkles className="w-5 h-5" />, t: "Recibes tu patrón", d: "La mentora te dice qué se está repitiendo y por qué." },
    { n: 3, i: <Leaf className="w-5 h-5" />, t: "Lo rompes en 5 min al día", d: "Ejercicios, audios y micro-pasos hechos para tu caso." },
  ];
  return (
    <section id="metodo" className="px-4 sm:px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" /> El método ORIGEN
          </div>
          <h2 className="mt-4 font-display font-extrabold text-[28px] sm:text-5xl tracking-tight leading-tight">
            3 pasos. Nada de teoría.
          </h2>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-3">
          {steps.map((s) => (
            <div key={s.n} className="app-card p-5 relative overflow-hidden">
              <div className="absolute -top-4 -right-2 font-display font-black text-8xl text-primary/5 select-none">{s.n}</div>
              <div className="w-11 h-11 rounded-2xl bg-brand-gradient text-white grid place-items-center shadow-glow">{s.i}</div>
              <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-primary">Paso {s.n}</div>
              <h3 className="mt-1 font-display font-bold text-[18px] leading-tight">{s.t}</h3>
              <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── INSIDE ───────────────────────── */
function Inside() {
  const feats = [
    { i: <MessageCircle className="w-5 h-5" />, t: "Mentora Ruth Esther", d: "Chat 24/7 con la voz del libro. Te escucha y te guía sin juzgar.", c: "#7C5CFF" },
    { i: <HeartHandshake className="w-5 h-5" />, t: "Análisis de pareja", d: "¿Es propósito o deuda ancestral? Descúbrelo en minutos.", c: "#F58BCB" },
    { i: <Users2 className="w-5 h-5" />, t: "Patrón familiar", d: "Tu árbol + tu historia = qué se repite y cómo romperlo.", c: "#3FBE8F" },
    { i: <Leaf className="w-5 h-5" />, t: "Camino diario", d: "Etapas, ejercicios, audios y diario. 5 min al día.", c: "#5AA9FF" },
  ];
  return (
    <section className="px-4 sm:px-6 py-14 sm:py-20 bg-secondary/40">
      <div className="mx-auto max-w-5xl">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-[28px] sm:text-5xl tracking-tight leading-tight">
            Todo en un solo lugar.
          </h2>
          <p className="mt-3 text-muted-foreground">Sin apps sueltas. Sin buscar en YouTube. Sin gastar en 10 cosas.</p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 gap-3">
          {feats.map((f) => (
            <div key={f.t} className="app-card p-5 flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl grid place-items-center text-white shadow-soft shrink-0" style={{ background: f.c }}>
                {f.i}
              </div>
              <div>
                <h3 className="font-display font-bold text-[16px]">{f.t}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── REVIEWS (slider) ───────────────────────── */
const REVIEWS = [
  { n: "María, 34", c: "México", t: "Entendí en 3 minutos algo que 2 años de terapia no me habían dicho. Ya no me culpo por lo que traigo de mi mamá." },
  { n: "Andrés, 41", c: "Colombia", t: "Me sorprendió que no me hablaran de religión. Es directo, honesto y por primera vez sostengo el hábito." },
  { n: "Lucía, 29", c: "Argentina", t: "Hice el análisis de pareja y solté una relación que llevaba 4 años atrasándome. Nunca lo vi tan claro." },
  { n: "Rosa, 47", c: "R. Dominicana", t: "Soy escéptica. Pagué el año porque en la primera semana pasó algo dentro de mí que no esperaba." },
  { n: "Kevin, 26", c: "España", t: "5 minutos al día. Lo estoy haciendo. Nunca sostuve nada tanto tiempo. Eso solo ya me cambió." },
];
function Reviews() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % REVIEWS.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="px-4 sm:px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="w-4 h-4 fill-[#F7B955] text-[#F7B955]" />)}
            <span className="ml-2 text-[13px] font-bold">4.9 / 5 · +2,300 personas</span>
          </div>
          <h2 className="mt-4 font-display font-extrabold text-[28px] sm:text-5xl tracking-tight leading-tight">
            Lo que dicen quienes empezaron.
          </h2>
        </div>

        <div className="mt-10 relative">
          <div className="app-card p-6 sm:p-8 min-h-[220px]">
            <div className="text-primary text-5xl font-display leading-none">"</div>
            <p className="mt-2 text-[16px] sm:text-lg leading-relaxed font-medium">{REVIEWS[i].t}</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-gradient text-white grid place-items-center font-display font-bold shadow-glow">
                {REVIEWS[i].n[0]}
              </div>
              <div>
                <div className="font-bold text-[14px]">{REVIEWS[i].n}</div>
                <div className="text-[12px] text-muted-foreground">{REVIEWS[i].c}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {REVIEWS.map((_, k) => (
              <button key={k} onClick={() => setI(k)}
                className={"h-2 rounded-full transition-all " + (k === i ? "w-7 bg-primary" : "w-2 bg-border")}
                aria-label={`Testimonio ${k + 1}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── PRICING ───────────────────────── */
function Pricing() {
  const [plan, setPlan] = useState<"anual" | "mensual">("anual");
  return (
    <section id="planes" className="px-4 sm:px-6 py-14 sm:py-20 bg-secondary/40">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="font-display font-extrabold text-[28px] sm:text-5xl tracking-tight leading-tight">
            Elige tu camino.
          </h2>
          <p className="mt-3 text-muted-foreground">7 días gratis en ambos planes. Cancelas cuando quieras.</p>
        </div>

        <div className="mt-8 inline-flex mx-auto rounded-full bg-white p-1 border border-border/60 shadow-soft" style={{ display: "flex", width: "fit-content", marginInline: "auto" }}>
          <button onClick={() => setPlan("anual")}
            className={"px-4 h-10 rounded-full text-[13px] font-bold transition " + (plan === "anual" ? "bg-brand-gradient text-white shadow-glow" : "text-muted-foreground")}>
            Anual · <span className="opacity-80">6 meses gratis</span>
          </button>
          <button onClick={() => setPlan("mensual")}
            className={"px-4 h-10 rounded-full text-[13px] font-bold transition " + (plan === "mensual" ? "bg-brand-gradient text-white shadow-glow" : "text-muted-foreground")}>
            Mensual
          </button>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {/* Camino ORIGEN */}
          <div className={"app-card p-6 relative " + (plan === "anual" ? "ring-2 ring-primary shadow-glow" : "")}>
            {plan === "anual" && (
              <span className="absolute -top-3 left-6 text-[10px] font-black uppercase tracking-widest bg-brand-gradient text-white px-3 py-1 rounded-full shadow-glow">
                Recomendado · 6 meses gratis
              </span>
            )}
            <div className="text-[11px] font-black uppercase tracking-widest text-primary">Camino ORIGEN</div>
            <h3 className="mt-1 font-display font-extrabold text-[22px]">Todo el método</h3>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="font-display font-black text-5xl tracking-tight">
                ${plan === "anual" ? "5.99" : "14.99"}
              </span>
              <span className="text-muted-foreground text-sm">USD / mes</span>
            </div>
            <div className="text-[12px] text-muted-foreground mt-1">
              {plan === "anual" ? "$71.88 al año · equivale a 6 meses gratis" : "Facturado mensual"}
            </div>

            <ul className="mt-5 space-y-2.5 text-[14px]">
              {[
                "Mentora Ruth Esther ilimitada",
                "Análisis de pareja y patrón familiar",
                "Las 8 etapas + audios 3-6-9",
                "Ejercicios diarios y diario íntimo",
                "Árbol completo · gemas · premios",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <StartButton className="mt-6 w-full h-14 rounded-full btn-primary-gradient font-bold text-[15px]">
              Empezar mis 7 días gratis
            </StartButton>
            <p className="text-[11px] text-center text-muted-foreground mt-2 font-semibold">
              Te avisamos antes del primer cobro
            </p>
          </div>

          {/* Explorador */}
          <div className="app-card p-6">
            <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Explorador</div>
            <h3 className="mt-1 font-display font-extrabold text-[22px]">Empieza sin pagar</h3>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="font-display font-black text-5xl tracking-tight">$0</span>
              <span className="text-muted-foreground text-sm">para siempre</span>
            </div>
            <div className="text-[12px] text-muted-foreground mt-1">Perfecto para probar el método</div>

            <ul className="mt-5 space-y-2.5 text-[14px]">
              {[
                "Diagnóstico completo",
                "1 mensaje al día con la mentora",
                "Etapa 1 completa",
                "Diario íntimo (5 entradas)",
                "1 ejercicio guiado",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-secondary text-primary grid place-items-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <StartButton className="mt-6 w-full h-14 rounded-full bg-secondary text-primary hover:bg-secondary/80 font-bold text-[15px]">
              Explorar gratis
            </StartButton>
            <p className="text-[11px] text-center text-muted-foreground mt-2 font-semibold flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Sin tarjeta
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── GUARANTEE ───────────────────────── */
function Guarantee() {
  return (
    <section className="px-4 sm:px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl app-card p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="w-16 h-16 rounded-2xl bg-brand-gradient text-white grid place-items-center shadow-glow shrink-0">
          <Shield className="w-7 h-7" />
        </div>
        <div>
          <h3 className="font-display font-extrabold text-[22px] leading-tight">Garantía honesta de 7 días</h3>
          <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
            Prueba todo el método 7 días. Si no sientes algo distinto adentro, cancelas en 1 clic. Sin llamadas, sin explicaciones.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FAQ ───────────────────────── */
const FAQS = [
  { q: "¿Ya probé terapia, libros y apps. Por qué esto sería distinto?", a: "Porque no te pide fuerza de voluntad. Te muestra el patrón que arrastras y te da un paso pequeño cada día. No es información. Es método." },
  { q: "¿No tengo tiempo. Cuánto me toma al día?", a: "5 minutos. Un ejercicio, un audio o un mensaje con la mentora. Está diseñado para caber en tu día, no para volverlo más pesado." },
  { q: "¿Me van a imponer religión?", a: "No. ORIGEN toma la sabiduría del libro de Ruth Esther, pero el método es humano, honesto y directo. Sin credo, sin dogma." },
  { q: "¿Cuánto cuesta después del trial?", a: "Anual: $71.88 USD ($5.99/mes, 6 meses gratis). Mensual: $14.99 USD. Cancelas cuando quieras desde la app." },
  { q: "¿Es seguro lo que escribo aquí?", a: "Sí. Todo lo que compartes es privado y solo tú lo ves. No lo compartimos con nadie." },
  { q: "¿Y si cancelo antes del cobro?", a: "No te cobramos. Te avisamos por correo antes del primer cargo para que decidas con tiempo." },
];
function FAQ() {
  return (
    <section className="px-4 sm:px-6 py-14 sm:py-20 bg-secondary/40">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h2 className="font-display font-extrabold text-[28px] sm:text-5xl tracking-tight leading-tight">
            Lo que se pregunta la gente.
          </h2>
        </div>
        <div className="mt-8 space-y-2">
          {FAQS.map((f, i) => <FaqItem key={i} {...f} />)}
        </div>
      </div>
    </section>
  );
}
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left p-4 sm:p-5 flex items-center gap-3">
        <span className="font-display font-bold text-[15px] flex-1">{q}</span>
        <ChevronDown className={"w-5 h-5 text-muted-foreground transition-transform " + (open ? "rotate-180" : "")} />
      </button>
      {open && <div className="px-4 sm:px-5 pb-5 text-[14px] text-muted-foreground leading-relaxed">{a}</div>}
    </div>
  );
}

/* ───────────────────────── FINAL CTA ───────────────────────── */
function FinalCTA() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl text-center relative">
        <div className="absolute inset-0 -z-10 bg-primary/10 blur-3xl rounded-full" />
        <h2 className="font-display font-extrabold text-[32px] sm:text-6xl tracking-tight leading-[1.05]">
          El patrón sigue ahí.
          <span className="block mt-3 text-transparent bg-clip-text bg-brand-gradient">
            ¿Lo entiendes hoy o en 5 años?
          </span>
        </h2>
        <div className="mt-8 flex justify-center">
          <StartButton size="lg" className="rounded-full h-14 px-8 btn-primary-gradient font-bold text-[15px]">
            Descubrir mi patrón gratis <ArrowRight className="ml-2 w-4 h-4" />
          </StartButton>
        </div>
        <p className="mt-4 text-[13px] text-muted-foreground max-w-lg mx-auto">
          <span className="font-bold text-foreground">P.D.</span> Lo que no entiendes hoy, lo repites mañana. Y se lo pasas a los que amas. Empieza hoy. 5 minutos. Gratis.
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────── FOOTER ───────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-border/40 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid sm:grid-cols-[1.2fr_1fr_1fr] gap-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-brand-gradient grid place-items-center shadow-glow">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="font-display font-extrabold">ORIGEN</div>
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground max-w-sm">
            Basado en el libro de Ruth Esther. Hecho para romper el patrón que arrastras.
          </p>
        </div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-primary">Legal</div>
          <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
            <li><a href="/terminos" className="hover:text-foreground">Términos</a></li>
            <li><a href="/privacidad" className="hover:text-foreground">Privacidad</a></li>
            <li><a href="/reembolsos" className="hover:text-foreground">Reembolsos</a></li>
            <li><a href="/disclaimer-ia" className="hover:text-foreground">Uso de IA</a></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-primary">Soporte</div>
          <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
            <li><a href="mailto:infodenegociorm@gmail.com" className="hover:text-foreground">infodenegociorm@gmail.com</a></li>
            <li><Link to="/auth" className="hover:text-foreground">Iniciar sesión</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-[11px] text-muted-foreground pb-8">
        © {new Date().getFullYear()} ORIGEN · Todos los derechos reservados
      </div>
    </footer>
  );
}
