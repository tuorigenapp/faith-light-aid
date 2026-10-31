import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Clock, Hourglass, Lock, Mail, ReceiptText, Send, ShieldCheck, ShoppingBag, Sparkles, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { HOJA_PACKS, HOJA_PACK_HERO, usd, type HojaPack } from "@/lib/hojas";
import { formatHojas } from "@/lib/gems";
import { useServerFn } from "@tanstack/react-start";
import { createPurchaseRequest } from "@/lib/wallet.functions";
import { Camera, Loader2 } from "lucide-react";
import crystals from "@/assets/hojas-crystals.png";
import treePng from "@/assets/hojas-tree.png";
import { PayPalCheckout } from "@/components/PayPalCheckout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/comprarmonedas")({
  head: () => ({
    meta: [
      { title: "Recarga de Hojas de Sanación — ORIGEN" },
      { name: "description", content: "Recarga tus Hojas de Sanación, elige tu paquete, paga seguro y revisa tu historial de transacciones en ORIGEN." },
      { property: "og:title", content: "Recarga de Hojas de Sanación — ORIGEN" },
      { property: "og:description", content: "Cada hoja te acerca más a tu sanación, tu verdad y tu propósito." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HojasFlow,
});

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

function HojasFlow() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [pack, setPack] = useState<HojaPack | null>(null);
  const [paymentRef, setPaymentRef] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile-hojas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("gems, display_name, full_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
  const hojas = formatHojas(profile?.gems);

  const { data: tx = [], refetch } = useQuery({
    queryKey: ["hoja-tx", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [gems, requests, transfers] = await Promise.all([
        supabase.from("gem_transactions").select("id, amount, reason, meta, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(40),
        supabase.from("purchase_requests").select("id, hojas, usd, status, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(40),
        supabase.from("hoja_transfers").select("id, to_email, points, status, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(40),
      ]);
      const rows: Tx[] = [];
      (requests.data ?? []).forEach((p) =>
        rows.push({
          id: `pr-${p.id}`,
          amount: p.hojas,
          reason: "Recarga de hojas",
          meta: { kind: "compra", status: p.status, hojas: p.hojas, usd: Number(p.usd) },
          created_at: p.created_at,
        }),
      );
      (transfers.data ?? []).forEach((t) =>
        rows.push({
          id: `tr-${t.id}`,
          amount: -Math.floor(t.points / 100),
          reason: `Envío a ${t.to_email}`,
          meta: { kind: "transferencia", status: t.status, hojas: -Math.floor(t.points / 100) },
          created_at: t.created_at,
        }),
      );
      (gems.data ?? [])
        .filter((g) => !String(g.reason ?? "").startsWith("compra:"))
        .forEach((g) => rows.push({ id: g.id, amount: g.amount, reason: g.reason, meta: g.meta, created_at: g.created_at }));
      return rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 80);
    },
  });

  const paymentApproved = useCallback((orderId: string) => {
    setPaymentRef(orderId);
    setStep(4);
  }, []);

  async function afterReceipt() {
    setStep(5);
    qc.invalidateQueries({ queryKey: ["hoja-tx"] });
    refetch();
  }

  function back() {
    if (step === 1) { navigate({ to: "/arbol" }); return; }
    setStep((s) => (s === 6 || s === 7 ? 1 : ((s - 1) as Step)));
  }

  return (
    <div className="min-h-dvh" style={{ background: "radial-gradient(120% 90% at 50% 0%, #F3ECFF 0%, #FBFAFF 55%, #FDEEF7 100%)" }}>
      <div className="mx-auto w-full max-w-[420px] px-4 pt-4 pb-32">
        {/* top bar */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <button onClick={back} aria-label="Volver" className="w-10 h-10 shrink-0 rounded-full bg-card shadow-[0_1px_3px_rgba(30,25,20,.06)] grid place-items-center text-primary active:scale-95 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 text-center">
            <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">Hojas de Sanación</div>
            <div className="truncate font-display font-bold text-[15px] text-foreground">{hojas} hojas 🍃</div>
          </div>
          <button onClick={() => setStep(6)} aria-label="Historial" className={cn("w-10 h-10 shrink-0 rounded-full grid place-items-center transition active:scale-95", step === 6 ? "bg-[#7C5CFF] text-white" : "bg-card text-primary shadow-[0_1px_3px_rgba(30,25,20,.06)]")}>
            <Clock className="w-5 h-5" />
          </button>
        </div>

        <div key={step} className="mt-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {step === 1 && <StepPacks pack={pack} onPick={(p) => { setPack(p); setStep(2); }} onConfirm={() => setStep(7)} />}
          {step === 2 && pack && <StepSummary pack={pack} onNext={() => setStep(3)} />}
          {step === 3 && pack && user && <StepPay pack={pack} userId={user.id} onPaid={paymentApproved} onConfirm={() => setStep(4)} />}
          {step === 4 && pack && <StepReceipt pack={pack} paymentRef={paymentRef} onDone={afterReceipt} />}
          {step === 5 && pack && <StepProcessing pack={pack} onDone={() => setStep(6)} />}
          {step === 6 && <StepHistory tx={tx} />}
          {step === 7 && <ConfirmPack onPick={(p) => { setPack(p); setPaymentRef(""); setStep(4); }} />}
        </div>

        {step !== 6 && <Dots active={step} />}
        {step === 1 && <Rules />}
        <p className="mt-6 text-center text-[13px] leading-snug text-muted-foreground">
          <span className="text-[#F58BCB]">♥</span> Cada hoja te acerca más a tu sanación, tu verdad y tu propósito.
          <br /><span className="font-semibold text-primary">Tú puedes. Estamos contigo.</span>
        </p>
      </div>
    </div>
  );
}

/* ───────── shared ───────── */

function Dots({ active }: { active: number }) {
  return (
    <div className="mt-7 flex items-center justify-center gap-2" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("h-2 rounded-full transition-all", i === Math.min(active, 5) ? "w-6 bg-[#F58BCB]" : "w-2 bg-[#E4DEF6]")} />
      ))}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[16px] bg-card border border-border p-5 shadow-[0_1px_3px_rgba(30,25,20,.06)]", className)}>
      {children}
    </div>
  );
}

function Title({ eyebrow, title, sub }: { eyebrow?: string; title: React.ReactNode; sub?: string }) {
  return (
    <div>
      {eyebrow && <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary">{eyebrow}</p>}
      <h1 className="mt-1 font-display font-extrabold text-[28px] leading-[1.15] text-foreground">{title}</h1>
      {sub && <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}

function CTA({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full h-14 rounded-[12px] text-white font-display font-bold text-[16px] inline-flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[.98] transition"
      style={{ background: "linear-gradient(180deg,#8F6BFF 0%,#F58BCB 100%)", boxShadow: "0 4px 14px rgba(124,92,255,.30)" }}>
      {children}
    </button>
  );
}

/* ───────── 2 · Selecciona tu paquete ───────── */

function StepPacks({ pack, onPick, onConfirm }: { pack: HojaPack | null; onPick: (p: HojaPack) => void; onConfirm: () => void }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <Title eyebrow="Paso 1 · Paquetes" title={<>Selecciona tu paquete<br /><span className="text-primary">de Hojas 🍃</span></>} sub="Elige la cantidad que mejor se adapte a ti." />
        </div>
        <img src={crystals} alt="" aria-hidden loading="lazy" width={1024} height={1024} className="w-20 h-20 shrink-0 object-contain drop-shadow-[0_10px_22px_rgba(124,92,255,.25)]" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {HOJA_PACKS.map((p) => {
          const on = pack?.id === p.id;
          return (
            <button key={p.id} onClick={() => onPick(p)}
              className={cn("relative rounded-[16px] bg-card p-4 text-center transition active:scale-[.97]",
                on ? "border-2 border-[#F58BCB] shadow-[0_4px_14px_rgba(245,139,203,.28)]" : "border border-border shadow-[0_1px_3px_rgba(30,25,20,.06)]")}>
              {on && (
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#F58BCB] text-white grid place-items-center shadow">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
              <div className="font-display font-extrabold text-[19px] text-foreground leading-none">
                {p.hojas.toLocaleString()} <span className="text-[13px] font-semibold text-muted-foreground">hojas</span>
              </div>
              <div className="mt-1 text-[13px] font-semibold text-foreground">{usd(p.usd)}</div>
              {p.tag === "especial" && <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#3FBE8F]">Oferta especial</div>}
            </button>
          );
        })}
      </div>

      <button onClick={() => onPick(HOJA_PACK_HERO)}
        className="mt-3 w-full rounded-[16px] p-4 text-left text-white relative overflow-hidden active:scale-[.98] transition"
        style={{ background: "linear-gradient(135deg,#8F6BFF 0%,#F58BCB 100%)", boxShadow: "0 4px 14px rgba(124,92,255,.30)" }}>
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-card/20 rounded-full px-2 py-0.5">
              <Sparkles className="w-3 h-3" /> Más popular
            </div>
            <div className="mt-1.5 font-display font-black text-[24px] leading-none">10,000 <span className="text-[14px]">hojas</span></div>
            <div className="text-[15px] font-semibold">3,500 USD</div>
            <div className="text-[10px] font-black uppercase tracking-wider opacity-90 mt-0.5">Oferta súper especial</div>
          </div>
          <img src={crystals} alt="" aria-hidden loading="lazy" width={1024} height={1024} className="ml-auto w-24 h-24 shrink-0 object-contain" />
        </div>
      </button>

      <Button type="button" variant="outline" onClick={onConfirm} className="mt-4 min-h-[52px] w-full rounded-[12px] border-primary/25 bg-card text-[15px] font-bold text-primary">
        <ReceiptText className="h-5 w-5" /> Confirmar un pago realizado
      </Button>
      <p className="mt-2 text-center text-[12.5px] leading-relaxed text-muted-foreground">Úsalo si ya pagaste y la página se cerró antes de enviar tu comprobante.</p>
    </div>
  );
}

/* ───────── 3 · Resumen de compra ───────── */

function StepSummary({ pack, onNext }: { pack: HojaPack; onNext: () => void }) {
  return (
    <div>
      <Title eyebrow="Paso 2 · Resumen" title="Resumen de tu compra" sub="Revisa los detalles antes de continuar." />
      <div className="mt-4 grid place-items-center">
        <img src={crystals} alt="Hojas de Sanación ORÍGEN" loading="lazy" width={1024} height={1024}
          className="w-40 h-40 object-contain drop-shadow-[0_14px_30px_rgba(124,92,255,.28)] animate-[floaty_6s_ease-in-out_infinite]" />
      </div>

      <Card className="mt-4">
        <div className="text-center">
          <div className="text-[12px] text-muted-foreground font-semibold">Paquete seleccionado</div>
          <div className="mt-1 font-display font-black text-[30px] text-[#F58BCB] leading-none">{pack.hojas.toLocaleString()} hojas</div>
        </div>
        <div className="mt-4 space-y-2.5 text-[14px]">
          <Row label="Cantidad de hojas" value={pack.hojas.toLocaleString()} />
          <Row label="Precio" value={usd(pack.usd)} />
          <div className="h-px bg-[#1B1B27]/[0.08]" />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Total a pagar</span>
            <span className="font-display font-black text-[#F58BCB] text-[16px]">{usd(pack.usd)}</span>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
        <span className="w-9 h-9 rounded-[10px] bg-[#3FBE8F]/10 grid place-items-center text-[#3FBE8F] shrink-0"><ShieldCheck className="w-4 h-4" /></span>
        Pago 100% seguro y encriptado.
      </div>

      <div className="mt-5"><CTA onClick={onNext}>Continuar al pago <ArrowRight className="w-4 h-4" /></CTA></div>
      <style>{`@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

/* ───────── 4 · Pago seguro ───────── */

function StepPay({ pack, userId, onPaid, onConfirm }: { pack: HojaPack; userId: string; onPaid: (orderId: string) => void; onConfirm: () => void }) {
  return (
    <div>
      <Title eyebrow="Paso 3 · Pago" title="Paga con PayPal" sub="Completa todo sin salir de ORÍGEN. También puede aparecer la opción de tarjeta según tu país." />
      <div className="mt-5"><PayPalCheckout pack={pack} userId={userId} onPaid={onPaid} /></div>
      <Button type="button" variant="ghost" onClick={onConfirm} className="mt-3 min-h-12 w-full rounded-[10px] text-[14px] font-bold text-primary">
        <ReceiptText className="h-4 w-4" /> Ya pagué: confirmar pago
      </Button>
    </div>
  );
}

/* ───────── 5 · Procesando tu compra ───────── */

function StepProcessing({ pack, onDone }: { pack: HojaPack; onDone: () => void }) {
  const [pct, setPct] = useState(8);
  useEffect(() => {
    const id = setInterval(() => setPct((p) => (p >= 65 ? 65 : p + 3)), 90);
    return () => clearInterval(id);
  }, []);
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div className="text-center">
      <Title title={<>Procesando<br />tu compra… <span className="text-[#3FBE8F]">🍃</span></>} sub="Estamos verificando tu pago para proteger a nuestra comunidad." />
      <div className="mt-6 relative grid place-items-center">
        <svg width="150" height="150" viewBox="0 0 150 150" className="-rotate-90">
          <circle cx="75" cy="75" r={R} fill="none" stroke="#EDE7FB" strokeWidth="12" />
          <circle cx="75" cy="75" r={R} fill="none" stroke="#F58BCB" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100} style={{ transition: "stroke-dashoffset .3s ease" }} />
        </svg>
        <span className="absolute font-display font-black text-[34px] text-primary tabular-nums">{pct}%</span>
      </div>

      <div className="mt-5 rounded-[12px] bg-[#7C5CFF]/[0.07] border border-[#7C5CFF]/15 px-4 py-3 text-[13px] font-semibold text-primary">
        El proceso manual puede tardar entre 24 y 72 horas laborables.
      </div>

      <div className="mt-5 text-left space-y-3">
        <Timeline done label="Pago recibido" />
        <Timeline current label="En revisión" />
        <Timeline label="Aprobación pendiente" />
        <Timeline label={`${pack.hojas.toLocaleString()} hojas disponibles`} />
      </div>

      <div className="mt-6"><CTA onClick={onDone}>Ver historial de transacciones <ArrowRight className="w-4 h-4" /></CTA></div>
    </div>
  );
}

function Timeline({ label, done, current }: { label: string; done?: boolean; current?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("w-6 h-6 rounded-full grid place-items-center shrink-0 border-2",
        done ? "bg-[#3FBE8F] border-[#3FBE8F] text-white" : current ? "border-[#F58BCB] bg-card" : "border-[#D9D5EA] bg-card")}>
        {done ? <Check className="w-3.5 h-3.5" /> : current ? <span className="w-2 h-2 rounded-full bg-[#F58BCB]" /> : null}
      </span>
      <span className={cn("text-[14px]", done ? "font-semibold text-foreground" : current ? "font-semibold text-[#F58BCB]" : "text-muted-foreground")}>{label}</span>
      {current && <span className="flex-1 h-[2px] rounded-full bg-gradient-to-r from-[#F58BCB] to-transparent" />}
    </div>
  );
}

/* ───────── 6 · Historial de transacciones ───────── */

type Tx = { id: string; amount: number; reason: string; meta: unknown; created_at: string };

function StepHistory({ tx }: { tx: Tx[] }) {
  const [tab, setTab] = useState<"todas" | "compras" | "transferencias">("todas");

  const rows = tx.map((t) => {
    const meta = (t.meta ?? {}) as Record<string, unknown>;
    const kind = (meta.kind as string) ?? (t.amount < 0 ? "transferencia" : "movimiento");
    const status = (meta.status as string) ?? "aprobada";
    const hojas = (meta.hojas as number) ?? t.amount;
    const price = meta.usd as number | undefined;
    return { id: t.id, kind, status, hojas, price, reason: t.reason, date: new Date(t.created_at) };
  }).filter((r) => (tab === "todas" ? true : tab === "compras" ? r.kind === "compra" : r.kind === "transferencia"));

  return (
    <div>
      <Title title={<>Historial de<br />transacciones <span className="text-[#3FBE8F]">🍃</span></>} sub="Consulta tus compras, transferencias y estados en todo momento." />

      <div className="mt-5 grid grid-cols-3 rounded-[12px] bg-card border border-border p-1">
        {(["todas", "compras", "transferencias"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("h-9 rounded-[10px] text-[12.5px] font-bold capitalize transition", tab === t ? "bg-[#F58BCB]/12 text-[#F58BCB]" : "text-muted-foreground")}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 && (
          <Card className="text-center">
            <img src={treePng} alt="" aria-hidden loading="lazy" width={1024} height={1024} className="w-28 h-28 mx-auto object-contain" />
            <div className="font-display font-bold text-[16px] text-foreground">Tu historial comienza hoy</div>
            <p className="mt-1 text-[13px] text-muted-foreground">Cuando recargues o transfieras hojas, verás cada movimiento aquí.</p>
          </Card>
        )}
        {rows.map((r) => (
          <div key={r.id} className="rounded-[16px] bg-card border border-border p-4 shadow-[0_1px_3px_rgba(30,25,20,.06)] grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <span className="w-10 h-10 rounded-[10px] bg-[#7C5CFF]/10 grid place-items-center shrink-0 text-primary">
              {r.kind === "transferencia" ? <Send className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </span>
            <div className="min-w-0">
              <div className="font-display font-bold text-[15px] text-foreground truncate">
                {r.hojas > 0 ? `${r.hojas.toLocaleString()} hojas` : `${r.hojas.toLocaleString()} hojas`}
              </div>
              <div className="text-[12px] text-muted-foreground truncate">{r.reason}</div>
              <div className="text-[11px] text-[#9A97AC] mt-0.5">
                {r.date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })} · {r.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={cn("inline-block rounded-full px-2.5 py-1 text-[11px] font-black",
                r.status === "pendiente" || r.status === "revision" ? "bg-[#F7B955]/15 text-[#B77B12]"
                  : r.status === "rechazada" ? "bg-[#E05A5A]/15 text-[#B13636]"
                  : "bg-[#3FBE8F]/15 text-[#2FA574]")}>
                {r.status === "pendiente" ? "Pendiente" : r.status === "revision" ? "En revisión" : r.status === "rechazada" ? "No aprobada" : "Aprobada"}
              </span>
              <div className="mt-1 text-[13px] font-semibold text-foreground">{r.price !== undefined ? usd(r.price) : "—"}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[12px] bg-[#7C5CFF]/[0.07] border border-[#7C5CFF]/15 px-4 py-3 flex items-center gap-3 text-[13px] font-semibold text-primary">
        <Mail className="w-4 h-4 shrink-0" /> Las hojas pueden transferirse por correo electrónico.
      </div>
    </div>
  );
}

/* ───────── Reglas importantes ───────── */

const RULES = [
  { icon: Mail, text: "Las hojas pueden transferirse a otro usuario a través de su correo electrónico." },
  { icon: UserCheck, text: "Cada compra, transferencia o registro será revisado y aprobado manualmente." },
  { icon: Hourglass, text: "El saldo permanecerá en estado Pendiente hasta ser aprobado." },
  { icon: Clock, text: "La aprobación puede tardar entre 24 y 72 horas laborables." },
  { icon: Lock, text: "Una vez aprobado el pago, las hojas aparecerán disponibles para su uso." },
];

function Rules() {
  return (
    <Card className="mt-7">
      <div className="flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h2 className="text-[12px] uppercase tracking-[0.18em] font-black text-primary">Reglas importantes</h2>
      </div>
      <div className="mt-4 space-y-3">
        {RULES.map((r, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-[10px] bg-[#7C5CFF]/10 grid place-items-center shrink-0 text-primary">
              <r.icon className="w-4 h-4" />
            </span>
            <p className="text-[13px] leading-snug text-muted-foreground">{r.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ConfirmPack({ onPick }: { onPick: (pack: HojaPack) => void }) {
  const packs = [...HOJA_PACKS, HOJA_PACK_HERO];
  return (
    <div>
      <Title eyebrow="Confirmar pago" title="¿Qué paquete pagaste?" sub="Selecciona el paquete exacto y luego adjunta nuevamente tu comprobante." />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {packs.map((item) => (
          <Button key={item.id} type="button" variant="outline" onClick={() => onPick(item)} className="h-auto min-h-[76px] flex-col rounded-[12px] border-border bg-card px-3 py-3">
            <span className="font-display text-[17px] font-bold text-foreground">{item.hojas.toLocaleString()} hojas</span>
            <span className="text-[12.5px] text-muted-foreground">{usd(item.usd)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function StepReceipt({ pack, paymentRef, onDone }: { pack: HojaPack; paymentRef: string; onDone: () => void }) {
  const { user } = useAuth();
  const send = useServerFn(createPurchaseRequest);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit() {
    if (!user) return;
    if (!file) return setError("Agrega la foto de tu pago para continuar.");
    setBusy(true);
    setError(null);
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
    const path = `${user.id}/${Date.now()}.${ext}`;
    const up = await supabase.storage.from("payment-receipts").upload(path, file, { upsert: false });
    if (up.error) {
      setBusy(false);
      setError("No pudimos subir la foto. Inténtalo otra vez.");
      return;
    }
    try {
      await send({
        data: {
          packId: pack.id,
          hojas: pack.hojas,
          usd: pack.usd,
          method: "paypal",
          receiptPath: path,
          userMessage: [paymentRef ? `Orden PayPal: ${paymentRef}` : "Confirmación manual de pago PayPal", message].filter(Boolean).join(" · "),
        },
      });
      onDone();
    } catch {
      setError("No pudimos enviar tu comprobante. Inténtalo otra vez.");
    }
    setBusy(false);
  }

  return (
    <section className="rounded-[16px] bg-card p-5 shadow-[0_1px_3px_rgba(30,25,20,.06)]">
      <h2 className="font-display text-[22px] font-bold leading-tight text-foreground">Confirmar pago</h2>
      <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
        Adjunta la captura o foto del comprobante de {usd(pack.usd)} por {pack.hojas} hojas. Lo revisamos y te avisamos aquí mismo.
      </p>

      <label className="mt-4 grid min-h-[132px] cursor-pointer place-items-center gap-2 rounded-[16px] border-2 border-dashed border-[#CEBDD8] bg-[#FBFAFF] p-4 text-center">
        {preview ? (
          <img src={preview} alt="Comprobante elegido" className="max-h-44 rounded-[12px] object-contain" />
        ) : (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-[#7C5CFF]/10 text-primary">
              <Camera className="h-5 w-5" />
            </span>
            <span className="text-[14px] font-bold text-foreground">Tocar para elegir la foto</span>
            <span className="text-[12.5px] text-muted-foreground">Captura de la transferencia o del pago</span>
          </>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </label>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="¿Quieres contarnos algo del pago? (opcional)"
        className="mt-3 min-h-20 w-full rounded-[10px] border-[1.5px] border-[#CEBDD8] bg-card px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-[#7C5CFF] focus:outline-none"
      />

      {error && <p className="mt-3 text-[13px] font-semibold text-[#C2415A]">{error}</p>}

      <button
        onClick={submit}
        disabled={busy}
        className="mt-4 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#7C5CFF] text-[17px] font-bold text-white shadow-[0_4px_14px_rgba(124,92,255,.28)] transition active:scale-[.97] disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
        Confirmar pago
      </button>
      <p className="mt-2 text-center text-[12.5px] text-muted-foreground">Tu foto es privada, solo la ve el equipo de ORÍGEN.</p>
    </section>
  );
}
