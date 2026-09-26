import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListWallet, adminReviewPurchase, adminReviewTransfer } from "@/lib/wallet.functions";
import { Check, Loader2, Receipt, RefreshCw, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "compras" | "transferencias";

const STATUS_STYLE: Record<string, string> = {
  pendiente: "bg-[#E9B949]/20 text-[#F3D08A]",
  pending: "bg-[#E9B949]/20 text-[#F3D08A]",
  aprobada: "bg-[#3FBE8F]/20 text-[#8FE3C4]",
  rechazada: "bg-destructive/20 text-destructive",
  revision: "bg-[#7C5CFF]/20 text-[#C6B4FF]",
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

  return (
    <div className="space-y-4">
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
                ? "border-[#7C5CFF] bg-[#7C5CFF]/15 text-white"
                : "border-white/15 bg-white/[0.04] text-white/70",
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
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white/15 bg-white/[0.04] px-4 text-[13px] font-bold text-white/70"
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
              : "border-[#3FBE8F]/40 bg-[#3FBE8F]/10 text-[#8FE3C4]",
          )}
        >
          {note.text}
        </p>
      )}

      {isLoading && <div className="h-32 animate-pulse rounded-[16px] bg-white/10" />}

      {tab === "compras" && (
        <ul className="space-y-3">
          {(data?.purchases ?? []).map((p) => (
            <li key={p.id} className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-bold text-white">{nameOf(p.user_id)}</span>
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", STATUS_STYLE[p.status] ?? "bg-white/10 text-white/60")}>
                  {p.status}
                </span>
                <span className="text-[11.5px] text-white/50">{whenLabel(p.created_at)}</span>
              </div>
              <p className="mt-1 text-[13px] text-white/70">
                {p.hojas} hojas · US${Number(p.usd).toFixed(2)} · {p.method}
              </p>
              {p.user_message && <p className="mt-1 text-[13px] italic text-white/60">“{p.user_message}”</p>}
              {p.appeal_message && (
                <p className="mt-2 rounded-[10px] border border-[#E9B949]/40 bg-[#E9B949]/10 px-3 py-2 text-[13px] text-[#F3D08A]">
                  Pidió revisión: {p.appeal_message}
                </p>
              )}
              {data?.receipts[p.id] && (
                <a href={data.receipts[p.id]} target="_blank" rel="noreferrer" className="mt-3 block">
                  <img src={data.receipts[p.id]} alt="Comprobante de pago" className="max-h-56 w-full rounded-[12px] object-contain" />
                </a>
              )}
              {p.admin_note && <p className="mt-2 text-[12.5px] text-white/55">Nota: {p.admin_note}</p>}
              {p.status !== "aprobada" && (
                <div className="mt-3 space-y-2">
                  <input
                    value={messages[p.id] ?? ""}
                    onChange={(e) => setMessages((m) => ({ ...m, [p.id]: e.target.value }))}
                    placeholder="Mensaje para la persona (opcional)"
                    className="w-full min-h-12 rounded-[10px] border-2 border-white/15 bg-white/[0.06] px-3 text-[14px] text-white placeholder:text-white/40 focus:border-[#7C5CFF] focus:outline-none"
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
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white/20 px-4 text-[13px] font-bold text-white/80 disabled:opacity-60"
                    >
                      Pedir revisión
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {!isLoading && (data?.purchases ?? []).length === 0 && (
            <li className="rounded-[16px] border border-white/10 bg-white/[0.04] p-5 text-[13px] text-white/60">
              Todavía nadie ha subido un comprobante de pago.
            </li>
          )}
        </ul>
      )}

      {tab === "transferencias" && (
        <ul className="space-y-3">
          {(data?.transfers ?? []).map((t) => (
            <li key={t.id} className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-bold text-white">{nameOf(t.user_id)}</span>
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", STATUS_STYLE[t.status] ?? "bg-white/10 text-white/60")}>
                  {t.status}
                </span>
                <span className="text-[11.5px] text-white/50">{whenLabel(t.created_at)}</span>
              </div>
              <p className="mt-1 text-[13px] text-white/70">
                Envía {Math.round(t.points / 100)} hojas a {t.to_email}
              </p>
              {t.appeal_message && (
                <p className="mt-2 rounded-[10px] border border-[#E9B949]/40 bg-[#E9B949]/10 px-3 py-2 text-[13px] text-[#F3D08A]">
                  Pidió revisión: {t.appeal_message}
                </p>
              )}
              {t.admin_note && <p className="mt-2 text-[12.5px] text-white/55">Nota: {t.admin_note}</p>}
              {t.status !== "aprobada" && t.status !== "rechazada" && (
                <div className="mt-3 space-y-2">
                  <input
                    value={messages[t.id] ?? ""}
                    onChange={(e) => setMessages((m) => ({ ...m, [t.id]: e.target.value }))}
                    placeholder="Mensaje para la persona (opcional)"
                    className="w-full min-h-12 rounded-[10px] border-2 border-white/15 bg-white/[0.06] px-3 text-[14px] text-white placeholder:text-white/40 focus:border-[#7C5CFF] focus:outline-none"
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
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white/20 px-4 text-[13px] font-bold text-white/80 disabled:opacity-60"
                    >
                      Pedir revisión
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {!isLoading && (data?.transfers ?? []).length === 0 && (
            <li className="rounded-[16px] border border-white/10 bg-white/[0.04] p-5 text-[13px] text-white/60">
              Todavía no hay envíos de hojas entre personas.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
