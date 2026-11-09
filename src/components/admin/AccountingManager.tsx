import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, FileText, Users, CreditCard, XCircle, HeartHandshake, Repeat, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { countBy, excelWorkbook, planPrice, type Period } from "@/lib/accounting";
import { cn } from "@/lib/utils";

type Row = { created_at: string; [k: string]: unknown };
const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "Día" }, { id: "week", label: "Semana" }, { id: "month", label: "Mes" }, { id: "year", label: "Año" },
];
const usd = (n: number) => `US$ ${n.toFixed(2)}`;
const fdate = (iso: string) => new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });

/** Contabilidad completa: registros, membresías, cancelaciones, gracia, cambios de plan y compras de hojas. */
export function AccountingManager() {
  const [period, setPeriod] = useState<Period>("month");
  const q = useQuery({
    queryKey: ["admin-accounting"],
    queryFn: async () => {
      const [pr, su, ca, gr, ch, pu] = await Promise.all([
        supabase.from("profiles").select("id, display_name, full_name, email, created_at").order("created_at", { ascending: false }).limit(5000),
        supabase.from("subscriptions").select("user_id, plan, status, created_at, current_period_end").order("created_at", { ascending: false }).limit(5000),
        supabase.from("cancellation_surveys").select("*").order("created_at", { ascending: false }).limit(5000),
        supabase.from("grace_periods").select("*").order("created_at", { ascending: false }).limit(5000),
        supabase.from("plan_change_requests").select("*").order("created_at", { ascending: false }).limit(5000),
        supabase.from("purchase_requests").select("user_id, usd, hojas, status, method, created_at").order("created_at", { ascending: false }).limit(5000),
      ]);
      return {
        profiles: (pr.data ?? []) as Row[], subs: (su.data ?? []) as Row[], cancels: (ca.data ?? []) as Row[],
        grace: (gr.data ?? []) as Row[], changes: (ch.data ?? []) as Row[], purchases: (pu.data ?? []) as Row[],
      };
    },
  });

  const d = q.data;
  const names = useMemo(() => new Map((d?.profiles ?? []).map((p) => [p.id as string, (p.display_name || p.full_name || p.email || "") as string])), [d]);
  const paidSubs = useMemo(() => (d?.subs ?? []).filter((s) => planPrice(s.plan as string)), [d]);
  const activeSubs = paidSubs.filter((s) => s.status === "active" || s.status === "trialing");
  const mrr = activeSubs.reduce((a, s) => {
    const p = planPrice(s.plan as string)!; const f = p.cadence === "Semanal" ? 4.33 : p.cadence === "Anual" ? 1 / 12 : 1;
    return a + p.usd * f;
  }, 0);
  const hojasUsd = (d?.purchases ?? []).filter((p) => p.status === "approved").reduce((a, p) => a + Number(p.usd ?? 0), 0);

  const series = useMemo(() => {
    if (!d) return [];
    const reg = countBy(d.profiles, period), alt = countBy(paidSubs, period), baj = countBy(d.cancels, period), gra = countBy(d.grace, period);
    const keys = [...new Set([...reg.keys(), ...alt.keys(), ...baj.keys(), ...gra.keys()])].sort().slice(-12);
    return keys.map((k) => ({ k, reg: reg.get(k) ?? 0, alt: alt.get(k) ?? 0, baj: baj.get(k) ?? 0, gra: gra.get(k) ?? 0 }));
  }, [d, period, paidSubs]);
  const max = Math.max(1, ...series.flatMap((s) => [s.reg, s.alt, s.baj, s.gra]));

  function sheets() {
    if (!d) return [];
    return [
      { name: "Resumen por período", header: ["Período", "Registros", "Altas pagas", "Cancelaciones", "Gracia"], rows: series.map((s) => [s.k, s.reg, s.alt, s.baj, s.gra]) },
      { name: "Membresías", header: ["Fecha", "Persona", "Plan", "Frecuencia", "Precio USD", "Estado", "Vence"], rows: paidSubs.map((s) => { const p = planPrice(s.plan as string)!; return [fdate(s.created_at), names.get(s.user_id as string) ?? "", p.name, p.cadence, p.usd, String(s.status ?? ""), s.current_period_end ? fdate(s.current_period_end as string) : ""]; }) },
      { name: "Cancelaciones", header: ["Fecha", "Persona", "Plan", "Motivo", "Comentario"], rows: d.cancels.map((c) => [fdate(c.created_at), names.get(c.user_id as string) ?? "", String(c.from_plan ?? ""), String(c.reason ?? ""), String(c.comment ?? "")]) },
      { name: "Periodos de gracia", header: ["Fecha", "Persona", "Plan", "Días", "Estado", "Termina", "Motivo"], rows: d.grace.map((g) => [fdate(g.created_at), names.get(g.user_id as string) ?? "", String(g.from_plan ?? ""), Number(g.days ?? 0), String(g.status ?? ""), g.ends_at ? fdate(g.ends_at as string) : "", String(g.reason ?? "")]) },
      { name: "Cambios de plan", header: ["Fecha", "Persona", "De", "A", "Dirección", "Estado"], rows: d.changes.map((c) => [fdate(c.created_at), names.get(c.user_id as string) ?? "", String(c.from_plan ?? ""), String(c.to_plan ?? ""), String(c.direction ?? ""), String(c.status ?? "")]) },
      { name: "Compras de hojas", header: ["Fecha", "Persona", "USD", "Hojas", "Método", "Estado"], rows: d.purchases.map((p) => [fdate(p.created_at), names.get(p.user_id as string) ?? "", Number(p.usd ?? 0), Number(p.hojas ?? 0), String(p.method ?? ""), String(p.status ?? "")]) },
      { name: "Personas registradas", header: ["Fecha", "Nombre", "Correo"], rows: d.profiles.map((p) => [fdate(p.created_at), String(p.display_name || p.full_name || ""), String(p.email ?? "")]) },
    ];
  }

  function exportExcel() {
    const blob = new Blob([excelWorkbook(sheets())], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `contabilidad-origen-${new Date().toISOString().slice(0, 10)}.xls`; a.click(); URL.revokeObjectURL(a.href);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 48;
    const line = (t: string, size = 10, bold = false) => {
      if (y > 800) { doc.addPage(); y = 48; }
      doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.text(t.slice(0, 110), 40, y); y += size + 6;
    };
    line("ORÍGEN · Contabilidad", 18, true);
    line(`Generado ${new Date().toLocaleString("es")}`, 9);
    line(`Personas registradas: ${d?.profiles.length ?? 0} · Membresías activas: ${activeSubs.length} · Ingreso mensual estimado: ${usd(mrr)} · Hojas aprobadas: ${usd(hojasUsd)}`, 10, true);
    for (const s of sheets()) {
      y += 8; line(s.name, 13, true); line(s.header.join("  |  "), 9, true);
      for (const r of s.rows.slice(0, 300)) line(r.join("  |  "), 8);
    }
    doc.save(`contabilidad-origen-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (q.isLoading) return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-[16px] bg-secondary" />)}</div>;
  if (q.error) return <p className="text-sm text-destructive">No pudimos cargar la contabilidad. Recarga la página.</p>;

  const stats = [
    { icon: Users, label: "Personas registradas", value: String(d?.profiles.length ?? 0) },
    { icon: CreditCard, label: "Membresías activas", value: String(activeSubs.length) },
    { icon: Coins, label: "Ingreso mensual estimado", value: usd(mrr) },
    { icon: XCircle, label: "Cancelaciones", value: String(d?.cancels.length ?? 0) },
    { icon: HeartHandshake, label: "Períodos de gracia", value: String(d?.grace.length ?? 0) },
    { icon: Repeat, label: "Cambios de plan", value: String(d?.changes.length ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Contabilidad</h2>
          <p className="text-sm text-muted-foreground">Altas, bajas, membresías, gracia, cambios y compras en un solo lugar.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-cta-green px-4 text-sm font-semibold text-cta-green-foreground"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
          <button onClick={exportPdf} className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-primary px-4 text-sm font-semibold text-primary-foreground"><FileText className="h-4 w-4" /> PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-[16px] border border-border bg-card p-4">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
            <p className="mt-2 font-display text-2xl font-bold">{value}</p>
            <p className="text-[12px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[16px] border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Movimiento por período</h3>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button key={p.id} onClick={() => setPeriod(p.id)} className={cn("min-h-9 rounded-full px-3 text-[13px] font-semibold", period === p.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/80")}>{p.label}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-primary" />Registros</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-cta-green" />Altas pagas</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-destructive" />Cancelaciones</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-accent-foreground/50" />Gracia</span>
        </div>
        {series.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">Aún no hay movimiento registrado.</p> : (
          <div className="mt-4 overflow-x-auto">
            <div className="flex h-48 min-w-max items-end gap-4">
              {series.map((s) => (
                <div key={s.k} className="flex flex-col items-center gap-1">
                  <div className="flex h-40 items-end gap-0.5">
                    {[["reg", "bg-primary"], ["alt", "bg-cta-green"], ["baj", "bg-destructive"], ["gra", "bg-accent-foreground/50"]].map(([key, cls]) => (
                      <div key={key} title={`${key}: ${s[key as "reg"]}`} className={cn("w-2.5 rounded-t transition-all duration-500", cls)} style={{ height: `${(s[key as "reg"] / max) * 100}%`, minHeight: s[key as "reg"] ? 3 : 0 }} />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{s.k}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-[16px] border border-border bg-card p-4">
        <h3 className="font-semibold">Membresías por plan</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[13px]">
            <thead className="text-muted-foreground"><tr><th className="py-2">Fecha</th><th>Persona</th><th>Plan</th><th>Frecuencia</th><th>Precio</th><th>Estado</th></tr></thead>
            <tbody>
              {paidSubs.slice(0, 100).map((s, i) => { const p = planPrice(s.plan as string)!; return (
                <tr key={i} className="border-t border-border"><td className="py-2">{fdate(s.created_at)}</td><td>{names.get(s.user_id as string) || "—"}</td><td>{p.name}</td><td>{p.cadence}</td><td>{usd(p.usd)}</td><td>{String(s.status)}</td></tr>
              ); })}
              {paidSubs.length === 0 && <tr><td colSpan={6} className="py-4 text-muted-foreground">Todavía no hay membresías pagas registradas.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
