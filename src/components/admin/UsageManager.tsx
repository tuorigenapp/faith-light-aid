import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Activity, CalendarDays, Clock, Loader2, Users } from "lucide-react";
import { adminUsage } from "@/lib/admin-insights.functions";

const RANGES = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
];

const SECTION_LABEL: Record<string, string> = {
  chat: "Mentor IA",
  journal: "Diario",
  stage: "Etapas",
  quiz: "Quiz diario",
  palabra: "Palabra del día",
  visualiza: "Visualiza y vívelo",
  pareja: "Análisis de pareja",
  patrones: "Patrones",
  ministracion: "Ministración",
  ruleta: "Ruleta",
  game: "Juegos",
};

/** Uso real de la app: personas activas, secciones y mejores horarios. */
export function UsageManager() {
  const usage = useServerFn(adminUsage);
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-usage", days],
    queryFn: () => usage({ data: { days } }),
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
            <Stat icon={Users} label="Activos hoy" value={data.activeToday} />
            <Stat icon={CalendarDays} label="Activos 7 días" value={data.active7} />
            <Stat icon={CalendarDays} label="Activos 30 días" value={data.active30} />
            <Stat icon={Activity} label="Acciones registradas" value={data.total} />
          </div>

          <Chart
            title="Secciones más usadas"
            subtitle="Dónde pasa la gente su tiempo dentro de la app."
            data={data.sections.map((s) => ({
              name: SECTION_LABEL[s.name] ?? s.name,
              value: s.value,
            }))}
            angled
          />

          <Chart
            title="Horas con más actividad"
            subtitle="Úsalo para programar tus notificaciones push."
            data={data.hours.map((h) => ({ name: h.hour, value: h.value }))}
          />

          <Chart
            title="Días de la semana"
            subtitle="Los días donde tu comunidad se conecta más."
            data={data.weekdays}
          />

          <div className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="font-display text-[17px] font-bold">Recomendación</h2>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              El mejor horario para enviar mensajes es alrededor de las{" "}
              <b className="text-foreground">
                {[...data.hours].sort((a, b) => b.value - a.value)[0]?.hour ?? "—"}
              </b>{" "}
              y el día más fuerte es{" "}
              <b className="text-foreground">
                {[...data.weekdays].sort((a, b) => b.value - a.value)[0]?.name ?? "—"}
              </b>
              .
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Chart({
  title,
  subtitle,
  data,
  angled = false,
}: {
  title: string;
  subtitle: string;
  data: { name: string; value: number }[];
  angled?: boolean;
}) {
  return (
    <section className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
      <h2 className="font-display text-[17px] font-bold">{title}</h2>
      <p className="text-[13px] text-muted-foreground">{subtitle}</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              interval={0}
              angle={angled ? -20 : 0}
              textAnchor={angled ? "end" : "middle"}
              height={angled ? 56 : 24}
            />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--primary)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
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
