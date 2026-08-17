import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Send, ShoppingBag, Sparkles, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { usd } from "@/lib/hojas";
import treePng from "@/assets/hojas-tree.png";

export const Route = createFileRoute("/_authenticated/historial")({
  head: () => ({
    meta: [
      { title: "Historial de transacciones — ORÍGEN" },
      {
        name: "description",
        content:
          "Revisa cada movimiento de tus Hojas de Sanación: recargas, transferencias enviadas y su estado de aprobación.",
      },
      { property: "og:title", content: "Historial de transacciones — ORÍGEN" },
      { property: "og:description", content: "Cada hoja, cada recarga y cada transferencia, siempre a la vista." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistorialPage,
});

type Tab = "todas" | "compras" | "transferencias" | "movimientos";

function HistorialPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("todas");

  const { data: tx, isLoading, isError } = useQuery({
    queryKey: ["hoja-tx-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gem_transactions")
        .select("id, amount, reason, meta, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = (tx ?? [])
    .map((t) => {
      const meta = (t.meta ?? {}) as Record<string, unknown>;
      const kind =
        (meta["kind"] as string) ??
        (t.reason?.toLowerCase().startsWith("transferencia") ? "transferencia" : t.amount < 0 ? "consumo" : "movimiento");
      const status = (meta["status"] as string) ?? "aprobada";
      const hojas = (meta["hojas"] as number) ?? t.amount / 100;
      const price = meta["usd"] as number | undefined;
      return { id: t.id, kind, status, hojas, price, reason: t.reason, date: new Date(t.created_at) };
    })
    .filter((r) =>
      tab === "todas"
        ? true
        : tab === "compras"
          ? r.kind === "compra"
          : tab === "transferencias"
            ? r.kind === "transferencia"
            : r.kind !== "compra" && r.kind !== "transferencia",
    );

  return (
    <div className="min-h-dvh bg-background pb-28">
      <div className="mx-auto w-full max-w-[1100px] px-5 pt-5">
        <div className="flex items-center gap-3">
          <Link
            to="/arbol"
            aria-label="Volver al árbol de sanación"
            className="w-10 h-10 shrink-0 rounded-full bg-card shadow-soft grid place-items-center text-[#7C5CFF] active:scale-95 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#7C5CFF]">Tus movimientos</p>
            <h1 className="font-display font-extrabold text-[22px] leading-tight text-foreground">Historial de transacciones 🍃</h1>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 rounded-[12px] bg-card border border-border p-1">
          {(["todas", "compras", "transferencias", "movimientos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "h-9 rounded-[10px] text-[11.5px] font-bold capitalize transition active:scale-95",
                tab === t ? "bg-[#7C5CFF]/12 text-[#7C5CFF]" : "text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {isLoading &&
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[86px] rounded-[16px] bg-card border border-border animate-pulse" />
            ))}

          {isError && (
            <div className="rounded-[16px] bg-card border border-border p-5 text-center">
              <p className="font-display font-bold text-[15px]">No pudimos cargar tu historial</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Revisa tu conexión y vuelve a intentarlo en un momento.</p>
            </div>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <div className="rounded-[16px] bg-card border border-border p-6 text-center shadow-soft">
              <img src={treePng} alt="" aria-hidden loading="lazy" width={1024} height={1024} className="w-28 h-28 mx-auto object-contain" />
              <div className="font-display font-bold text-[16px] text-foreground">Tu historial comienza hoy</div>
              <p className="mt-1 text-[13px] text-muted-foreground">Cuando recargues, ganes o transfieras hojas, verás cada movimiento aquí.</p>
              <Link
                to="/premios"
                className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-[12px] px-5 font-display font-bold text-[15px] text-white active:scale-[.98] transition"
                style={{ background: "linear-gradient(180deg,#8F6BFF 0%,#F58BCB 100%)", boxShadow: "0 4px 14px rgba(124,92,255,.30)" }}
              >
                <Sparkles className="w-4 h-4" /> Recargar mis hojas
              </Link>
            </div>
          )}

          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-[16px] bg-card border border-border p-4 shadow-soft grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
            >
              <span className="w-10 h-10 rounded-[10px] bg-[#7C5CFF]/10 grid place-items-center shrink-0 text-[#7C5CFF]">
                {r.kind === "transferencia" ? <Send className="w-4 h-4" /> : r.kind === "compra" ? <ShoppingBag className="w-4 h-4" /> : <Leaf className="w-4 h-4" />}
              </span>
              <div className="min-w-0">
                <div className="font-display font-bold text-[15px] text-foreground truncate">{r.reason}</div>
                <div className="text-[12px] text-muted-foreground capitalize">{r.kind}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {r.date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
                  {r.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={cn(
                    "inline-block rounded-full px-2.5 py-1 text-[11px] font-black",
                    r.status === "pendiente" ? "bg-[#F7B955]/15 text-[#B77B12]" : "bg-[#3FBE8F]/15 text-[#2FA574]",
                  )}
                >
                  {r.status === "pendiente" ? "Pendiente" : "Aprobada"}
                </span>
                <div className="mt-1 text-[13px] font-semibold text-foreground tabular-nums">
                  {r.price !== undefined ? usd(r.price) : `${r.hojas > 0 ? "+" : ""}${r.hojas.toFixed(3)} 🍃`}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[12px] bg-[#7C5CFF]/[0.07] border border-[#7C5CFF]/15 px-4 py-3 flex items-center gap-3 text-[13px] font-semibold text-[#7C5CFF]">
          <Mail className="w-4 h-4 shrink-0" /> Las transferencias se revisan manualmente antes de aprobarse.
        </div>
      </div>
    </div>
  );
}
