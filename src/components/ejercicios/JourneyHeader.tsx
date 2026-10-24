import {
  Flag,
  Trophy,
  ShieldCheck,
  Crown,
  Gem,
  Flame,
  Lock,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Milestone = {
  days: number;
  title: string;
  note: string;
  Icon: typeof Flag;
};

const MILESTONES: Milestone[] = [
  { days: 7, title: "Explorador del origen", note: "Tus primeros 7 días de verdad.", Icon: Flag },
  {
    days: 30,
    title: "Constructor de hábitos",
    note: "Estás creando tu mejor versión.",
    Icon: Trophy,
  },
  {
    days: 90,
    title: "Guardián de tu paz",
    note: "Cuidas lo que entra y lo que sale.",
    Icon: ShieldCheck,
  },
  {
    days: 180,
    title: "Maestro de la constancia",
    note: "Tus hábitos te llevan lejos.",
    Icon: Crown,
  },
  { days: 365, title: "Dueño de mi historia", note: "Un año sin perderte el rastro.", Icon: Gem },
];

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function JourneyHeader({
  name,
  streak,
  completedCount,
  weekDone,
}: {
  name: string;
  streak: number;
  completedCount: number;
  weekDone: Set<string>;
}) {
  const next = MILESTONES.find((m) => streak < m.days) ?? MILESTONES[MILESTONES.length - 1]!;
  const missing = Math.max(0, next.days - streak);
  const nextPct = Math.min(100, Math.round((streak / next.days) * 100));

  const today = new Date();
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return { d, iso: d.toISOString().slice(0, 10) };
  });
  const weekCount = week.filter((w) => weekDone.has(w.iso)).length;

  return (
    <section className="relative">
      {/* Encabezado */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h1 className="font-display font-extrabold text-[28px] leading-[1.12] text-primary-foreground">
            Tu viaje de sanación
          </h1>
          <p className="mt-1 text-[14px] leading-snug text-primary-foreground/72">
            Pequeñas decisiones, grandes cambios.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-gold/50 bg-gold/10 px-3 py-1.5 font-display text-[12.5px] font-bold text-gold">
          {name}
        </span>
      </div>

      {/* Racha */}
      <div className="mt-4 rounded-[16px] border border-primary-foreground/12 bg-primary-foreground/[.06] p-4 backdrop-blur-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-gold/70 bg-gold/12 text-gold">
              <Flame className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-medium text-primary-foreground/70">
                Racha actual
              </span>
              <span className="block whitespace-nowrap font-display text-[22px] font-extrabold leading-tight text-primary-foreground">
                {streak}<span className="ml-1 text-[15px]">{streak === 1 ? "día" : "días"}</span>
              </span>
            </span>
          </div>
          <div className="shrink-0 border-l border-primary-foreground/12 pl-4 text-right">
            <p className="text-[12px] text-primary-foreground/65">+{missing} días para</p>
            <p className="font-display text-[13.5px] font-bold leading-tight text-gold">
              {next.title}
            </p>
            <span className="mt-1.5 inline-grid h-9 w-9 place-items-center rounded-[10px] border border-gold/50 bg-gold/10 text-gold">
              <next.Icon className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="h-2.5 overflow-hidden rounded-full bg-primary-foreground/12">
            <div
              className="h-full rounded-full bg-brand-gradient transition-all duration-700"
              style={{ width: `${nextPct}%` }}
            />
          </div>
          <span className="text-[12.5px] font-bold text-primary-foreground/80">
            {streak} / {next.days} días
          </span>
        </div>
      </div>

      {/* Mapa de logros: camino + tarjetas */}
      <div className="mt-5 grid grid-cols-[86px_minmax(0,1fr)] gap-3">
        <div className="relative rounded-[16px] border border-primary-foreground/10 bg-primary-foreground/[.04] py-3">
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 top-6"
            style={{
              background: "linear-gradient(0deg, var(--sanctuary-border), transparent 78%)",
              clipPath: "polygon(48% 100%, 6% 0%, 94% 0%)",
            }}
          />
          <ol className="relative flex h-full flex-col-reverse items-center justify-between gap-3">
            {MILESTONES.map((m, i) => {
              const reached = streak >= m.days;
              const isNext = m.days === next.days;
              const offset = [0, 6, 14, 6, 0][i] ?? 0;
              return (
                <li
                  key={m.days}
                  className="flex w-full flex-col items-center"
                  style={{
                    transform: `translateX(${offset}px)`,
                    animation: `fade-in .45s ease-out ${i * 60}ms both`,
                  }}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full border-2",
                      reached
                        ? "border-gold bg-gold/20 text-gold"
                        : isNext
                          ? "border-gold bg-gold/20 text-primary-foreground"
                          : "border-primary-foreground/18 bg-primary-foreground/[.06] text-primary-foreground/45",
                    )}
                  >
                    <m.Icon className="h-4 w-4" />
                  </span>
                  <span
                    className={cn(
                      "mt-1 rounded-full px-2 py-[3px] text-[10px] font-bold",
                      isNext
                        ? "bg-primary/25 text-primary-foreground"
                        : "bg-primary-foreground/8 text-primary-foreground/60",
                    )}
                  >
                    {m.days} días
                  </span>
                  {isNext && (
                    <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-gold">
                      Estás aquí
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <ul className="flex flex-col gap-2.5">
          {[...MILESTONES].reverse().map((m, i) => {
            const reached = streak >= m.days;
            const isNext = m.days === next.days;
            return (
              <li
                key={m.days}
                className={cn(
                  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] border p-3",
                  isNext
                    ? "border-gold/60 bg-gold/[.08]"
                    : "border-primary-foreground/10 bg-primary-foreground/[.05]",
                )}
                style={{ animation: `fade-in .45s ease-out ${i * 60}ms both` }}
              >
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border",
                    reached || isNext
                      ? "border-gold/55 bg-gold/12 text-gold"
                      : "border-primary-foreground/15 bg-primary-foreground/[.06] text-primary-foreground/50",
                  )}
                >
                  <m.Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block font-display text-[15px] font-bold leading-tight",
                      isNext ? "text-gold" : "text-primary-foreground",
                    )}
                  >
                    {m.title}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-primary-foreground/62">
                    {isNext ? `${streak} / ${m.days} días` : m.note}
                  </span>
                </span>
                {!reached && !isNext && (
                  <Lock className="h-4 w-4 shrink-0 text-primary-foreground/35" />
                )}
                {reached && <span className="text-[11px] font-bold text-gold">Logrado</span>}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Próximo desbloqueo */}
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] border border-primary-foreground/12 bg-primary-foreground/[.06] p-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-gold/60 bg-gold/10 text-gold">
            <next.Icon className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block text-[12px] text-primary-foreground/65">Próximo desbloqueo</span>
            <span className="block font-display text-[19px] font-extrabold leading-tight text-gold">
              {next.title}
            </span>
            <span className="mt-1.5 block h-2 w-[120px] overflow-hidden rounded-full bg-primary-foreground/12">
              <span
                className="block h-full rounded-full bg-brand-gradient"
                style={{ width: `${nextPct}%` }}
              />
            </span>
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[12.5px] leading-snug text-primary-foreground/70">
            +{missing} días para
            <br /> desbloquear
          </p>
          <ChevronRight className="ml-auto mt-1 h-5 w-5 text-primary-foreground/45" />
        </div>
      </div>

      {/* Esta semana */}
      <div className="mt-3 rounded-[16px] border border-primary-foreground/12 bg-primary-foreground/[.06] p-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/50 bg-gold/10 text-gold">
            <CalendarDays className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[17px] font-extrabold leading-tight text-primary-foreground">
              Esta semana
            </span>
            <span className="block text-[12px] text-primary-foreground/62">
              {completedCount} prácticas completadas en total
            </span>
          </span>
          <span className="text-[12.5px] font-bold text-primary-foreground/80">
            {weekCount} / 7 días
          </span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {week.map(({ d, iso }) => {
            const done = weekDone.has(iso);
            return (
              <div key={iso} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "grid h-9 w-full place-items-center rounded-[10px] border text-[11px] font-bold",
                    done
                      ? "border-gold/60 bg-gold/18 text-gold"
                      : "border-primary-foreground/12 bg-primary-foreground/[.05] text-primary-foreground/45",
                  )}
                >
                  {d.getDate()}
                </span>
                <span className="text-[9.5px] text-primary-foreground/50">
                  {fmtDate(d).split(" ")[1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
