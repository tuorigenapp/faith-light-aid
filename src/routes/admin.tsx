import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  CreditCard,
  MessageCircle,
  BookHeart,
  Leaf,
  Sparkles,
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Library,
  BookOpen,
  Star,
  LogOut,
  XCircle,
  Loader2,
  ShieldCheck,
  Headphones,
  Send,
  Receipt,
} from "lucide-react";
import { BooksManager } from "@/components/admin/BooksManager";
import { AudiosManager } from "@/components/admin/AudiosManager";
import { CommunityModerator } from "@/components/admin/CommunityModerator";
import { UsersManager } from "@/components/admin/UsersManager";
import { MarketingManager } from "@/components/admin/MarketingManager";
import { SalesManager } from "@/components/admin/SalesManager";
import { UsageManager } from "@/components/admin/UsageManager";
import { ContentManager } from "@/components/admin/ContentManager";
import { BackupManager } from "@/components/admin/BackupManager";
import { ContentStudio } from "@/components/admin/ContentStudio";
import { WalletManager } from "@/components/admin/WalletManager";
import { PromoManager } from "@/components/admin/PromoManager";
import { Megaphone, BrainCircuit, Wand2 } from "lucide-react";
import { BrainManager } from "@/components/admin/BrainManager";
import { ConsultasStudio } from "@/components/admin/ConsultasStudio";
import { UsagePanel } from "@/components/admin/UsagePanel";
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Panel de administración — ORÍGEN" }, { name: "description", content: "Gestión privada de contenidos, comunidad y pagos de ORÍGEN." }, { property: "og:title", content: "Administración — ORÍGEN" }, { property: "og:description", content: "Gestión privada de la plataforma ORÍGEN." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AdminGate,
});

/** Acceso propio del panel: no redirige a la app ni al onboarding. */
function AdminGate() {
  const [state, setState] = useState<"checking" | "login" | "ok">("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function check() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return setState("login");
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "admin")
      .maybeSingle();
    setState(data ? "ok" : "login");
    if (!data) setError("Esta cuenta no tiene permisos de administración.");
  }

  useEffect(() => {
    void check();
  }, []);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setBusy(false);
      setError("Correo o contraseña incorrectos.");
      return;
    }
    await check();
    setBusy(false);
  }

  if (state === "checking") {
    return (
      <main className="grid min-h-dvh place-items-center bg-[oklch(0.22_0.03_285)]">
        <Loader2 className="h-6 w-6 animate-spin text-white/70" />
      </main>
    );
  }

  if (state === "login") {
    return (
      <main className="grid min-h-dvh place-items-center bg-[oklch(0.22_0.03_285)] px-5">
        <form
          onSubmit={signIn}
          className="w-full max-w-sm rounded-[16px] bg-[oklch(0.26_0.03_285)] p-6 text-[oklch(0.97_0.01_285)]"
        >
          <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="mt-4 font-display text-[24px] font-extrabold leading-tight">
            Administración ORÍGEN
          </h1>
          <p className="mt-1 text-[13px] opacity-70">Acceso solo para el equipo.</p>

          <label className="mt-5 block text-[12px] font-bold opacity-80" htmlFor="admin-email">
            Correo
          </label>
          <input
            id="admin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-[10px] border-[1.5px] border-white/15 bg-white/5 px-3 text-[15px] outline-none focus:border-primary"
            autoComplete="email"
          />

          <label className="mt-4 block text-[12px] font-bold opacity-80" htmlFor="admin-pass">
            Contraseña
          </label>
          <input
            id="admin-pass"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-[10px] border-[1.5px] border-white/15 bg-white/5 px-3 text-[15px] outline-none focus:border-primary"
            autoComplete="current-password"
          />

          {error && <p className="mt-3 text-[13px] font-semibold text-[#FF9A9A]">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 grid min-h-[52px] w-full place-items-center rounded-[12px] bg-primary text-[16px] font-bold text-primary-foreground active:scale-[.98] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar al panel"}
          </button>
        </form>
      </main>
    );
  }

  return <Admin />;
}

