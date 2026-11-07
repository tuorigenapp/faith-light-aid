import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Lock, ChevronRight } from "lucide-react";
import { MOMENTOS, isOpen, readDone, type MomentoId } from "@/lib/oraciones-dia";

export function OracionesDelDia() {
  const [now, setNow] = useState<Date | null>(null);
  const [done, setDone] = useState<MomentoId[]>([]);
  useEffect(() => { const d = new Date(); setNow(d); setDone(readDone(d)); }, []);

  if (!now) return <div className="h-64 animate-pulse rounded-[16px] bg-secondary" />;
  const total = MOMENTOS.length;
  const count = done.length;

  return (
    <section className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-2xl">🙏</span>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Oraciones del día</p>
          <p className="text-[13px] text-muted-foreground">{count} de {total} completadas hoy</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-cta-green transition-all duration-500" style={{ width: `${(count / total) * 100}%` }} />
      </div>
      <ul className="mt-4 space-y-2">
        {MOMENTOS.map((m) => {
          const open = isOpen(m, now);
          const ok = done.includes(m.id);
          const inner = (
            <>
              <span className="text-2xl" aria-hidden>{m.emoji}</span>
              <span className="flex-1 text-[15px] font-semibold">{m.label}</span>
              {ok ? (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-cta-green/15 text-cta-green"><Check className="h-4 w-4" /></span>
              ) : open ? (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              ) : (
                <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><Lock className="h-3.5 w-3.5" /> {String(m.fromHour).padStart(2, "0")}:00</span>
              )}
            </>
          );
          return (
            <li key={m.id}>
              {open ? (
                <Link to="/palabra/$momento" params={{ momento: m.id }} className="flex min-h-14 items-center gap-3 rounded-[12px] bg-secondary/60 px-3 active:scale-[.98] transition-transform">{inner}</Link>
              ) : (
                <div className="flex min-h-14 items-center gap-3 rounded-[12px] bg-secondary/30 px-3 opacity-70">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
