import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Clock, Hourglass, Lock, Mail, Send, ShieldCheck, ShoppingBag, Sparkles, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { HOJA_PACKS, HOJA_PACK_HERO, PAY_METHODS, usd, type HojaPack } from "@/lib/hojas";
import { formatHojas } from "@/lib/gems";
import { useServerFn } from "@tanstack/react-start";
import { createPurchaseRequest } from "@/lib/wallet.functions";
import { Camera, Loader2 } from "lucide-react";
import crystals from "@/assets/hojas-crystals.png";
import treePng from "@/assets/hojas-tree.png";

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

type Step = 1 | 2 | 3 | 4 | 5 | 6;

function HojasFlow() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [pack, setPack] = useState<HojaPack | null>(null);
  const [method, setMethod] = useState<string>("stripe");

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
      const { data } = await supabase
        .from("gem_transactions")
        .select("id, amount, reason, meta, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(40);
      return data ?? [];
    },
  });

  function submitOrder() {
    if (!user || !pack) return;
    setStep(4);
  }

  async function afterReceipt() {
    setStep(5);
    qc.invalidateQueries({ queryKey: ["hoja-tx"] });
    refetch();
  }

  function back() {
    if (step === 1) { navigate({ to: "/arbol" }); return; }
    setStep((s) => (s === 6 ? 1 : ((s - 1) as Step)));
  }

  return (
    <div className="min-h-dvh" style={{ background: "radial-gradient(120% 90% at 50% 0%, #F3ECFF 0%, #FBFAFF 55%, #FDEEF7 100%)" }}>
      <div className="mx-auto w-full max-w-[420px] px-4 pt-4 pb-32">
        {/* top bar */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <button onClick={back} aria-label="Volver" className="w-10 h-10 shrink-0 rounded-full bg-white shadow-[0_1px_3px_rgba(30,25,20,.06)] grid place-items-center text-[#7C5CFF] active:scale-95 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 text-center">
            <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#7C5CFF]">Hojas de Sanación</div>
            <div className="truncate font-display font-bold text-[15px] text-[#1B1B27]">{hojas} hojas 🍃</div>
          </div>
          <button onClick={() => setStep(6)} aria-label="Historial" className={cn("w-10 h-10 shrink-0 rounded-full grid place-items-center transition active:scale-95", step === 6 ? "bg-[#7C5CFF] text-white" : "bg-white text-[#7C5CFF] shadow-[0_1px_3px_rgba(30,25,20,.06)]")}>
            <Clock className="w-5 h-5" />
          </button>
        </div>

        <div key={step} className="mt-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {step === 1 && <StepPacks pack={pack} onPick={(p) => { setPack(p); setStep(2); }} />}
          {step === 2 && pack && <StepSummary pack={pack} onNext={() => setStep(3)} />}
          {step === 3 && pack && <StepPay pack={pack} method={method} setMethod={setMethod} onPay={submitOrder} />}
          {step === 4 && pack && <StepReceipt pack={pack} method={method} onDone={afterReceipt} />}
          {step === 5 && pack && <StepProcessing pack={pack} onDone={() => setStep(6)} />}
          {step === 6 && <StepHistory tx={tx} />}
        </div>

        {step !== 6 && <Dots active={step} />}
        {step === 1 && <Rules />}
        <p className="mt-6 text-center text-[13px] leading-snug text-[#64667A]">
          <span className="text-[#F58BCB]">♥</span> Cada hoja te acerca más a tu sanación, tu verdad y tu propósito.
          <br /><span className="font-semibold text-[#7C5CFF]">Tú puedes. Estamos contigo.</span>
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
    <div className={cn("rounded-[16px] bg-white border border-[#1B1B27]/[0.08] p-5 shadow-[0_1px_3px_rgba(30,25,20,.06)]", className)}>
      {children}
    </div>
  );
}

