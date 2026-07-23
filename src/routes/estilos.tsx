import { createFileRoute } from "@tanstack/react-router";
import { Flame, Check, ChevronRight, Home, TreeDeciduous, Headphones, Trophy, User, Sparkles, Play, Gem } from "lucide-react";

export const Route = createFileRoute("/estilos")({
  head: () => ({
    meta: [
      { title: "Vista previa de estilo — ORIGEN" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EstilosPreview,
});

function EstilosPreview() {
  return (
    <div className="min-h-dvh bg-aura-top py-10 px-4 flex items-start justify-center">
      <div className="w-full max-w-md">
        <p className="text-center text-sm text-muted-foreground mb-4">
          Vista previa · HOME · 375px · Dirección <b>ORIGEN</b>
        </p>
        <PhoneFrame />
      </div>
    </div>
  );
}

function PhoneFrame() {
  return (
    <div className="mx-auto w-[375px] rounded-[40px] border-[10px] border-white shadow-modal overflow-hidden bg-white">
      <div className="relative bg-aura-top min-h-[780px] flex flex-col">
        {/* Header */}
        <header className="pt-10 px-5 pb-4 relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-brand-gradient shadow-glow shrink-0 grid place-items-center text-white font-display font-bold">
                R
              </div>
              <div className="min-w-0">
                <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Jueves 23 jul
                </p>
                <h1 className="font-display text-[22px] leading-tight font-bold truncate">
                  Hola, Ruth
                </h1>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 rounded-full pl-2.5 pr-3 h-9 bg-white border border-border shadow-soft">
              <Gem className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">1,240</span>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="px-5 relative z-10">
          <div className="hero-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-widest font-bold text-primary">
                Tu misión de hoy
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-primary">
                8 min
              </span>
            </div>
            <h2 className="font-display text-[22px] leading-tight font-bold mb-1">
              Etapa 2 · Sanar la herida de abandono
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Un ejercicio guiado para reconocer el patrón y darle un nombre.
            </p>
            <button className="btn-primary-gradient w-full h-[56px] rounded-[14px] flex items-center justify-center gap-2 text-[15px]">
              <Play className="w-4 h-4 fill-current" />
              Empezar ahora
            </button>
          </div>
        </section>

        {/* Streak */}
        <section className="px-5 mt-4 relative z-10">
          <div className="app-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#F58BCB]/12 grid place-items-center shrink-0">
                <Flame className="w-5 h-5 text-[#F58BCB]" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold leading-tight">Racha: 5 días</p>
                <p className="text-[12px] text-[#F58BCB] font-semibold">en riesgo hoy</p>
              </div>
            </div>
            <div className="flex gap-1.5 items-center shrink-0">
              {[1,1,1,1,1,2,0].map((s, i) => (
                <span
                  key={i}
                  className={
                    "w-2 h-2 rounded-full " +
                    (s === 1 ? "bg-primary" : s === 2 ? "bg-[#F58BCB] animate-breathe" : "bg-border")
                  }
                />
              ))}
            </div>
          </div>
        </section>

        {/* Section title */}
        <section className="px-5 mt-6 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-[15px] font-bold">Continúa donde lo dejaste</h3>
            <a className="text-xs font-semibold text-primary">Ver todo</a>
          </div>
          <div className="hairline-brand mb-3" />

          <div className="space-y-2.5">
            {/* Completed */}
            <div className="app-card p-3.5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-success/12 grid place-items-center shrink-0">
                <Sparkles className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold leading-tight truncate">
                  Respiración 4-7-8
                </p>
                <p className="text-[12px] text-muted-foreground">Ayer · 5 min</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-success grid place-items-center shrink-0">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </div>

            {/* Pending */}
            <div className="app-card p-3.5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-secondary grid place-items-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold leading-tight truncate">
                  Nombrar el vacío
                </p>
                <p className="text-[12px] text-muted-foreground">Hoy · 6 min</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
          </div>
        </section>

        <div className="flex-1" />

        {/* Bottom nav */}
        <nav
          className="sticky bottom-0 mt-6 bg-white/90 backdrop-blur-md border-t border-border pt-2 relative z-10"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
        >
          <div className="grid grid-cols-5 h-[56px]">
            {[
              { icon: Home, label: "Inicio", active: true },
              { icon: TreeDeciduous, label: "Árbol" },
              { icon: Headphones, label: "Vívelo" },
              { icon: Trophy, label: "Premios" },
              { icon: User, label: "Perfil" },
            ].map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                className="flex flex-col items-center justify-center gap-0.5"
              >
                <Icon className={"w-[22px] h-[22px] " + (active ? "text-primary" : "text-muted-foreground")} />
                <span className={"text-[10px] font-semibold " + (active ? "text-primary" : "text-muted-foreground")}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
