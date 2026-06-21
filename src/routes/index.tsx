import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { Sparkles, Compass, BookOpen, MessageCircle, Shield, Users, Heart, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reconectando el Espíritu con Dios — Restauración espiritual y sanidad" },
      { name: "description", content: "Plataforma cristiana moderna basada en el libro de Ruth Esther Paredes Sufran. Diagnóstico espiritual, IA pastoral, programa de 8 etapas y comunidad." },
      { property: "og:title", content: "Reconectando el Espíritu con Dios" },
      { property: "og:description", content: "Acompañamiento espiritual, sanidad emocional y propósito con la guianza del Espíritu Santo." },
      { property: "og:image", content: heroImg },
      { name: "twitter:image", content: heroImg },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary-foreground">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-gold text-gold-foreground font-display text-lg">R</span>
            <span className="font-display text-lg text-white">Reconectando</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <a href="#programa" className="hover:text-white">Programa</a>
            <a href="#caracteristicas" className="hover:text-white">Plataforma</a>
            <a href="#planes" className="hover:text-white">Planes</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" className="text-white hover:bg-white/10">Iniciar sesión</Button></Link>
            <Link to="/auth"><Button className="bg-gold text-gold-foreground hover:bg-gold/90">Empezar</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="Persona en oración al amanecer en la cima de una montaña con luz divina" width={1920} height={1280} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/60 to-background" />
        </div>
        <div className="mx-auto max-w-5xl px-6 pt-40 pb-32 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 backdrop-blur px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
            <Sparkles className="w-3.5 h-3.5" /> Caminando por fe
          </span>
          <h1 className="mt-6 font-display text-5xl md:text-7xl text-white leading-[1.05]">
            Reconectando el<br />
            <span className="text-gold">Espíritu con Dios</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Una plataforma de restauración espiritual, sanidad interior y propósito con la guianza del Espíritu Santo.
            Inspirada en el libro de Ruth Esther Paredes Sufran.
          </p>
          <p className="mt-4 scripture text-gold/90 text-base">
            "Antes que te formase en el vientre te conocí." — Jeremías 1:5
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 px-8 h-12 shadow-glow">
                Comienza tu camino <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <a href="#programa">
              <Button size="lg" variant="outline" className="h-12 px-8 border-white/40 text-white hover:bg-white/10 bg-transparent">
                Ver el programa
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="caracteristicas" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-4xl text-foreground">Un espacio seguro para tu espíritu</h2>
            <p className="mt-4 text-muted-foreground">Diseñado para acompañarte paso a paso, sin importar dónde estés en tu caminar.</p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              { icon: MessageCircle, title: "Consultor IA con empatía", desc: "Un asistente espiritual que escucha sin juzgar, valida tu emoción y te guía con palabra bíblica y oración." },
              { icon: Compass, title: "Diagnóstico espiritual", desc: "Evaluación inicial completa con plan personalizado para tu sanidad emocional y crecimiento." },
              { icon: BookOpen, title: "Programa de 8 etapas", desc: "De reconocer patrones a vivir transformado. Cada etapa con reflexión, oración, ejercicios y seguimiento." },
              { icon: Heart, title: "Diario espiritual privado", desc: "Oraciones, gratitud, reflexiones, testimonios y metas. Solo tú y Dios." },
              { icon: Shield, title: "Biblioteca y ejercicios", desc: "Perdón, sanidad, identidad, fe, restauración familiar, control de pensamientos y más." },
              { icon: Users, title: "Comunidad y soporte", desc: "Acceso a Telegram privado y soporte personal por WhatsApp en planes Básico, Avanzado y Anual." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl bg-card-gradient border border-border p-7 shadow-soft hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/5 grid place-items-center text-primary group-hover:bg-gold/15 group-hover:text-gold transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-5 font-display text-xl text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programa */}
      <section id="programa" className="py-24 px-6 bg-secondary/40">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.25em] text-gold">El programa</span>
            <h2 className="mt-3 font-display text-4xl text-foreground">8 etapas hacia la transformación</h2>
            <p className="mt-4 text-muted-foreground">Un viaje espiritual estructurado para sanar el linaje, renovar tu identidad y descubrir tu propósito.</p>
          </div>
          <div className="mt-14 grid md:grid-cols-2 gap-4">
            {[
              ["1", "Reconociendo el origen de los patrones", "Genealogía espiritual y patrones generacionales."],
              ["2", "Sanidad emocional", "Heridas maternales y paternales. El Alfarero."],
              ["3", "Reconexión con Dios", "Conectar con el Espíritu Santo y la fe."],
              ["4", "Renovación de identidad", "Nueva criatura en Cristo."],
              ["5", "Fortalecimiento espiritual", "Disciplinas y crecimiento."],
              ["6", "Restauración familiar", "Sé sacerdote/sacerdotisa de tu casa."],
              ["7", "Propósito y llamado", "Dirección del Espíritu Santo."],
              ["8", "Vida transformada", "Caminando por fe."],
            ].map(([n, t, d]) => (
              <div key={n} className="flex gap-5 rounded-xl bg-card border border-border p-6">
                <div className="shrink-0 w-12 h-12 rounded-full bg-divine grid place-items-center text-white font-display text-lg shadow-soft">{n}</div>
                <div>
                  <h3 className="font-display text-lg text-foreground">{t}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-4xl text-foreground">Planes pensados para acompañarte</h2>
            <p className="mt-4 text-muted-foreground">Empieza gratis. Crece a tu ritmo.</p>
          </div>
          <div className="mt-14 grid md:grid-cols-4 gap-5">
            {[
              { name: "Inicial", price: "$1", per: "/ mes", features: ["Acceso limitado", "10 consultas IA / mes", "Primer módulo"] },
              { name: "Básico", price: "$9.99", per: "/ mes", features: ["Consultas IA ilimitadas", "Telegram privado", "Soporte WhatsApp", "Biblioteca completa"], highlight: false },
              { name: "Avanzado", price: "$15.99", per: "/ mes", features: ["Todo lo del Básico", "Cursos premium", "Herramientas avanzadas", "Recursos exclusivos"], highlight: true },
              { name: "Anual", price: "$85", per: "/ año", features: ["Acceso total", "Soporte prioritario", "Acceso anticipado", "Todos los bonos"] },
            ].map((p) => (
              <div key={p.name} className={`relative rounded-2xl p-7 border ${p.highlight ? "bg-divine border-gold text-white shadow-glow" : "bg-card border-border shadow-soft"}`}>
                {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest bg-gold text-gold-foreground px-3 py-1 rounded-full">Más popular</span>}
                <h3 className="font-display text-xl">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl">{p.price}</span>
                  <span className={p.highlight ? "text-white/70 text-sm" : "text-muted-foreground text-sm"}>{p.per}</span>
                </div>
                <ul className={`mt-6 space-y-2 text-sm ${p.highlight ? "text-white/85" : "text-muted-foreground"}`}>
                  {p.features.map(f => <li key={f} className="flex gap-2"><span className="text-gold">✦</span>{f}</li>)}
                </ul>
                <Link to="/auth" className="block mt-7">
                  <Button className={`w-full ${p.highlight ? "bg-gold text-gold-foreground hover:bg-gold/90" : ""}`} variant={p.highlight ? "default" : "outline"}>Empezar</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-divine p-12 text-center text-white shadow-glow">
          <h2 className="font-display text-4xl">El patrón se rompe contigo</h2>
          <p className="mt-4 text-white/80">No estás aquí por casualidad sino por propósito divino. Da el primer paso hoy.</p>
          <Link to="/auth"><Button size="lg" className="mt-8 bg-gold text-gold-foreground hover:bg-gold/90 px-8 h-12">Crear mi cuenta gratis</Button></Link>
        </div>
      </section>

      <footer className="py-10 px-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>© 2026 Ministerio Profético Internacional Caminando Por Fe — Ruth Esther Paredes Sufran</p>
        <p className="mt-1 text-xs">Esta herramienta no reemplaza ayuda psicológica, psiquiátrica o médica profesional.</p>
      </footer>
    </div>
  );
}
