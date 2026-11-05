import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

const REASONS = [
  "No era lo que esperaba",
  "El plan gratis me basta",
  "No entendí cómo usarla",
  "Me dio miedo el cobro",
  "No tengo tiempo",
  "Es muy caro",
  "No puedo pagar ahora mismo",
  "Otro motivo",
];

export function CancelSurvey({
  open,
  onClose,
  fromPlan,
}: {
  open: boolean;
  onClose: () => void;
  fromPlan?: string | null;
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function send() {
    if (!user || !reason || comment.trim().length < 3) return;
    setSaving(true);
    const { error } = await supabase.from("cancellation_surveys").insert({
      user_id: user.id,
      reason,
      comment: comment.trim(),
      kind: "final",
      from_plan: fromPlan ?? null,
    });
    setSaving(false);
    if (error) return toast.error("No pudimos enviar tu respuesta.");
    toast.success("Recibimos tu cancelación", { description: "Para detener cobros futuros, cancela también tu suscripción en Hotmart (Mis compras)." });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-foreground/40 p-0 sm:p-6">
      <div className="w-full sm:max-w-[440px] rounded-t-[20px] sm:rounded-[16px] bg-card p-5 shadow-elevated animate-in slide-in-from-bottom">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[20px] font-bold leading-tight">Antes de irte, ¿qué pasó?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Elige un motivo y escríbelo con tus palabras. Nos ayuda a mejorar.
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full rounded-[10px] px-4 py-3 text-left text-sm font-medium transition ${
                reason === r ? "border-2 border-primary bg-primary/5" : "border border-border/60 bg-background"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-[14px] font-semibold" htmlFor="cancel-why">Cuéntanos el motivo exacto (obligatorio)</label>
        {(
          <textarea
            id="cancel-why"
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Corto o largo, como quieras: ¿qué no te gustó o no te ayudó?"
            className="mt-3 min-h-20 w-full rounded-[10px] border-[1.5px] border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
          />
        )}

        <button
          onClick={send}
          disabled={!reason || comment.trim().length < 3 || saving}
          className="btn-primary-gradient mt-4 min-h-[52px] w-full rounded-full text-[16px] font-semibold disabled:opacity-50"
        >
          {saving ? "Enviando…" : "Confirmar cancelación"}
        </button>
        <button onClick={onClose} className="mt-2 min-h-11 w-full text-sm font-medium text-muted-foreground">
          Volver sin cancelar
        </button>
      </div>
    </div>
  );
}
