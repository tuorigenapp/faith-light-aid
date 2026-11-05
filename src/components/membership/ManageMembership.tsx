import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, ChevronLeft, HandHeart, Repeat, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { CancelSurvey } from "@/components/CancelSurvey";
import { PLAN_LEVELS, type PlanLevel } from "@/lib/plans-catalog";

type Step = "choose" | "change" | "changed" | "money" | "grace-sent";

/** Antes de la encuesta: ¿cambiar de plan o cancelar? Si es por dinero, ofrece período de gracia. */
export function ManageMembership({ open, onClose, current }: { open: boolean; onClose: () => void; current: PlanLevel | null }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("choose");
  const [target, setTarget] = useState<PlanLevel | null>(null);
  const [why, setWhy] = useState("");
  const [busy, setBusy] = useState(false);
  const [survey, setSurvey] = useState(false);
  if (!open) return null;
  const close = () => { setStep("choose"); setWhy(""); onClose(); };
  const idx = current ? PLAN_LEVELS.findIndex((l) => l.id === current.id) : -1;

  async function pickTarget(l: PlanLevel) {
    if (!user) return;
    setBusy(true);
    const direction = PLAN_LEVELS.findIndex((x) => x.id === l.id) > idx ? "up" : "down";
    const { error } = await supabase.from("plan_change_requests").insert({ user_id: user.id, from_plan: current?.name ?? null, to_plan: l.name, direction });
    setBusy(false);
    if (error) return toast.error("No pudimos registrar tu cambio. Intenta de nuevo.");
    setTarget(l);
    setStep("changed");
  }

  async function requestGrace() {
    if (!user || why.trim().length < 3) return;
    setBusy(true);
    const { error } = await supabase.from("grace_periods").insert({ user_id: user.id, days: 7, reason: why.trim(), from_plan: current?.name ?? null });
    if (!error) await supabase.from("cancellation_surveys").insert({ user_id: user.id, reason: "No puedo pagar ahora mismo", comment: why.trim(), from_plan: current?.name ?? null, kind: "grace" });
    setBusy(false);
    if (error) return toast.error(error.code === "23505" ? "Ya tienes una solicitud de período de gracia." : "No pudimos enviar tu solicitud.");
    qc.invalidateQueries({ queryKey: ["grace", user.id] });
    setStep("grace-sent");
  }

  if (survey) return <CancelSurvey open onClose={() => { setSurvey(false); close(); }} fromPlan={current?.name ?? null} />;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/40 sm:place-items-center sm:p-6" onClick={close}>
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[20px] bg-card p-5 shadow-elevated animate-in slide-in-from-bottom sm:max-w-[460px] sm:rounded-[16px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          {step !== "choose" && step !== "grace-sent" && step !== "changed" ? (
            <button onClick={() => setStep("choose")} aria-label="Volver" className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"><ChevronLeft className="h-5 w-5" /></button>
          ) : <span />}
          <button onClick={close} aria-label="Cerrar" className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>

        {step === "choose" && (
          <>
            <h2 className="font-display text-[22px] font-bold leading-tight">¿Qué quieres hacer con tu membresía?</h2>
            <div className="mt-4 grid gap-2">
              <Option icon={Repeat} title="Cambiar a otro plan" body="Sube o baja de nivel sin perder tu progreso." onClick={() => setStep("change")} />
              <Option icon={XCircle} title="Cancelar mi membresía" body="Antes, te mostramos una alternativa si es por dinero." onClick={() => setStep("money")} />
            </div>
          </>
        )}

        {step === "change" && (
          <>
            <h2 className="font-display text-[22px] font-bold leading-tight">Elige tu nuevo plan</h2>
            <div className="mt-4 grid gap-2">
              {PLAN_LEVELS.filter((l) => l.id !== current?.id).map((l) => {
                const up = PLAN_LEVELS.findIndex((x) => x.id === l.id) > idx;
                return <Option key={l.id} icon={up ? ArrowUpCircle : ArrowDownCircle} title={l.name} body={`${up ? "Plan superior" : "Plan inferior"} · ${l.claim}`} onClick={() => !busy && pickTarget(l)} />;
              })}
            </div>
          </>
        )}

        {step === "changed" && target && (
          <>
            <h2 className="font-display text-[22px] font-bold leading-tight">Así cambias a {target.name}</h2>
            <ol className="mt-3 grid gap-2 text-[14.5px]">
              <li>1. Abre el pago del nuevo plan con el mismo correo de tu cuenta.</li>
              <li>2. En Hotmart, entra a <b>Mis compras</b> y cancela el plan anterior para no pagar dos veces.</li>
              <li>3. Nuestro equipo ya recibió tu solicitud y actualiza tu acceso.</li>
            </ol>
            <a href={target.url.monthly} target="_blank" rel="noopener" className="mt-4 grid h-[52px] place-items-center rounded-[12px] bg-cta-green text-[16px] font-bold text-cta-green-foreground">Ir al pago de {target.name.split(" ")[0]}</a>
            <a href="https://consumer.hotmart.com/purchase" target="_blank" rel="noopener" className="mt-2 grid h-12 place-items-center rounded-[12px] bg-primary/10 text-[15px] font-semibold text-primary">Abrir Mis compras en Hotmart</a>
          </>
        )}

        {step === "money" && (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-primary/10 text-primary"><HandHeart className="h-6 w-6" /></span>
            <h2 className="mt-3 font-display text-[22px] font-bold leading-tight">¿Es porque ahora mismo no puedes pagar?</h2>
            <p className="mt-2 text-[14.5px] text-muted-foreground">No tienes que irte. El equipo ORÍGEN puede darte <b className="text-foreground">7 o 14 días de gracia</b> sin cobro para que reúnas el pago y sigas donde quedaste. Te avisaremos antes de que termine.</p>
            <label htmlFor="grace-why" className="mt-4 block text-[14px] font-semibold">Cuéntanos brevemente tu situación (obligatorio)</label>
            <textarea id="grace-why" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Ej.: este mes tuve un gasto inesperado" className="mt-2 min-h-20 w-full rounded-[10px] border-[1.5px] border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20" />
            <button onClick={requestGrace} disabled={busy || why.trim().length < 3} className="mt-4 grid h-[52px] w-full place-items-center rounded-[12px] bg-cta-green text-[16px] font-bold text-cta-green-foreground disabled:opacity-50">{busy ? "Enviando…" : "Pedir mi período de gracia"}</button>
            <button onClick={() => setSurvey(true)} className="mt-2 min-h-11 w-full text-[14px] font-medium text-muted-foreground">No, quiero cancelar definitivamente</button>
          </>
        )}

        {step === "grace-sent" && (
          <>
            <h2 className="font-display text-[22px] font-bold leading-tight">Solicitud enviada</h2>
            <p className="mt-2 text-[14.5px] text-muted-foreground">El equipo ORÍGEN revisará tu caso y te asignará 7 o 14 días de gracia. Recibirás avisos dentro de la app antes de que termine. Mientras tanto, sigue tu camino con normalidad.</p>
            <button onClick={close} className="mt-4 grid h-[52px] w-full place-items-center rounded-[12px] bg-primary text-[16px] font-bold text-primary-foreground">Seguir en ORÍGEN</button>
          </>
        )}
      </div>
    </div>
  );
}

function Option({ icon: Icon, title, body, onClick }: { icon: typeof Repeat; title: string; body: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex min-h-16 w-full items-center gap-3 rounded-[12px] border border-border/60 bg-background p-3 text-left transition active:scale-[.98]">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
      <span><span className="block text-[15px] font-bold">{title}</span><span className="block text-[13px] text-muted-foreground">{body}</span></span>
    </button>
  );
}
