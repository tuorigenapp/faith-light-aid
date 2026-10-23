import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, Clock, Gauge, Mail, Pencil, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Kind = "ai" | "email";
type Range = "hoy" | "ayer" | "7" | "15" | "30" | "custom";
const RANGES: { id: Range; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "ayer", label: "Ayer" },
  { id: "7", label: "7 días" },
  { id: "15", label: "15 días" },
  { id: "30", label: "30 días" },
  { id: "custom", label: "Personalizado" },
];

type AiCredits = { remaining?: number; daily_total?: number; used_period?: number; granted_period?: number; period_end?: string; checked_at?: string };
type EmailLimits = { daily_limit?: number };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const fmtDate = (d: Date) => d.toLocaleString("es", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Próxima recarga diaria de créditos: 00:00 UTC, mostrada en la hora de la persona. */
function nextDailyReset() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1));
}

function bounds(range: Range, from: string, to: string): [Date, Date] {
  const today = startOfDay(new Date());
  const day = 86400000;
  if (range === "hoy") return [today, new Date(today.getTime() + day)];
  if (range === "ayer") return [new Date(today.getTime() - day), today];
  if (range === "custom") {
    const a = from ? new Date(`${from}T00:00:00`) : new Date(today.getTime() - 6 * day);
    const b = to ? new Date(new Date(`${to}T00:00:00`).getTime() + day) : new Date(today.getTime() + day);
    return [a, b];
  }
  return [new Date(today.getTime() - (Number(range) - 1) * day), new Date(today.getTime() + day)];
}

function useSetting<T>(key: string) {
  return useQuery({
    queryKey: ["admin-setting", key],
    queryFn: async () => {
      const { data } = await supabase.from("admin_settings").select("value, updated_at").eq("key", key).maybeSingle();
      return { value: (data?.value ?? {}) as T, updated_at: data?.updated_at ?? null };
    },
  });
}

