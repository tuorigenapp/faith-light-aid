import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import heroImg from "@/assets/spiritual-hero.jpg";
import dailyImg from "@/assets/daily-devotional.jpg";
import stageImg from "@/assets/stage-journey.jpg";
import exerciseImg from "@/assets/prayer-exercise.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, HeartHandshake, MessageCircle, Play, Shield, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reconectando el Espíritu con Dios — App cristiana" },
      { name: "description", content: "App cristiana motivacional con diagnóstico espiritual, etapas personalizadas, ejercicios diarios, consultor IA, diario, calendario y acompañamiento." },
      { property: "og:title", content: "Reconectando el Espíritu con Dios — App cristiana" },
      { property: "og:description", content: "App cristiana motivacional con diagnóstico espiritual, etapas personalizadas, ejercicios diarios, consultor IA, diario, calendario y acompañamiento." },
      { property: "og:image", content: heroImg },
      { name: "twitter:image", content: heroImg },
    ],
  }),
  component: Landing,
});

const MOTIVATORS = [
  { icon: CalendarDays, title: "Frase y palabra diaria", text: "Un impulso cristiano nuevo cada día para abrir la app con propósito." },
  { icon: CheckCircle2, title: "Progreso guardado", text: "Etapas y ejercicios quedan marcados con check verde al completarlos." },
  { icon: MessageCircle, title: "Consultor espiritual IA", text: "Acompañamiento empático, bíblico y práctico cuando el usuario necesita hablar." },
  { icon: HeartHandshake, title: "Soporte WhatsApp", text: "Acceso directo a acompañamiento humano desde la experiencia móvil." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-40 bg-background/55 backdrop-blur-2xl border-b border-border/70">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/app-icon.png" alt="Reconectando" width={38} height={38} className="rounded-2xl shadow-soft" />
            <div className="leading-none">
              <div className="font-display font-bold text-base">Reconectando</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-bold">Espíritu con Dios</div>
            </div>
          </Link>
          <Link to="/auth"><Button className="rounded-full bg-primary px-5">Entrar</Button></Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pt-24 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl grid lg:grid-cols-[1fr_0.82fr] gap-8 items-center min-h-[calc(100vh-5rem)] pb-12">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-card/80 border border-border px-3 py-1.5 text-xs font-bold text-primary shadow-soft">
                <Sparkles className="w-3.5 h-3.5" /> Tu app diaria de restauración espiritual
              </div>
              <h1 className="mt-6 font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[0.98]">
                Reconectando el Espíritu con Dios
              </h1>
              <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Una experiencia cristiana moderna, viva y motivacional: diagnóstico, etapas personalizadas, ejercicios diarios, calendario espiritual, diario privado y acompañamiento cuando más lo necesitas.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/auth">
                  <Button size="lg" className="rounded-full h-13 px-7 bg-primary shadow-glow">
                    Crear mi cuenta <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <a href="#experiencia">
                  <Button size="lg" variant="outline" className="rounded-full h-13 px-7 bg-card/70">
                    <Play className="mr-2 w-4 h-4" /> Ver experiencia
                  </Button>
                </a>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
                <MiniStat value="8" label="etapas" />
                <MiniStat value="Diario" label="frases" />
                <MiniStat value="24/7" label="guía IA" />
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[360px] lg:max-w-[430px]">
              <div className="absolute -inset-5 rounded-[3rem] bg-app-coral opacity-20 blur-3xl" />
              <div className="relative rounded-[2.6rem] border-[10px] border-foreground bg-card shadow-glow overflow-hidden aspect-[9/18]">
                <img src={heroImg} alt="Biblia abierta con luz de la mañana" width={1280} height={1600} className="h-[43%] w-full object-cover" />
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground font-bold">Hoy</div>
                      <div className="font-display font-bold text-xl">Palabra: Paz</div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-primary grid place-items-center text-primary-foreground"><CalendarDays className="w-5 h-5" /></div>
                  </div>
                  <div className="rounded-3xl bg-secondary/70 p-4">
                    <p className="scripture text-base leading-snug">“La paz no siempre cambia la situación; primero cambia tu interior.”</p>
                    <p className="mt-2 text-xs text-muted-foreground">Juan 14:27</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <PhoneTile icon={<BookOpen className="w-4 h-4" />} label="Diagnóstico" />
                    <PhoneTile icon={<CheckCircle2 className="w-4 h-4" />} label="Progreso" />
                    <PhoneTile icon={<MessageCircle className="w-4 h-4" />} label="Chat IA" />
                    <PhoneTile icon={<Shield className="w-4 h-4" />} label="Diario" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="experiencia" className="px-4 sm:px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid md:grid-cols-4 gap-4">
              {MOTIVATORS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="app-card p-5 hover:-translate-y-1 transition-transform">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary grid place-items-center"><Icon className="w-5 h-5" /></div>
                  <h2 className="mt-4 font-display font-bold text-lg">{title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12">
          <div className="mx-auto max-w-6xl grid lg:grid-cols-3 gap-4">
            <VisualCard image={dailyImg} title="Calendario espiritual" text="Frases, palabra del día, retos y registro diario para crear hábito." />
            <VisualCard image={stageImg} title="Ruta personalizada" text="Las etapas se desbloquean según el diagnóstico y avance real del usuario." />
            <VisualCard image={exerciseImg} title="Ejercicios con temporizador" text="Prácticas guiadas por día, historial y check de completado." />
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="mx-auto max-w-4xl rounded-[2rem] bg-divine p-8 sm:p-12 text-center text-primary-foreground shadow-glow">
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl">Que tus usuarios quieran volver cada día</h2>
            <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">Un espacio seguro, bello y espiritual donde cada check verde, cada frase y cada oración cuenta una historia de avance.</p>
            <Link to="/auth"><Button size="lg" className="mt-8 rounded-full bg-gold text-gold-foreground hover:bg-gold/90 px-8">Comenzar ahora</Button></Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-3xl bg-card/80 border border-border p-4 text-center shadow-soft"><div className="font-display font-extrabold text-2xl text-primary">{value}</div><div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">{label}</div></div>;
}

function PhoneTile({ icon, label }: { icon: ReactNode; label: string }) {
  return <div className="rounded-2xl bg-muted p-3 flex items-center gap-2 text-xs font-bold"> <span className="text-primary">{icon}</span>{label}</div>;
}

function VisualCard({ image, title, text }: { image: string; title: string; text: string }) {
  return (
    <div className="app-card overflow-hidden">
      <img src={image} alt={title} width={1024} height={1024} loading="lazy" className="h-56 w-full object-cover" />
      <div className="p-6">
        <h2 className="font-display font-bold text-2xl">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
}