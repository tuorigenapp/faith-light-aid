import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookHeart, HeartHandshake, Mail, MessageCircle, Send, ShoppingBag, Sparkles, Leaf, TreeDeciduous, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { usd } from "@/lib/hojas";
import treePng from "@/assets/hojas-tree.png";

type HistoryKind = "compra" | "transferencia" | "familia" | "diario" | "consulta" | "mentor" | "soporte" | "movimiento";
type Tab = "todas" | HistoryKind;
type Row = { id: string; kind: HistoryKind; title: string; detail: string; status?: string; amount?: string; date: Date };

export const Route = createFileRoute("/_authenticated/historial")({
  head: () => ({
    meta: [
      { title: "Historial general — ORÍGEN" },
      { name: "description", content: "Todo tu registro de ORÍGEN: compras, transferencias, familiares, diario, consultas, mentora, soporte y movimientos." },
      { property: "og:title", content: "Historial general — ORÍGEN" },
      { property: "og:description", content: "Una sola sección para revisar cada movimiento y actividad importante dentro de ORÍGEN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistorialPage,
});

const TABS: { id: Tab; label: string }[] = [
  { id: "todas", label: "Todo" },
  { id: "compra", label: "Compras" },
  { id: "transferencia", label: "Transferencias" },
  { id: "familia", label: "Familia" },
  { id: "consulta", label: "Consultas" },
  { id: "diario", label: "Diario" },
  { id: "mentor", label: "Mentora" },
];

function HistorialPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("todas");

  const { data: rows = [], isLoading, isError } = useQuery({
    queryKey: ["historial-general", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const userId = user?.id;
      if (!userId) return [];
      const [tx, transfers, family, journal, pareja, patrones, ministracion, messages, ratings, purchases] = await Promise.all([
        supabase.from("gem_transactions").select("id, amount, reason, meta, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
        supabase.from("hoja_transfers").select("id, to_email, points, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
        supabase.from("family_members").select("id, full_name, relationship, lineage, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
        supabase.from("journal_entries").select("id, title, kind, mood, created_at").eq("user_id", userId).is("deleted_at", null).order("created_at", { ascending: false }).limit(80),
        supabase.from("pareja_lecturas").select("id, partner_name, question, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(60),
        supabase.from("patrones_consultas").select("id, name, question, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(60),
        supabase.from("ministracion_lecturas").select("id, name, question, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(60),
        supabase.from("messages").select("id, role, created_at, conversations!inner(id)").eq("user_id", userId).is("conversations.deleted_at", null).order("created_at", { ascending: false }).limit(80),
        supabase.from("satisfaction_ratings").select("id, section, stars, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
        supabase.from("purchase_requests").select("id, pack_id, hojas, usd, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      ]);

      const output: Row[] = [];
      (tx.data ?? []).forEach((t) => {
        const meta = (t.meta ?? {}) as Record<string, unknown>;
        const kind = ((meta.kind as HistoryKind | undefined) ?? (t.reason?.toLowerCase().startsWith("transferencia") ? "transferencia" : t.amount < 0 ? "movimiento" : "movimiento"));
        const hojas = typeof meta.hojas === "number" ? meta.hojas : t.amount / 100;
        const price = typeof meta.usd === "number" ? usd(meta.usd) : `${hojas > 0 ? "+" : ""}${Number.isInteger(hojas) ? hojas : hojas.toFixed(2)} hojas`;
        output.push({ id: `tx-${t.id}`, kind, title: humanReason(t.reason ?? ""), detail: kind === "compra" ? "Recarga solicitada" : "Movimiento de hojas", status: (meta.status as string | undefined) ?? "aprobada", amount: price, date: new Date(t.created_at) });
      });
      (purchases.data ?? []).forEach((p) =>
        output.push({
          id: `pr-${p.id}`,
          kind: "compra",
          title: `Recarga de ${p.hojas.toLocaleString("es-MX")} hojas`,
          detail: p.status === "pendiente" ? "Esperando revisión de soporte" : p.status === "revision" ? "En revisión por soporte" : p.status === "aprobada" ? "Aprobada y acreditada" : "No aprobada",
          status: p.status,
          amount: usd(Number(p.usd)),
          date: new Date(p.created_at),
        }),
      );
      (transfers.data ?? []).forEach((t) => output.push({ id: `tr-${t.id}`, kind: "transferencia", title: `Transferencia a ${t.to_email}`, detail: `${Math.floor(t.points / 100)} hojas enviadas`, status: t.status, date: new Date(t.created_at) }));
      (family.data ?? []).forEach((m) => output.push({ id: `fam-${m.id}`, kind: "familia", title: m.full_name, detail: `${m.relationship} · ${m.lineage}`, status: "registrado", date: new Date(m.created_at) }));
      (journal.data ?? []).forEach((j) => output.push({ id: `jr-${j.id}`, kind: "diario", title: j.title || "Entrada de diario", detail: `${j.kind}${j.mood ? ` · ${j.mood}` : ""}`, status: "guardado", date: new Date(j.created_at) }));
      (pareja.data ?? []).forEach((r) => output.push({ id: `pa-${r.id}`, kind: "consulta", title: "Consulta de pareja", detail: r.partner_name || r.question || "Consulta guardada", status: "completa", date: new Date(r.created_at) }));
      (patrones.data ?? []).forEach((r) => output.push({ id: `pt-${r.id}`, kind: "consulta", title: "Patrones familiares", detail: r.name || r.question || "Consulta guardada", status: "completa", date: new Date(r.created_at) }));
      (ministracion.data ?? []).forEach((r) => output.push({ id: `mi-${r.id}`, kind: "consulta", title: "Dios te dice hoy", detail: r.name || r.question || "Ministración guardada", status: "completa", date: new Date(r.created_at) }));
      (messages.data ?? []).filter((m) => m.role === "user").forEach((m) => output.push({ id: `msg-${m.id}`, kind: "mentor", title: "Mensaje con Ruth Esther", detail: "Conversación espiritual", status: "enviado", date: new Date(m.created_at) }));
      (ratings.data ?? []).forEach((r) => output.push({ id: `sat-${r.id}`, kind: "soporte", title: `Tu opinión sobre ${SECTION_NAMES[r.section] ?? humanWord(r.section)}`, detail: `${r.stars} estrellas`, status: "recibida", date: new Date(r.created_at) }));
      return output.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 300);
    },
  });

  const filtered = rows.filter((r) => tab === "todas" || r.kind === tab);

  return (
    <div className="min-h-dvh bg-aura-top pb-28">
      <div className="mx-auto w-full max-w-[1100px] px-5 pt-5">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" aria-label="Volver al inicio" className="w-10 h-10 shrink-0 rounded-full bg-card shadow-soft grid place-items-center text-primary active:scale-95 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary">Tus registros</p>
            <h1 className="font-display font-extrabold text-[24px] leading-tight text-foreground">Historial general</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">Todo lo que pasa en ORÍGEN vive aquí.</p>
          </div>
        </div>

        <div className="mt-5 -mx-5 px-5 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 w-max pb-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn("h-10 rounded-[10px] px-3 text-[12px] font-bold transition active:scale-95", tab === t.id ? "bg-primary/12 text-primary" : "bg-card border border-border text-muted-foreground")}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {isLoading && [0, 1, 2, 3].map((i) => <div key={i} className="h-[86px] rounded-[16px] bg-card border border-border animate-pulse" />)}
          {isError && <State title="No pudimos cargar tu historial" body="Revisa tu conexión y vuelve a intentarlo en un momento." />}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="rounded-[16px] bg-card border border-border p-6 text-center shadow-soft">
              <img src={treePng} alt="Árbol de sanación ORÍGEN" loading="lazy" width={1024} height={1024} className="w-28 h-28 mx-auto object-contain" />
              <div className="font-display font-bold text-[16px] text-foreground">Tu historial comienza hoy</div>
              <p className="mt-1 text-[13px] text-muted-foreground">Cuando uses la app, tus registros importantes aparecerán aquí.</p>
              <Link to="/explorar" className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-[12px] px-5 btn-primary-gradient font-display font-bold text-[15px] text-primary-foreground active:scale-[.98] transition">
                <Sparkles className="w-4 h-4" /> Explorar ORÍGEN
              </Link>
            </div>
          )}
          {filtered.map((r) => <HistoryRow key={r.id} row={r} />)}
        </div>

        <div className="mt-4 rounded-[12px] bg-primary/10 border border-primary/15 px-4 py-3 flex items-center gap-3 text-[13px] font-semibold text-primary">
          <Mail className="w-4 h-4 shrink-0" /> Compras, transferencias, familiares, consultas, mentora y soporte se centralizan en esta sección.
        </div>
      </div>
    </div>
  );
}

function State({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[16px] bg-card border border-border p-5 text-center"><p className="font-display font-bold text-[15px]">{title}</p><p className="mt-1 text-[13px] text-muted-foreground">{body}</p></div>;
}

function HistoryRow({ row }: { row: Row }) {
  const Icon = iconFor(row.kind);
  return (
    <div className="rounded-[16px] bg-card border border-border p-4 shadow-soft grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <span className="w-10 h-10 rounded-[10px] bg-primary/10 grid place-items-center shrink-0 text-primary"><Icon className="w-4 h-4" /></span>
      <div className="min-w-0">
        <div className="font-display font-bold text-[15px] text-foreground truncate">{row.title}</div>
        <div className="text-[12px] text-muted-foreground truncate">{row.detail}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{row.date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })} · {row.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
      </div>
      <div className="text-right shrink-0">
        {row.status && <span className="inline-block rounded-full px-2.5 py-1 text-[11px] font-black bg-primary/10 text-primary capitalize">{statusLabel(row.status)}</span>}
        {row.amount && <div className="mt-1 text-[13px] font-semibold text-foreground tabular-nums">{row.amount}</div>}
      </div>
    </div>
  );
}

function iconFor(kind: HistoryKind) {
  if (kind === "compra") return ShoppingBag;
  if (kind === "transferencia") return Send;
  if (kind === "familia") return TreeDeciduous;
  if (kind === "diario") return BookHeart;
  if (kind === "consulta") return HeartHandshake;
  if (kind === "mentor") return MessageCircle;
  if (kind === "soporte") return UserCheck;
  return Leaf;
}

function statusLabel(status: string) {
  const map: Record<string, string> = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" };
  return map[status] ?? status;
}

const SECTION_NAMES: Record<string, string> = {
  camino: "Camino ORÍGEN", etapas: "Camino ORÍGEN", etapa: "Camino ORÍGEN", ejercicios: "Ejercicios del día", ejercicio: "Ejercicios del día",
  palabra: "Palabra del día", visualiza: "Visualízalo y Vívelo", juegos: "Juegos", juego: "Juegos", ruleta: "Ruleta de hoy",
  arbol: "Mi árbol", comunidad: "Comunidad", chat: "Mentora Ruth", mentor: "Mentora Ruth", pareja: "Consulta de pareja",
  patrones: "Patrones familiares", ministracion: "Dios te dice hoy", diario: "Diario íntimo", premios: "Premios ORÍGEN",
  diagnostico: "Diagnóstico", perfil: "Mi perfil", invita: "Invita y gana", referido: "Invita y gana",
};

function humanWord(w: string) {
  const clean = w.replace(/[-_]+/g, " ").trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "ORÍGEN";
}

/** Convierte los códigos internos (leaf:, ruleta:, day:…) en nombres claros. */
function humanReason(raw: string): string {
  const [code, ...rest] = raw.split(" · ");
  const label = rest.join(" · ").trim();
  const parts = code.split(":");
  const head = parts[0]?.toLowerCase() ?? "";
  const sec = parts[1] ?? "";
  const name = SECTION_NAMES[sec.toLowerCase()] ?? humanWord(sec);
  if (!code.includes(":")) return humanWord(raw);
  switch (head) {
    case "leaf": return label ? `Avance en ${name} · ${label}` : `Avance en ${name}`;
    case "ruleta": return "Premio de la Ruleta de hoy";
    case "compra": return "Compra de hojas";
    case "transfer-in": return "Hojas recibidas de otra persona";
    case "transfer-refund": return "Devolución de una transferencia";
    case "ajuste": return "Ajuste de saldo de ORÍGEN";
    case "day": return `Acceso del día a ${name}`;
    case "consulta": return `Consulta: ${name}`;
    case "valoracion": case "valoración": return `Tu opinión sobre ${name}`;
    default: return label ? `${humanWord(head)} · ${label}` : humanWord(head);
  }
}