/** Resumen de créditos de IA o límite de correos, con ventana de detalles por fechas. */
export function UsagePanel({ kind, className }: { kind: Kind; className?: string }) {
  const [open, setOpen] = useState(false);
  const today = bounds("hoy", "", "");
  const { data: todayRows = [] } = useQuery({
    queryKey: ["usage-log", kind, "hoy"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await supabase.from("usage_log").select("ok, status, created_at").eq("kind", kind)
        .gte("created_at", today[0].toISOString()).lt("created_at", today[1].toISOString()).order("created_at", { ascending: false }).limit(1000);
      return data ?? [];
    },
  });
  const credits = useSetting<AiCredits>("ai_credits");
  const limits = useSetting<EmailLimits>("email_limits");
  const blocked = kind === "ai" && todayRows[0] && !todayRows[0].ok && (todayRows[0].status === 402 || todayRows[0].status === 403);
  const emailLimit = limits.data?.value.daily_limit ?? 0;
  const sentToday = todayRows.filter((r) => r.ok).length;
  const emailFull = kind === "email" && emailLimit > 0 && sentToday >= emailLimit;
  const full = blocked || emailFull;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn("flex h-auto w-full items-center gap-3 whitespace-normal rounded-[14px] border p-3 text-left active:scale-[.99] transition", full ? "border-destructive/50 bg-destructive/10 text-foreground" : "border-border bg-card text-card-foreground", className)}
      >
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[12px]", full ? "bg-destructive/15 text-destructive" : "bg-primary/12 text-primary")}>
          {kind === "ai" ? <Sparkles className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-bold">
            {kind === "ai"
              ? full ? "Créditos de IA agotados por ahora" : `Créditos de IA: ${credits.data?.value.remaining ?? "—"} disponibles`
              : full ? "Límite de correos de hoy alcanzado" : `Correos de hoy: ${sentToday}${emailLimit ? ` de ${emailLimit}` : ""}`}
          </span>
          <span className="block text-[12px] text-muted-foreground">
            {todayRows.length} {kind === "ai" ? "peticiones" : "envíos"} hoy · Próxima recarga {fmtDate(kind === "ai" ? nextDailyReset() : bounds("hoy", "", "")[1])}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground">Ver detalles</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-[19px]">{kind === "ai" ? "Créditos de IA" : "Límite de correos"}</DialogTitle>
          </DialogHeader>
          <Details kind={kind} credits={credits.data} limits={limits.data} blocked={!!full} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function Details({ kind, credits, limits, blocked }: {
  kind: Kind; blocked: boolean;
  credits?: { value: AiCredits; updated_at: string | null };
  limits?: { value: EmailLimits; updated_at: string | null };
}) {
  const qc = useQueryClient();
  const [range, setRange] = useState<Range>("30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [a, b] = bounds(range, from, to);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["usage-log", kind, range, from, to],
    queryFn: async () => {
      const { data } = await supabase.from("usage_log").select("ok, status, duration_ms, created_at, feature").eq("kind", kind)
        .gte("created_at", a.toISOString()).lt("created_at", b.toISOString()).order("created_at", { ascending: false }).limit(5000);
      return data ?? [];
    },
  });
  const stats = useMemo(() => {
    const ok = rows.filter((r) => r.ok).length;
    const times = rows.map((r) => r.duration_ms).filter((n): n is number => typeof n === "number");
    return {
      total: rows.length,
      ok,
      failed: rows.length - ok,
      rate: rows.length ? Math.round((ok / rows.length) * 100) : 0,
      avg: times.length ? times.reduce((s, n) => s + n, 0) / times.length / 1000 : 0,
      noCredit: rows.filter((r) => r.status === 402 || r.status === 403).length,
      last: rows.find((r) => !r.ok && (r.status === 402 || r.status === 403)),
    };
  }, [rows]);
  const c = credits?.value ?? {};
  const periodEnd = c.period_end ? new Date(`${c.period_end}T00:00:00`) : null;

  async function save() {
    const key = kind === "ai" ? "ai_credits" : "email_limits";
    const base = kind === "ai" ? { ...c } : { ...(limits?.value ?? {}) };
    const num = (v: string | undefined) => (v === undefined || v === "" ? undefined : Number(v));
    const value = kind === "ai"
      ? { ...base, remaining: num(form.remaining) ?? c.remaining, used_period: num(form.used_period) ?? c.used_period, granted_period: num(form.granted_period) ?? c.granted_period, period_end: form.period_end || c.period_end, checked_at: new Date().toISOString() }
      : { ...base, daily_limit: num(form.daily_limit) ?? limits?.value.daily_limit };
    await supabase.from("admin_settings").upsert({ key, value: value as never, updated_at: new Date().toISOString() });
    qc.invalidateQueries({ queryKey: ["admin-setting", key] });
    setEditing(false);
  }

  return (
    <div className="space-y-4">
      {blocked && (
        <div className="flex gap-3 rounded-[12px] border border-[#E8A23A]/50 bg-[#FFF4E0] p-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#9A5B00]" />
          <p className="text-[13px] text-[#5C3A00]">
            {kind === "ai"
              ? `Llegaste al límite. Crear con IA vuelve a funcionar con la próxima recarga: ${fmtDate(nextDailyReset())}${periodEnd ? `, o al renovar tu plan el ${periodEnd.toLocaleDateString("es", { day: "numeric", month: "long" })}` : ""}.`
              : `Llegaste al límite de hoy. Los correos se vuelven a enviar desde ${fmtDate(bounds("hoy", "", "")[1])}.`}
          </p>
        </div>
      )}

      {kind === "ai" ? (
        <div className="grid grid-cols-2 gap-2">
          <Stat icon={Sparkles} label="Créditos disponibles" value={c.remaining ?? "—"} />
          <Stat icon={Gauge} label="Créditos gastados (mes)" value={c.used_period ?? "—"} sub={c.granted_period ? `de ${c.granted_period}` : undefined} />
          <Stat icon={CalendarClock} label="Recarga diaria" value={fmtDate(nextDailyReset())} sub={c.daily_total ? `${c.daily_total} créditos por día` : undefined} />
          <Stat icon={CalendarClock} label="Renovación del plan" value={periodEnd ? periodEnd.toLocaleDateString("es", { day: "numeric", month: "short" }) : "—"} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Stat icon={Mail} label="Límite por día" value={limits?.value.daily_limit ?? "Sin límite"} />
          <Stat icon={CalendarClock} label="Se renueva" value={fmtDate(bounds("hoy", "", "")[1])} />
        </div>
      )}
      <p className="text-[11.5px] text-muted-foreground">
        {kind === "ai"
          ? `Números del saldo revisados el ${c.checked_at ? fmtDate(new Date(c.checked_at)) : "—"}. El saldo exacto en vivo está en Lovable → Configuración → Planes y créditos; puedes copiarlo aquí.`
          : "El límite diario lo defines tú para cuidar tu reputación de envío."}
      </p>
      {editing ? (
        <div className="grid grid-cols-2 gap-2">
          {(kind === "ai"
            ? [["remaining", "Disponibles", String(c.remaining ?? "")], ["used_period", "Gastados (mes)", String(c.used_period ?? "")], ["granted_period", "Total del mes", String(c.granted_period ?? "")], ["period_end", "Renovación (AAAA-MM-DD)", c.period_end ?? ""]]
            : [["daily_limit", "Correos por día", String(limits?.value.daily_limit ?? "")]]
          ).map(([k, label, def]) => (
            <label key={k} className="text-[12px] font-semibold">
              {label}
              <input defaultValue={def} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className="mt-1 h-11 w-full rounded-[10px] border-2 border-border bg-card px-3 text-[14px]" />
            </label>
          ))}
          <button onClick={() => void save()} className="col-span-2 h-12 rounded-[12px] bg-[#7C5CFF] text-[14px] font-bold text-white">Guardar</button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-[#7C5CFF]/10 px-3 text-[13px] font-bold text-[#5B3FD9]">
          <Pencil className="h-4 w-4" /> {kind === "ai" ? "Actualizar saldo" : "Cambiar límite"}
        </button>
      )}

      <div>
        <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">Periodo</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)} className={cn("h-9 rounded-full border px-3 text-[13px] font-semibold", range === r.id ? "border-[#7C5CFF] bg-[#7C5CFF] text-white" : "border-border bg-card")}>
              {r.label}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="text-[12px] font-semibold">Desde<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-11 w-full rounded-[10px] border-2 border-border bg-card px-2" /></label>
            <label className="text-[12px] font-semibold">Hasta<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-11 w-full rounded-[10px] border-2 border-border bg-card px-2" /></label>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-[12px] bg-muted" />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Stat icon={Activity} label={kind === "ai" ? "Peticiones a la IA" : "Correos enviados"} value={stats.total} />
          <Stat icon={CheckCircle2} label="Tasa de éxito" value={`${stats.rate}%`} sub={`${stats.ok} bien · ${stats.failed} con error`} />
          {kind === "ai" && <Stat icon={Clock} label="Tiempo promedio" value={`${stats.avg.toFixed(1)} s`} />}
          {kind === "ai" && <Stat icon={AlertTriangle} label="Frenadas por límite" value={stats.noCredit} sub={stats.last ? `Última: ${fmtDate(new Date(stats.last.created_at))}` : undefined} />}
        </div>
      )}
      {!isLoading && stats.total === 0 && (
        <p className="rounded-[12px] bg-muted/50 p-3 text-center text-[13px] text-muted-foreground">Sin movimientos en este periodo. Se registran desde hoy.</p>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Activity; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-card p-3">
      <Icon className="h-4 w-4 text-[#5B3FD9]" />
      <p className="mt-1 text-[12px] text-muted-foreground">{label}</p>
      <p className="font-display text-[18px] font-extrabold leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
