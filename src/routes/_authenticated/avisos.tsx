import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { ensureDailyNotice, markNoticesRead } from "@/lib/notices.functions";
import { Bell, Check, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/avisos")({
  head: () => ({
    meta: [
      { title: "Avisos de ORÍGEN — tus mensajes del día" },
      {
        name: "description",
        content:
          "Recibe cada día un mensaje de ORÍGEN hecho para tu proceso, más los avisos de tu camino, compras y comunidad.",
      },
      { property: "og:title", content: "Avisos de ORÍGEN" },
      {
        property: "og:description",
        content: "Un mensaje al día para tu proceso y todos los avisos de tu cuenta en un solo lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Avisos,
});

const KIND_LABEL: Record<string, string> = {
  diario: "Mensaje del día",
  sistema: "ORÍGEN",
  compra: "Compra de hojas",
  transferencia: "Transferencia",
  comunidad: "Comunidad",
  logro: "Logro",
};

function whenLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

function Avisos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const ensure = useServerFn(ensureDailyNotice);
  const markRead = useServerFn(markNoticesRead);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["origen-notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("origen_notifications")
        .select("id, kind, title, body, link, read_at, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(80);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await ensure({});
        if (!cancelled && result?.created) {
          qc.invalidateQueries({ queryKey: ["origen-notifications"] });
          qc.invalidateQueries({ queryKey: ["origen-pendings"] });
        }
      } catch {
        /* si falla, se ven los avisos que ya existen */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, ensure, qc]);

  const unread = rows.filter((r) => !r.read_at);

  async function readAll() {
    if (unread.length === 0) return;
    await markRead({ data: { ids: unread.map((r) => r.id) } });
    qc.invalidateQueries({ queryKey: ["origen-notifications"] });
    qc.invalidateQueries({ queryKey: ["origen-pendings"] });
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-5 md:px-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-extrabold leading-tight">Avisos de ORÍGEN</h1>
          <p className="text-[13px] text-muted-foreground">
            Aquí solo recibes. Un mensaje al día, hecho para tu proceso.
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={readAll}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary/10 px-3 text-[12.5px] font-bold text-primary"
          >
            <Check className="h-4 w-4" /> Marcar leídos
          </button>
        )}
      </header>

      {isLoading && (
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-[16px] bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={Sparkles}
            title="Tu primer mensaje llega hoy"
            body="Cada día ORÍGEN te deja un mensaje pensado para lo que estás trabajando."
          />
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {rows.map((r) => {
          const inner = (
            <>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                  {KIND_LABEL[r.kind] ?? "ORÍGEN"}
                </span>
                {!r.read_at && (
                  <span
                    aria-label="No leído"
                    className="h-2.5 w-2.5 rounded-full bg-destructive"
                  />
                )}
                <span className="ml-auto text-[11.5px] text-muted-foreground">
                  {whenLabel(r.created_at)}
                </span>
              </div>
              <h2 className="mt-2 font-display text-[17px] font-bold leading-tight">{r.title}</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-foreground/80">{r.body}</p>
              {r.link && (
                <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-primary">
                  Abrir <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </>
          );
          return (
            <li
              key={r.id}
              className={cn(
                "rounded-[16px] border p-4",
                r.read_at ? "border-border bg-card" : "border-primary/25 bg-primary/[0.04]",
              )}
            >
              {r.link ? (
                <Link to={r.link} className="block">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