type SectionId =
  | "resumen"
  | "usuarios"
  | "ventas"
  | "uso"
  | "contenido"
  | "studio"
  | "wallet"
  | "promos"
  | "cerebro"
  | "consultas"
  | "libros"
  | "audios"
  | "comunidad"
  | "marketing"
  | "backup"
  | "opiniones";

const NAV: { id: SectionId; label: string; icon: typeof Users }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "ventas", label: "Ventas", icon: CreditCard },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "uso", label: "Uso de la app", icon: TrendingUp },
  { id: "contenido", label: "Contenido", icon: Library },
  { id: "studio", label: "Crear con IA", icon: Sparkles },
  { id: "wallet", label: "Compras y envíos", icon: Receipt },
  { id: "promos", label: "Campañas emergentes", icon: Megaphone },
  { id: "cerebro", label: "Cerebro ORÍGEN", icon: BrainCircuit },
  { id: "consultas", label: "Crear consultas", icon: Wand2 },
  { id: "libros", label: "Libros", icon: BookOpen },
  { id: "audios", label: "Música", icon: Headphones },
  { id: "comunidad", label: "Comunidad", icon: MessageCircle },
  { id: "marketing", label: "Marketing", icon: Send },
  { id: "backup", label: "Copia de seguridad", icon: ShieldCheck },
  { id: "opiniones", label: "Opiniones", icon: Star },
];

function lastDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function Admin() {
  const [section, setSection] = useState<SectionId>("resumen");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-panel"],
    queryFn: async () => {
      const [
        profiles,
        msgs,
        journal,
        subs,
        activity,
        gems,
        cancel,
        ratings,
        stages,
        books,
        palabras,
        consultas,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, display_name, email, country, current_stage, gems, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }),
        supabase
          .from("subscriptions")
          .select("plan, status, created_at, current_period_end, user_id"),
        supabase
          .from("daily_activity")
          .select("activity_date, activity_type")
          .order("activity_date", { ascending: false })
          .limit(2000),
        supabase
          .from("gem_transactions")
          .select("amount, reason, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("cancellation_surveys")
          .select("reason, comment, from_plan, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("satisfaction_ratings")
          .select("section, stars, comment, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("stages").select("id, title").order("id"),
        supabase.from("library_items").select("id, title, category, required_plan").limit(200),
        supabase
          .from("daily_devotionals")
          .select("id, day_of_year, word")
          .order("day_of_year")
          .limit(400),
        supabase.from("ministracion_lecturas").select("id", { count: "exact", head: true }),
      ]);

      const users = profiles.data ?? [];
      const subsList = subs.data ?? [];
      const acts = activity.data ?? [];

      const paid = subsList.filter(
        (s) => ["camino", "monthly", "annual"].includes(s.plan) && s.status === "active",
      );
      const mrr = paid.reduce((sum, s) => sum + (s.plan === "annual" ? 7.49 : 14.99), 0);

      const days = lastDays(14);
      const signupSeries = days.map((d) => ({
        day: d.slice(5),
        value: users.filter((u) => (u.created_at ?? "").slice(0, 10) === d).length,
      }));
      const activeSeries = days.map((d) => ({
        day: d.slice(5),
        value: new Set(acts.filter((a) => a.activity_date === d).map(() => 1)).size
          ? acts.filter((a) => a.activity_date === d).length
          : 0,
      }));

      const typeCounts: Record<string, number> = {};
      acts.forEach((a) => {
        typeCounts[a.activity_type] = (typeCounts[a.activity_type] ?? 0) + 1;
      });
      const topActions = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));

      const today = new Date().toISOString().slice(0, 10);
      const activeToday = new Set(
        acts.filter((a) => a.activity_date === today).map((a) => a.activity_type),
      ).size;

      const cancelCounts: Record<string, number> = {};
      (cancel.data ?? []).forEach((c) => {
        cancelCounts[c.reason] = (cancelCounts[c.reason] ?? 0) + 1;
      });

      const ratingsList = ratings.data ?? [];
      const avgStars = ratingsList.length
        ? ratingsList.reduce((s, r) => s + r.stars, 0) / ratingsList.length
        : null;

      return {
        users,
        msgs: msgs.count ?? 0,
        journal: journal.count ?? 0,
        consultas: consultas.count ?? 0,
        subsList,
        paidCount: paid.length,
        mrr,
        signupSeries,
        activeSeries,
        topActions,
        activeToday,
        gems: gems.data ?? [],
        cancel: cancel.data ?? [],
        cancelCounts,
        ratings: ratingsList,
        avgStars,
        stages: stages.data ?? [],
        books: books.data ?? [],
        palabras: palabras.data ?? [],
      };
    },
  });

  const alerts: { tone: "warn" | "ok"; title: string; body: string }[] = [];
  if (data) {
    if (data.paidCount === 0)
      alerts.push({
        tone: "warn",
        title: "Todavía no hay suscripciones activas",
        body: "Nadie ha pagado aún. Revisa que los enlaces de pago de Membresía funcionen y comparte la landing.",
      });
    if (data.cancel.length > 3)
      alerts.push({
        tone: "warn",
        title: "Cancelaciones en aumento",
        body: "Revisa la sección Opiniones: los motivos más repetidos te dicen qué arreglar primero.",
      });
    if (alerts.length === 0)
      alerts.push({ tone: "ok", title: "Todo en orden", body: "No hay avisos importantes hoy." });
  }

  return (
    <div className="min-h-dvh bg-background md:flex">
      {/* Sidebar oscuro */}
      <aside className="md:sticky md:top-0 md:h-dvh md:w-[240px] shrink-0 bg-[oklch(0.22_0.03_285)] px-4 py-5 text-[oklch(0.97_0.01_285)]">
        <div className="flex items-center gap-2 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-[15px] font-bold leading-none">ORÍGEN</p>
            <p className="text-[11px] opacity-70">Administración</p>
          </div>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-[10px] px-3 text-left text-sm font-medium transition ${
                section === n.id
                  ? "bg-primary text-primary-foreground"
                  : "opacity-80 hover:bg-white/10"
              }`}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </button>
          ))}
        </nav>

        <a
          href="/dashboard"
          className="mt-6 hidden min-h-11 items-center gap-2 rounded-[10px] px-3 text-sm opacity-70 hover:bg-white/10 md:flex"
        >
          <LogOut className="h-4 w-4" /> Volver a la app
        </a>
      </aside>

      {/* Contenido */}
      <main className="mx-auto w-full max-w-[1100px] px-5 py-6 md:px-8">
        <h1 className="font-display text-[28px] font-extrabold leading-tight">
          {NAV.find((n) => n.id === section)!.label}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos reales de tu plataforma. Donde no hay información dice “Sin datos”.
        </p>

        {isLoading && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-[16px] bg-secondary" />
            ))}
          </div>
        )}

        {section === "resumen" && <div className="mb-4 grid gap-3 sm:grid-cols-2"><UsagePanel kind="ai" /><UsagePanel kind="email" /></div>}
        {data && section === "resumen" && (
          <>
            <div className="mt-5 space-y-2">
              {alerts.map((a) => (
                <div
                  key={a.title}
                  className={`flex items-start gap-3 rounded-[16px] p-4 ${
                    a.tone === "warn"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{a.title}</p>
                    <p className="text-[13px] opacity-90">{a.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                icon={Users}
                label="Usuarios"
                value={data.users.length}
                series={data.signupSeries}
              />
              <Metric
                icon={CreditCard}
                label="Suscripciones activas"
                value={data.paidCount}
                series={data.signupSeries}
              />
              <Metric
                icon={TrendingUp}
                label="MRR estimado"
                value={`US$${data.mrr.toFixed(2)}`}
                series={data.activeSeries}
              />
              <Metric
                icon={MessageCircle}
                label="Mensajes con la mentora"
                value={data.msgs}
                series={data.activeSeries}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Small icon={BookHeart} label="Entradas de diario" value={data.journal} />
              <Small icon={Sparkles} label="Consultas realizadas" value={data.consultas} />
              <Small icon={Leaf} label="Movimientos de hojas" value={data.gems.length} />
              <Small icon={XCircle} label="Cancelaciones" value={data.cancel.length} />
            </div>

            <Card className="mt-4">
              <CardTitle icon={Sparkles}>Lectura del negocio</CardTitle>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/85">
                <li>
                  <b>{data.users.length}</b> personas registradas y <b>{data.paidCount}</b> con plan
                  activo
                  {data.users.length > 0 && (
                    <>
                      {" "}
                      ({((data.paidCount / data.users.length) * 100).toFixed(1)} % de conversión).
                    </>
                  )}
                </li>
                <li>
                  La acción más usada es <b>{data.topActions[0]?.name ?? "sin datos"}</b>: es tu
                  gancho, ponla siempre al frente en el Home.
                </li>
                <li>
                  {data.avgStars ? (
                    <>
                      Satisfacción promedio de <b>{data.avgStars.toFixed(1)} / 5</b> según las
                      opiniones enviadas.
                    </>
                  ) : (
                    "Aún no hay calificaciones de satisfacción: aparecerán cuando la gente use la Palabra del día."
                  )}
                </li>
              </ul>
            </Card>
          </>
        )}

        {section === "ventas" && (
          <div className="mt-5">
            <SalesManager />
          </div>
        )}

        {section === "usuarios" && (
          <div className="mt-5">
            <UsersManager />
          </div>
        )}

        {section === "uso" && (
          <div className="mt-5">
            <UsageManager />
          </div>
        )}

        {section === "contenido" && (
          <div className="mt-5">
            <ContentManager />
          </div>
        )}

        {section === "backup" && (
          <div className="mt-5">
            <BackupManager />
          </div>
        )}

        {section === "studio" && <><UsagePanel kind="ai" className="mb-4" /><ContentStudio /></>}

        {section === "wallet" && <WalletManager />}
        {section === "promos" && <PromoManager />}
        {section === "cerebro" && <BrainManager />}
        {section === "consultas" && <><UsagePanel kind="ai" className="mb-4" /><ConsultasStudio /></>}

        {section === "libros" && <BooksManager />}

        {section === "audios" && <AudiosManager />}
        {section === "comunidad" && <CommunityModerator />}

        {section === "marketing" && <><UsagePanel kind="email" className="mb-3" /><UsagePanel kind="ai" className="mb-4" /><MarketingManager /></>}

        {data && section === "opiniones" && (
          <>
            <Card className="mt-5">
              <CardTitle icon={Star}>
                Satisfacción {data.avgStars ? `· ${data.avgStars.toFixed(1)} / 5` : ""}
              </CardTitle>
              {data.ratings.length === 0 ? (
                <Empty>Sin datos: todavía nadie ha calificado.</Empty>
              ) : (
                <Table
                  head={["Sección", "Estrellas", "Comentario", "Fecha"]}
                  rows={data.ratings.map((r) => [
                    r.section,
                    "★".repeat(r.stars),
                    r.comment || "—",
                    new Date(r.created_at).toLocaleDateString("es"),
                  ])}
                />
              )}
            </Card>
            <Card className="mt-4">
              <CardTitle icon={XCircle}>Encuestas de cancelación</CardTitle>
              {data.cancel.length === 0 ? (
                <Empty>Sin datos de cancelaciones.</Empty>
              ) : (
                <Table
                  head={["Motivo", "Comentario", "Plan", "Fecha"]}
                  rows={data.cancel.map((c) => [
                    c.reason,
                    c.comment || "—",
                    c.from_plan || "Sin datos",
                    new Date(c.created_at).toLocaleDateString("es"),
                  ])}
                />
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

/* ---------- piezas de UI ---------- */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[16px] border border-border/60 bg-card p-5 shadow-soft ${className}`}
    >
      {children}
    </section>
  );
}

function CardTitle({ icon: Icon, children }: { icon: typeof Users; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <h2 className="font-display text-[17px] font-bold">{children}</h2>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  series,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  series: { day: string; value: number }[];
}) {
  return (
    <div className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-[28px] font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series}>
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Small({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 font-display text-[22px] font-bold leading-none">{value}</p>
      <p className="mt-1 text-[12px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="mt-4 -mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {head.map((h) => (
              <th key={h} className="pb-2 pr-4 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="py-2.5 pr-4 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded-[10px] bg-secondary/60 p-4 text-sm text-muted-foreground">
      {children}
    </p>
  );
}
