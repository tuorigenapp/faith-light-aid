import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, CalendarClock, Check, HeartHandshake, Lock, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { graceState, longDate, type GraceRow } from "@/lib/grace";
import { confirmDeletion } from "@/lib/deletion-confirmation";
import { cn } from "@/lib/utils";

type Tab = "gracia" | "cancelaciones" | "cambios";

/** Control de calidad: período de gracia, cancelaciones con motivo y cambios de plan. */
export function RetentionManager() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("gracia");
  const q = useQuery({
    queryKey: ["admin-retention"],
    queryFn: async () => {
      const [g, c, p] = await Promise.all([
        supabase.from("grace_periods").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("cancellation_surveys").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("plan_change_requests").select("*").order("created_at", { ascending: false }).limit(300),
      ]);
      const ids = [...new Set([...(g.data ?? []), ...(c.data ?? []), ...(p.data ?? [])].map((r) => r.user_id))];
      const prof = ids.length ? (await supabase.from("profiles").select("id, display_name, full_name, email").in("id", ids)).data ?? [] : [];
      return { grace: (g.data ?? []) as GraceRow[], cancels: c.data ?? [], changes: p.data ?? [], prof: new Map(prof.map((x) => [x.id, x])) };
    },
  });
  const who = (id: string) => {
    const p = q.data?.prof.get(id);
    return { name: p?.display_name || p?.full_name || "Sin nombre", email: p?.email || id.slice(0, 8) };
  };
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-retention"] });

  const setGrace = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("grace_periods").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Período actualizado"); refresh(); },
    onError: () => toast.error("No pudimos actualizar el período"),
  });
  const markChange = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plan_change_requests").update({ status: "done" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cambio marcado como hecho"); refresh(); },
  });

  const grace = q.data?.grace ?? [];
  const counts = useMemo(() => {
    const st = grace.map((r) => graceState(r).kind);
    return { req: st.filter((k) => k === "requested").length, act: st.filter((k) => k === "active").length, lock: st.filter((k) => k === "locked").length };
  }, [grace]);
  const finals = (q.data?.cancels ?? []).filter((c) => c.kind !== "grace");

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={HeartHandshake} label="Solicitudes de gracia" value={counts.req} />
        <Stat icon={CalendarClock} label="En período 7/14 días" value={counts.act} />
        <Stat icon={Lock} label="Bloqueados por pago" value={counts.lock} />
        <Stat icon={XCircle} label="Cancelaciones" value={finals.length} />
      </div>
      <div role="tablist" className="flex gap-2 overflow-x-auto">
        {([["gracia", "Período de gracia"], ["cancelaciones", "Cancelaciones y motivos"], ["cambios", "Cambios de plan"]] as const).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("h-10 shrink-0 rounded-full px-4 text-sm font-semibold", tab === id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>{l}</button>
        ))}
      </div>
      {q.isLoading && <div className="h-40 animate-pulse rounded-[16px] bg-muted" />}

      {tab === "gracia" && !q.isLoading && (
        <div className="space-y-2">
          {grace.length === 0 && <Empty text="Nadie ha pedido período de gracia todavía." />}
          {grace.map((r) => {
            const s = graceState(r);
            const u = who(r.user_id);
            return (
              <article key={r.id} className="rounded-[16px] border border-border/60 bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><p className="font-bold">{u.name}</p><p className="text-xs text-muted-foreground">{u.email} · {r.from_plan ?? "sin plan"}</p></div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", s.kind === "locked" ? "bg-destructive/10 text-destructive" : s.kind === "active" ? (s.warn ? "bg-warning/20 text-foreground" : "bg-primary/10 text-primary") : "bg-muted text-foreground")}>
                    {s.kind === "requested" ? "Pendiente" : s.kind === "active" ? `Día ${s.day} de ${r.days}` : s.kind === "locked" ? `Bloqueado · borra el ${longDate(s.purgeAt)}` : r.status}
                  </span>
                </div>
                <p className="mt-2 rounded-[10px] bg-muted/60 p-2 text-sm">«{r.reason}»</p>
                {r.ends_at && <p className="mt-1 text-xs text-muted-foreground">Termina el {longDate(new Date(r.ends_at))}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Btn onClick={() => setGrace.mutate({ id: r.id, patch: { status: "active", days: 7, starts_at: new Date().toISOString() } })}>Dar 7 días</Btn>
                  <Btn onClick={() => setGrace.mutate({ id: r.id, patch: { status: "active", days: 14, starts_at: new Date().toISOString() } })}>Dar 14 días</Btn>
                  <Btn tone="green" onClick={() => setGrace.mutate({ id: r.id, patch: { status: "resolved" } })}>Pagó · quitar bloqueo</Btn>
                  <button aria-label="Eliminar registro" onClick={async () => { if (await confirmDeletion(`Se eliminará el período de gracia de ${u.name}.`)) { await supabase.from("grace_periods").delete().eq("id", r.id); refresh(); } }} className="grid h-10 w-10 place-items-center rounded-[10px] bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === "cancelaciones" && !q.isLoading && (
        <div className="space-y-2">
          {(q.data?.cancels ?? []).length === 0 && <Empty text="Sin cancelaciones registradas." />}
          {(q.data?.cancels ?? []).map((c) => {
            const u = who(c.user_id);
            return (
              <article key={c.id} className="rounded-[16px] border border-border/60 bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-bold">{u.name}</p><p className="text-xs text-muted-foreground">{u.email} · {c.from_plan ?? "sin plan"} · {new Date(c.created_at).toLocaleDateString("es")}</p></div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", c.kind === "grace" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>{c.kind === "grace" ? "Pidió gracia" : "Cancelación definitiva"}</span>
                </div>
                <p className="mt-2 text-sm font-semibold">{c.reason}</p>
                {c.comment && <p className="mt-1 rounded-[10px] bg-muted/60 p-2 text-sm">«{c.comment}»</p>}
              </article>
            );
          })}
        </div>
      )}

      {tab === "cambios" && !q.isLoading && (
        <div className="space-y-2">
          {(q.data?.changes ?? []).length === 0 && <Empty text="Nadie ha pedido cambio de plan." />}
          {(q.data?.changes ?? []).map((c) => {
            const u = who(c.user_id);
            const Up = c.direction === "up" ? ArrowUpCircle : ArrowDownCircle;
            return (
              <article key={c.id} className="flex flex-wrap items-center gap-3 rounded-[16px] border border-border/60 bg-card p-4">
                <Up className={cn("h-6 w-6", c.direction === "up" ? "text-primary" : "text-muted-foreground")} />
                <div className="min-w-0 flex-1"><p className="font-bold">{u.name}</p><p className="text-xs text-muted-foreground">{u.email} · {c.from_plan ?? "sin plan"} → <b>{c.to_plan}</b> ({c.direction === "up" ? "superior" : "inferior"})</p></div>
                {c.status === "done" ? <span className="flex items-center gap-1 text-xs font-bold text-primary"><Check className="h-4 w-4" />Hecho</span> : <Btn onClick={() => markChange.mutate(c.id)}>Marcar hecho</Btn>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Lock; label: string; value: number }) {
  return <div className="rounded-[16px] border border-border/60 bg-card p-3"><Icon className="h-5 w-5 text-primary" /><p className="mt-1 font-display text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}
function Btn({ children, onClick, tone }: { children: React.ReactNode; onClick: () => void; tone?: "green" }) {
  return <button onClick={onClick} className={cn("h-10 rounded-[10px] px-3 text-sm font-semibold", tone === "green" ? "bg-cta-green text-cta-green-foreground" : "bg-primary/10 text-primary")}>{children}</button>;
}
function Empty({ text }: { text: string }) {
  return <p className="rounded-[16px] bg-muted/60 p-6 text-center text-sm text-muted-foreground">{text}</p>;
}
