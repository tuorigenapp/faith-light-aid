import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListWallet, adminReviewPurchase, adminReviewTransfer } from "@/lib/wallet.functions";
import { Check, Loader2, Receipt, RefreshCw, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Tab = "compras" | "transferencias";

const STATUS_STYLE: Record<string, string> = {
  pendiente: "bg-[#E9B949]/20 text-[#F3D08A]",
  pending: "bg-[#E9B949]/20 text-[#F3D08A]",
  aprobada: "bg-[#3FBE8F]/20 text-[#1B6B4F]",
  rechazada: "bg-destructive/20 text-destructive",
  revision: "bg-[#7C5CFF]/20 text-[#4B32A8]",
};

function whenLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function WalletManager() {
  const qc = useQueryClient();
  const load = useServerFn(adminListWallet);
  const reviewPurchase = useServerFn(adminReviewPurchase);
  const reviewTransfer = useServerFn(adminReviewTransfer);
  const [tab, setTab] = useState<Tab>("compras");
  const [bucket, setBucket] = useState("pendientes");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [order, setOrder] = useState("arrival");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-wallet"],
    queryFn: () => load({}),
    refetchInterval: 60000,
  });

  const nameOf = (userId: string) => {
    const person = data?.people.find((p) => p.id === userId);
    return person?.full_name || person?.email || "Persona de ORÍGEN";
  };

  async function act(
    kind: Tab,
    id: string,
    action: "aprobada" | "rechazada" | "revision",
  ) {
    setBusyId(id);
    setNote(null);
    try {
      const payload = { data: { id, action, message: messages[id] ?? "" } };
      if (kind === "compras") await reviewPurchase(payload);
      else await reviewTransfer(payload);
      setNote({
        text:
          action === "aprobada"
            ? "Listo, ya quedó aprobada y avisamos a la persona."
            : action === "rechazada"
              ? "Quedó rechazada y la persona ya recibió el aviso."
              : "Marcada para revisión, la persona recibió el aviso.",
      });
      qc.invalidateQueries({ queryKey: ["admin-wallet"] });
    } catch (e) {
      setNote({ text: e instanceof Error ? e.message : "No pudimos guardar el cambio.", error: true });
    }
    setBusyId(null);
  }

  const pendingPurchases = (data?.purchases ?? []).filter((p) => p.status === "pendiente" || p.status === "revision").length;
  const pendingTransfers = (data?.transfers ?? []).filter((t) => t.status === "pending" || t.status === "pendiente" || t.status === "revision").length;
  const matches = (p: { user_id: string; status: string; created_at: string }) => {
    const person = data?.people.find(x => x.id === p.user_id);
    const day = p.created_at.slice(0, 10);
    return (bucket === "pendientes" ? ["pending", "pendiente", "revision"].includes(p.status) : p.status === bucket)
      && (!search || `${person?.full_name ?? ""} ${person?.email ?? ""}`.toLowerCase().includes(search.toLowerCase()))
      && (!from || day >= from) && (!to || day <= to);
  };
  const sortRows = (a: { created_at: string }, b: { created_at: string }) => order === "arrival" ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at);
  const purchases = (data?.purchases ?? []).filter(matches).sort(sortRows);
  const transfers = (data?.transfers ?? []).filter(matches).sort(sortRows);

  return (
    <div className="space-y-4">
      {receipt && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/70 p-4" onClick={() => setReceipt(null)}><section role="dialog" aria-modal="true" aria-label="Comprobante de pago" className="w-full max-w-2xl rounded-xl bg-card p-4" onClick={e => e.stopPropagation()}><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Comprobante de pago</h2><Button size="icon" variant="ghost" aria-label="Cerrar comprobante" onClick={() => setReceipt(null)}><X /></Button></div><img src={receipt} alt="Comprobante de pago" className="max-h-[75vh] w-full object-contain" /></section></div>}
      <div className="flex flex-wrap gap-2">{[["pendientes", "Pendientes"], ["aprobada", "Aprobados"], ["rechazada", "Rechazados"]].map(([key, label]) => <Button key={key} variant={bucket === key ? "default" : "secondary"} onClick={() => setBucket(key)}>{label}</Button>)}</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm">Nombre o correo<input aria-label="Buscar pagos" value={search} onChange={e => setSearch(e.target.value)} className="mt-1 h-12 w-full rounded-lg border border-border bg-card px-3" /></label><label className="text-sm">Desde<input aria-label="Pagos desde" type="date" value={from} onChange={e => setFrom(e.target.value)} className="mt-1 h-12 w-full rounded-lg border border-border bg-card px-3" /></label><label className="text-sm">Hasta<input aria-label="Pagos hasta" type="date" value={to} onChange={e => setTo(e.target.value)} className="mt-1 h-12 w-full rounded-lg border border-border bg-card px-3" /></label><label className="text-sm">Orden<select value={order} onChange={e => setOrder(e.target.value)} className="mt-1 h-12 w-full rounded-lg border border-border bg-card px-3"><option value="arrival">Primero en llegar</option><option value="recent">Más recientes</option></select></label></div>
      <div className="flex flex-wrap gap-2">
        {([
          { id: "compras" as Tab, label: "Compras", count: pendingPurchases, icon: Receipt },
          { id: "transferencias" as Tab, label: "Transferencias", count: pendingTransfers, icon: Send },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-[13px] font-bold transition",
              tab === t.id
                ? "border-[#7C5CFF] bg-[#7C5CFF]/15 text-[#4B32A8]"
                : "border-white/15 bg-card text-foreground/70",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-bold text-white">
                {t.count}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["admin-wallet"] })}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white/15 bg-card px-4 text-[13px] font-bold text-foreground/70"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {note && (
        <p
          className={cn(
            "rounded-[12px] border px-4 py-3 text-[13px] font-semibold",
            note.error
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-[#3FBE8F]/40 bg-[#3FBE8F]/10 text-[#1B6B4F]",
          )}
        >
          {note.text}
        </p>
      )}

      {isLoading && <div className="h-32 animate-pulse rounded-[16px] bg-muted" />}

      {tab === "compras" && (
        <ul className="space-y-3">
          {purchases.map((p) => (
            <li key={p.id} className="rounded-[16px] border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-bold text-foreground">{nameOf(p.user_id)}</span>
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", STATUS_STYLE[p.status] ?? "bg-muted text-foreground/60")}>
                  {p.status}
                </span>
                <span className="text-[11.5px] text-foreground/50">{new Date(p.created_at).toLocaleString("es")}</span>
              </div>
              <p className="mt-1 text-[13px] text-foreground/70">
                {data?.people.find(x => x.id === p.user_id)?.email} ·
                {p.hojas} hojas · US${Number(p.usd).toFixed(2)} · {p.method}
              </p>
              {p.user_message && <p className="mt-1 text-[13px] italic text-foreground/60">“{p.user_message}”</p>}
              {p.appeal_message && (
                <p className="mt-2 rounded-[10px] border border-[#E9B949]/40 bg-[#E9B949]/10 px-3 py-2 text-[13px] text-[#F3D08A]">
                  Pidió revisión: {p.appeal_message}
                </p>
              )}
              {data?.receipts[p.id] && (
                <Button variant="outline" className="mt-3" onClick={() => setReceipt(data.receipts[p.id] ?? null)}><Receipt className="h-4 w-4" /> Abrir comprobante</Button>
              )}
              {p.admin_note && <p className="mt-2 text-[12.5px] text-foreground/55">Nota: {p.admin_note}</p>}
              {["pendiente", "pending", "revision"].includes(p.status) && (
                <div className="mt-3 space-y-2">
                  <input
                    value={messages[p.id] ?? ""}
                    onChange={(e) => setMessages((m) => ({ ...m, [p.id]: e.target.value }))}
                    placeholder="Mensaje para la persona (opcional)"
                    className="w-full min-h-12 rounded-[10px] border-2 border-white/15 bg-card px-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-[#7C5CFF] focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => act("compras", p.id, "aprobada")}
                      disabled={busyId === p.id}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#3FBE8F] px-4 text-[13px] font-bold text-[#08251B] disabled:opacity-60"
                    >
                      {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Aprobar
                    </button>
                    <button
                      onClick={() => act("compras", p.id, "rechazada")}
                      disabled={busyId === p.id}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-destructive/90 px-4 text-[13px] font-bold text-white disabled:opacity-60"
                    >
                      <X className="h-4 w-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => act("compras", p.id, "revision")}
                      disabled={busyId === p.id}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white/20 px-4 text-[13px] font-bold text-foreground/80 disabled:opacity-60"
                    >
                      Pedir revisión
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {!isLoading && purchases.length === 0 && (
            <li className="rounded-[16px] border border-border bg-card p-5 text-[13px] text-foreground/60">
              No hay pagos que coincidan con esta búsqueda.
            </li>
          )}
        </ul>
      )}

      {tab === "transferencias" && (
        <ul className="space-y-3">
          {transfers.map((t) => (
            <li key={t.id} className="rounded-[16px] border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-bold text-foreground">{nameOf(t.user_id)}</span>
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", STATUS_STYLE[t.status] ?? "bg-muted text-foreground/60")}>
                  {t.status}
                </span>
                <span className="text-[11.5px] text-foreground/50">{new Date(t.created_at).toLocaleString("es")}</span>
              </div>
              <p className="mt-1 text-[13px] text-foreground/70">
                Envía {Math.round(t.points / 100)} hojas a {t.to_email}
              </p>
              {t.appeal_message && (
                <p className="mt-2 rounded-[10px] border border-[#E9B949]/40 bg-[#E9B949]/10 px-3 py-2 text-[13px] text-[#F3D08A]">
                  Pidió revisión: {t.appeal_message}
                </p>
              )}
              {t.admin_note && <p className="mt-2 text-[12.5px] text-foreground/55">Nota: {t.admin_note}</p>}
              {t.status !== "aprobada" && t.status !== "rechazada" && (
                <div className="mt-3 space-y-2">
                  <input
                    value={messages[t.id] ?? ""}
                    onChange={(e) => setMessages((m) => ({ ...m, [t.id]: e.target.value }))}
                    placeholder="Mensaje para la persona (opcional)"
                    className="w-full min-h-12 rounded-[10px] border-2 border-white/15 bg-card px-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-[#7C5CFF] focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => act("transferencias", t.id, "aprobada")}
                      disabled={busyId === t.id}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#3FBE8F] px-4 text-[13px] font-bold text-[#08251B] disabled:opacity-60"
                    >
                      {busyId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Aprobar
                    </button>
                    <button
                      onClick={() => act("transferencias", t.id, "rechazada")}
                      disabled={busyId === t.id}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-destructive/90 px-4 text-[13px] font-bold text-white disabled:opacity-60"
                    >
                      <X className="h-4 w-4" />
                      Rechazar y devolver
                    </button>
                    <button
                      onClick={() => act("transferencias", t.id, "revision")}
                      disabled={busyId === t.id}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white/20 px-4 text-[13px] font-bold text-foreground/80 disabled:opacity-60"
                    >
                      Pedir revisión
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {!isLoading && transfers.length === 0 && (
            <li className="rounded-[16px] border border-border bg-card p-5 text-[13px] text-foreground/60">
              Todavía no hay envíos de hojas entre personas.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
