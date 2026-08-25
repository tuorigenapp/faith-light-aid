import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { DollarSign, Loader2, TrendingUp, Users, XCircle } from "lucide-react";
import { adminSales } from "@/lib/admin-insights.functions";

const RANGES = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
];

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  trialing: "En prueba",
  canceled: "Cancelada",
  past_due: "Pago pendiente",
};

/** Ventas reales: ingresos, suscripciones activas y detalle por persona. */
export function SalesManager() {
  const sales = useServerFn(adminSales);
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sales", days],
    queryFn: () => sales({ data: { days } }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.days}
            type="button"
            onClick={() => setDays(r.days)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
              days === r.days
                ? "bg-primary text-primary-foreground"
                : "border border-border/60 bg-card text-muted-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading || !data ? (
        <div className="grid place-items-center rounded-[16px] border border-border/60 bg-card py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={DollarSign}
              label="Ingresos del mes"
              value={`US$ ${data.monthRevenue.toFixed(2)}`}
            />
            <Stat icon={TrendingUp} label="Ingreso recurrente" value={`US$ ${data.mrr.toFixed(2)}`} />
            <Stat icon={Users} label="Suscripciones activas" value={data.activeCount} />
            <Stat icon={XCircle} label="Canceladas" value={data.canceledCount} />
          </div>

          <section className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
            <h2 className="font-display text-[17px] font-bold">Nuevas ventas por día</h2>
            <p className="text-[13px] text-muted-foreground">
              {data.trialCount} personas están en periodo de prueba ahora mismo.
            </p>
            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
            <h2 className="font-display text-[17px] font-bold">Detalle de ventas</h2>
            {data.table.length === 0 ? (
              <p className="mt-3 rounded-[12px] bg-muted/40 p-4 text-[13px] text-muted-foreground">
                Todavía no hay ventas en este periodo.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-3">Persona</th>
                      <th className="py-2 pr-3">Plan</th>
                      <th className="py-2 pr-3">Estado</th>
                      <th className="py-2 pr-3">Fecha</th>
                      <th className="py-2">Renueva</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.table.map((row, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="py-2 pr-3">{row.email}</td>
                        <td className="py-2 pr-3 capitalize">{row.plan}</td>
                        <td className="py-2 pr-3">{STATUS_LABEL[row.status] ?? row.status}</td>
                        <td className="py-2 pr-3">
                          {new Date(row.created_at).toLocaleDateString("es")}
                        </td>
                        <td className="py-2">
                          {row.renews ? new Date(row.renews).toLocaleDateString("es") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 font-display text-[26px] font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