function Title({ eyebrow, title, sub }: { eyebrow?: string; title: React.ReactNode; sub?: string }) {
  return (
    <div>
      {eyebrow && <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#7C5CFF]">{eyebrow}</p>}
      <h1 className="mt-1 font-display font-extrabold text-[28px] leading-[1.15] text-[#1B1B27]">{title}</h1>
      {sub && <p className="mt-2 text-[14px] leading-relaxed text-[#64667A]">{sub}</p>}
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

function StepPacks({ pack, onPick }: { pack: HojaPack | null; onPick: (p: HojaPack) => void }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <Title eyebrow="Paso 1 · Paquetes" title={<>Selecciona tu paquete<br /><span className="text-[#7C5CFF]">de Hojas 🍃</span></>} sub="Elige la cantidad que mejor se adapte a ti." />
        </div>
        <img src={crystals} alt="" aria-hidden loading="lazy" width={1024} height={1024} className="w-20 h-20 shrink-0 object-contain drop-shadow-[0_10px_22px_rgba(124,92,255,.25)]" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {HOJA_PACKS.map((p) => {
          const on = pack?.id === p.id;
          return (
            <button key={p.id} onClick={() => onPick(p)}
              className={cn("relative rounded-[16px] bg-white p-4 text-center transition active:scale-[.97]",
                on ? "border-2 border-[#F58BCB] shadow-[0_4px_14px_rgba(245,139,203,.28)]" : "border border-[#1B1B27]/[0.08] shadow-[0_1px_3px_rgba(30,25,20,.06)]")}>
              {on && (
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#F58BCB] text-white grid place-items-center shadow">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
              <div className="font-display font-extrabold text-[19px] text-[#1B1B27] leading-none">
                {p.hojas.toLocaleString()} <span className="text-[13px] font-semibold text-[#64667A]">hojas</span>
              </div>
              <div className="mt-1 text-[13px] font-semibold text-[#1B1B27]">{usd(p.usd)}</div>
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
            <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/20 rounded-full px-2 py-0.5">
              <Sparkles className="w-3 h-3" /> Más popular
            </div>
            <div className="mt-1.5 font-display font-black text-[24px] leading-none">10,000 <span className="text-[14px]">hojas</span></div>
            <div className="text-[15px] font-semibold">3,500 USD</div>
            <div className="text-[10px] font-black uppercase tracking-wider opacity-90 mt-0.5">Oferta súper especial</div>
          </div>
          <img src={crystals} alt="" aria-hidden loading="lazy" width={1024} height={1024} className="ml-auto w-24 h-24 shrink-0 object-contain" />
        </div>
      </button>
    </div>
  );
}

/* ───────── 3 · Resumen de compra ───────── */

function StepSummary({ pack, onNext }: { pack: HojaPack; onNext: () => void }) {
  return (
    <div>
      <Title eyebrow="Paso 2 · Resumen" title="Resumen de tu compra" sub="Revisa los detalles antes de continuar." />
      <div className="mt-4 grid place-items-center">
        <img src={crystals} alt="Cristales de sanación" loading="lazy" width={1024} height={1024}
          className="w-40 h-40 object-contain drop-shadow-[0_14px_30px_rgba(124,92,255,.28)] animate-[floaty_6s_ease-in-out_infinite]" />
      </div>

      <Card className="mt-4">
        <div className="text-center">
          <div className="text-[12px] text-[#64667A] font-semibold">Paquete seleccionado</div>
          <div className="mt-1 font-display font-black text-[30px] text-[#F58BCB] leading-none">{pack.hojas.toLocaleString()} hojas</div>
        </div>
        <div className="mt-4 space-y-2.5 text-[14px]">
          <Row label="Cantidad de hojas" value={pack.hojas.toLocaleString()} />
          <Row label="Precio" value={usd(pack.usd)} />
          <div className="h-px bg-[#1B1B27]/[0.08]" />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#1B1B27]">Total a pagar</span>
            <span className="font-display font-black text-[#F58BCB] text-[16px]">{usd(pack.usd)}</span>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-[#64667A]">
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
      <span className="text-[#64667A]">{label}</span>
      <span className="font-semibold text-[#1B1B27]">{value}</span>
    </div>
  );
}

/* ───────── 4 · Pago seguro ───────── */

function StepPay({ pack, method, setMethod, onPay }: { pack: HojaPack; method: string; setMethod: (s: string) => void; onPay: () => void }) {
  return (
    <div>
      <Title eyebrow="Paso 3 · Pago" title={<>Pago seguro <span className="text-[#F58BCB]">🔐</span></>} sub="Elige tu método de pago favorito." />
      <div className="mt-5 space-y-3">
        {PAY_METHODS.map((m) => {
          const on = method === m.id;
          return (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={cn("w-full h-14 px-4 rounded-[12px] bg-white flex items-center gap-3 transition active:scale-[.98]",
                on ? "border-2 border-[#F58BCB]" : "border border-[#1B1B27]/[0.08]")}>
              <span className={cn("w-5 h-5 rounded-full border-2 grid place-items-center shrink-0", on ? "border-[#F58BCB]" : "border-[#C9C6DA]")}>
                {on && <span className="w-2.5 h-2.5 rounded-full bg-[#F58BCB]" />}
              </span>
              <span className="min-w-0 truncate text-[14px] font-semibold text-[#1B1B27] text-left">{m.label}</span>
              <span className="ml-auto shrink-0 text-[12px] font-black text-[#64667A]">{m.badge}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2 text-[12.5px] leading-snug text-[#64667A]">
        <Lock className="w-4 h-4 mt-0.5 shrink-0 text-[#7C5CFF]" />
        Tus datos están protegidos con encriptación de nivel bancario.
      </div>

      <div className="mt-5">
        <CTA onClick={onPay}>
          <span className="flex flex-col leading-tight">
            <span>Pagar ahora</span>
            <span className="text-[12px] font-semibold opacity-90">{usd(pack.usd)}</span>
          </span>
          <Lock className="w-4 h-4" />
        </CTA>
      </div>
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
        <span className="absolute font-display font-black text-[34px] text-[#7C5CFF] tabular-nums">{pct}%</span>
      </div>

      <div className="mt-5 rounded-[12px] bg-[#7C5CFF]/[0.07] border border-[#7C5CFF]/15 px-4 py-3 text-[13px] font-semibold text-[#7C5CFF]">
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
        done ? "bg-[#3FBE8F] border-[#3FBE8F] text-white" : current ? "border-[#F58BCB] bg-white" : "border-[#D9D5EA] bg-white")}>
        {done ? <Check className="w-3.5 h-3.5" /> : current ? <span className="w-2 h-2 rounded-full bg-[#F58BCB]" /> : null}
      </span>
      <span className={cn("text-[14px]", done ? "font-semibold text-[#1B1B27]" : current ? "font-semibold text-[#F58BCB]" : "text-[#64667A]")}>{label}</span>
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

      <div className="mt-5 grid grid-cols-3 rounded-[12px] bg-white border border-[#1B1B27]/[0.08] p-1">
        {(["todas", "compras", "transferencias"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("h-9 rounded-[10px] text-[12.5px] font-bold capitalize transition", tab === t ? "bg-[#F58BCB]/12 text-[#F58BCB]" : "text-[#64667A]")}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 && (
          <Card className="text-center">
            <img src={treePng} alt="" aria-hidden loading="lazy" width={1024} height={1024} className="w-28 h-28 mx-auto object-contain" />
            <div className="font-display font-bold text-[16px] text-[#1B1B27]">Tu historial comienza hoy</div>
            <p className="mt-1 text-[13px] text-[#64667A]">Cuando recargues o transfieras hojas, verás cada movimiento aquí.</p>
          </Card>
        )}
        {rows.map((r) => (
          <div key={r.id} className="rounded-[16px] bg-white border border-[#1B1B27]/[0.08] p-4 shadow-[0_1px_3px_rgba(30,25,20,.06)] grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <span className="w-10 h-10 rounded-[10px] bg-[#7C5CFF]/10 grid place-items-center shrink-0 text-[#7C5CFF]">
              {r.kind === "transferencia" ? <Send className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </span>
            <div className="min-w-0">
              <div className="font-display font-bold text-[15px] text-[#1B1B27] truncate">
                {r.hojas > 0 ? `${r.hojas.toLocaleString()} hojas` : `${r.hojas.toLocaleString()} hojas`}
              </div>
              <div className="text-[12px] text-[#64667A] capitalize">{r.kind}</div>
              <div className="text-[11px] text-[#9A97AC] mt-0.5">
                {r.date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })} · {r.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={cn("inline-block rounded-full px-2.5 py-1 text-[11px] font-black",
                r.status === "pendiente" ? "bg-[#F7B955]/15 text-[#B77B12]" : "bg-[#3FBE8F]/15 text-[#2FA574]")}>
                {r.status === "pendiente" ? "Pendiente" : "Aprobada"}
              </span>
              <div className="mt-1 text-[13px] font-semibold text-[#1B1B27]">{r.price !== undefined ? usd(r.price) : "—"}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[12px] bg-[#7C5CFF]/[0.07] border border-[#7C5CFF]/15 px-4 py-3 flex items-center gap-3 text-[13px] font-semibold text-[#7C5CFF]">
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
        <ShieldCheck className="w-4 h-4 text-[#7C5CFF]" />
        <h2 className="text-[12px] uppercase tracking-[0.18em] font-black text-[#7C5CFF]">Reglas importantes</h2>
      </div>
      <div className="mt-4 space-y-3">
        {RULES.map((r, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-[10px] bg-[#7C5CFF]/10 grid place-items-center shrink-0 text-[#7C5CFF]">
              <r.icon className="w-4 h-4" />
            </span>
            <p className="text-[13px] leading-snug text-[#64667A]">{r.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StepReceipt({ pack, method, onDone }: { pack: HojaPack; method: string; onDone: () => void }) {
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
        data: { packId: pack.id, hojas: pack.hojas, usd: pack.usd, method, receiptPath: path, userMessage: message },
      });
      onDone();
    } catch {
      setError("No pudimos enviar tu comprobante. Inténtalo otra vez.");
    }
    setBusy(false);
  }

  return (
    <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(30,25,20,.06)]">
      <h2 className="font-display text-[22px] font-bold leading-tight text-[#1B1B27]">Sube la foto de tu pago</h2>
      <p className="mt-1 text-[15px] leading-relaxed text-[#64667A]">
        Adjunta la captura o foto del comprobante de {usd(pack.usd)} por {pack.hojas} hojas. Lo revisamos y te avisamos aquí mismo.
      </p>

      <label className="mt-4 grid min-h-[132px] cursor-pointer place-items-center gap-2 rounded-[16px] border-2 border-dashed border-[#CEBDD8] bg-[#FBFAFF] p-4 text-center">
        {preview ? (
          <img src={preview} alt="Comprobante elegido" className="max-h-44 rounded-[12px] object-contain" />
        ) : (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <Camera className="h-5 w-5" />
            </span>
            <span className="text-[14px] font-bold text-[#1B1B27]">Tocar para elegir la foto</span>
            <span className="text-[12.5px] text-[#64667A]">Captura de la transferencia o del pago</span>
          </>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </label>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="¿Quieres contarnos algo del pago? (opcional)"
        className="mt-3 min-h-20 w-full rounded-[10px] border-[1.5px] border-[#CEBDD8] bg-white px-3 py-2 text-[15px] text-[#1B1B27] placeholder:text-[#9A9CB0] focus:border-[#7C5CFF] focus:outline-none"
      />

      {error && <p className="mt-3 text-[13px] font-semibold text-[#C2415A]">{error}</p>}

      <button
        onClick={submit}
        disabled={busy}
        className="mt-4 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#7C5CFF] text-[17px] font-bold text-white shadow-[0_4px_14px_rgba(124,92,255,.28)] transition active:scale-[.97] disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
        Enviar mi comprobante
      </button>
      <p className="mt-2 text-center text-[12.5px] text-[#64667A]">Tu foto es privada, solo la ve el equipo de ORÍGEN.</p>
    </section>
  );
}
