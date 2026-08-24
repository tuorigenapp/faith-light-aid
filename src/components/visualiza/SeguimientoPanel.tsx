import { CalendarDays, CheckCircle2, Flame, Trophy, Compass, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { SeguimientoSkeleton } from "./SeguimientoSkeleton";

type Props = {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  totalDone: number;
  streak: number;
  progressPct: number;
  selectedCatTitle: string | null;
  hasAnyProgress: boolean;
};

export function SeguimientoPanel({
  loading,
  error,
  onRetry,
  totalDone,
  streak,
  progressPct,
  selectedCatTitle,
  hasAnyProgress,
}: Props) {
  if (loading) return <SeguimientoSkeleton />;

  if (error) {
    return (
      <div className="app-card p-6 shadow-soft text-center">
        <p className="text-sm text-muted-foreground">
          No pudimos cargar tu progreso ahora mismo. Puede ser algo temporal.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 h-11 text-sm font-bold active:scale-[.97] transition"
        >
          <RotateCcw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    );
  }

  if (!hasAnyProgress) {
    return (
      <div className="app-card p-6 shadow-soft text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-brand-soft grid place-items-center">
          <Compass className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-display font-extrabold text-lg mt-3">Aún no has comenzado</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Elige un programa abajo y tu progreso, racha y logros aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div
      className="app-card p-5 md:p-6 shadow-soft"
      style={{ animation: "fade-in .4s ease-out both" }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display font-extrabold text-lg">Tu seguimiento</h2>
        <div className="flex items-center gap-2 rounded-full bg-gold/15 text-gold px-3 py-1.5 text-xs font-bold">
          <Flame className="w-4 h-4" /> Racha de {streak} {streak === 1 ? "día" : "días"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat Icon={Compass} label="Programa actual" value={selectedCatTitle ?? "—"} />
        <Stat Icon={CalendarDays} label="Día actual" value={String(Math.max(1, totalDone + 1))} accent="text-primary" />
        <Stat Icon={CheckCircle2} label="Días completados" value={String(totalDone)} accent="text-accent-green" />
        <Stat Icon={Trophy} label="Tiempo invertido" value={`${totalDone * 10} min`} accent="text-gold" />
      </div>

      <div className="mt-4 rounded-2xl bg-brand-soft p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground/80">Nivel de progreso</span>
          <span className="font-display font-extrabold text-base">{progressPct}%</span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent-pink transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  Icon,
  label,
  value,
  accent,
}: {
  Icon: typeof Compass;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-3">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className={cn("mt-1.5 font-display font-extrabold text-lg truncate", accent)}>{value}</div>
    </div>
  );
}
