import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, CalendarDays, Hash, MessageSquareText, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const RANGES = [
  { id: 1, label: "Hoy" }, { id: 7, label: "7 días" }, { id: 30, label: "30 días" }, { id: 90, label: "3 meses" }, { id: 365, label: "Año" },
] as const;
type Row = { kind: string; title: string | null; scope_ref: string | null; question: string; keywords: string[]; created_at: string };

/** Panel del Asistente ORÍGEN: cuántas consultas, cuándo y qué se pregunta más. */
export function AssistantDashboard() {
  const [days, setDays] = useState<number>(7);
  const since = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (days - 1)); return d.toISOString(); }, [days]);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["assistant-events", days], refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.from("assistant_events").select("kind,title,scope_ref,question,keywords,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const stats = useMemo(() => {
    const byConsulta = new Map<string, number>(), byDay = new Map<string, number>(), byHour = Array(24).fill(0) as number[], words = new Map<string, number>(), qs = new Map<string, number>();
    for (const r of rows) {
      const name = r.title || r.kind;
      byConsulta.set(name, (byConsulta.get(name) ?? 0) + 1);
      const d = new Date(r.created_at);
      const k = d.toLocaleDateString("es", { day: "numeric", month: "short" });
      byDay.set(k, (byDay.get(k) ?? 0) + 1);
      byHour[d.getHours()]++;
      r.keywords.forEach(w => words.set(w, (words.get(w) ?? 0) + 1));
      const q = r.question.trim().toLowerCase();
      if (q) qs.set(q, (qs.get(q) ?? 0) + 1);
    }
    const sort = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
    return { byConsulta: sort(byConsulta), byDay: [...byDay.entries()].reverse(), byHour, words: sort(words).slice(0, 15), qs: sort(qs).slice(0, 10) };
  }, [rows]);
  const maxDay = Math.max(1, ...stats.byDay.map(d => d[1])), maxHour = Math.max(1, ...stats.byHour);
  const peak = stats.byHour.indexOf(Math.max(...stats.byHour));

  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-primary"><Bot className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-[18px] font-bold">Asistente ORÍGEN</h2>
            <p className="text-[13px] text-muted-foreground">Responde todas las consultas 24/7 sin gastar créditos de IA. Usa el método ORÍGEN y el Cerebro ORÍGEN.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {RANGES.map(r => <button key={r.id} onClick={() => setDays(r.id)} className={cn("min-h-9 rounded-[10px] px-3 text-[13px] font-semibold", days === r.id ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>{r.label}</button>)}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[["Consultas", rows.length, MessageSquareText], ["Por día", Math.round(rows.length / days), CalendarDays], ["Hora pico", rows.length ? `${peak}:00` : "—", TrendingUp]].map(([l, v, I]) => { const Icon = I as typeof Bot; return (
            <div key={String(l)} className="rounded-[12px] bg-muted/40 p-3"><Icon className="h-4 w-4 text-primary" /><p className="mt-1 font-display text-[22px] font-bold">{String(v)}</p><p className="text-[12px] text-muted-foreground">{String(l)}</p></div>); })}
        </div>
      </div>

      {isLoading ? <div className="h-40 animate-pulse rounded-[16px] bg-muted" /> : rows.length === 0 ? (
        <p className="rounded-[16px] border border-border bg-card p-5 text-[14px] text-muted-foreground">En este periodo nadie ha hecho consultas todavía. Apenas alguien pregunte, verás aquí los números.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Box title="Consultas por sección">{stats.byConsulta.map(([n, c]) => <Bar key={n} label={n} value={c} max={stats.byConsulta[0][1]} />)}</Box>
          <Box title="Consultas por día">{stats.byDay.slice(-14).map(([n, c]) => <Bar key={n} label={n} value={c} max={maxDay} />)}</Box>
          <Box title="Por hora del día">
            <div className="flex h-28 items-end gap-[2px]">{stats.byHour.map((c, h) => <div key={h} title={`${h}:00 — ${c}`} className="flex-1 rounded-t bg-primary/70" style={{ height: `${(c / maxHour) * 100}%`, minHeight: 2 }} />)}</div>
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>0h</span><span>12h</span><span>23h</span></div>
          </Box>
          <Box title="Palabras más buscadas"><div className="flex flex-wrap gap-2">{stats.words.map(([w, c]) => <span key={w} className="inline-flex items-center gap-1 rounded-[10px] bg-primary/10 px-2.5 py-1 text-[13px] font-semibold text-primary"><Hash className="h-3 w-3" />{w} · {c}</span>)}</div></Box>
          <Box title="Preguntas más repetidas" className="md:col-span-2">{stats.qs.map(([q, c]) => <p key={q} className="flex justify-between gap-3 border-b border-border py-2 text-[14px] last:border-0"><span className="line-clamp-2">{q}</span><b className="shrink-0 text-primary">{c}</b></p>)}</Box>
        </div>
      )}
    </div>
  );
}

function Box({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-[16px] border border-border bg-card p-4", className)}><h3 className="mb-3 font-semibold">{title}</h3><div className="space-y-2">{children}</div></section>;
}
function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return <div><div className="flex justify-between text-[13px]"><span className="truncate">{label}</span><b>{value}</b></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(value / max) * 100}%` }} /></div></div>;
}
