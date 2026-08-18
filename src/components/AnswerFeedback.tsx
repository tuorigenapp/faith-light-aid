import { Check, X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Popup de respuesta: verde cuando es válida, rojo cuando no.
 * Se cierra solo, sin bloquear el flujo de la etapa.
 */
export function AnswerFeedback({
  state,
  message,
  onClose,
  autoCloseMs = 2200,
}: {
  state: "ok" | "fail" | null;
  message?: string;
  onClose: () => void;
  autoCloseMs?: number;
}) {
  useEffect(() => {
    if (!state) return;
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [state, onClose, autoCloseMs]);

  if (!state) return null;
  const ok = state === "ok";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-24 z-[60] px-4 pointer-events-none"
      style={{ animation: "scale-in .25s ease-out both" }}
    >
      <div
        className={cn(
          "mx-auto max-w-[420px] rounded-[16px] px-4 py-3.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-white",
          ok ? "bg-[#2F9A73]" : "bg-[#D64545]",
        )}
        style={{ boxShadow: "0 8px 30px rgba(30,25,20,.22)" }}
      >
        <span className="w-9 h-9 rounded-full bg-white/22 grid place-items-center shrink-0">
          {ok ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </span>
        <span className="min-w-0">
          <span className="block font-display font-extrabold text-[15px] leading-tight">
            {ok ? "¡Respuesta correcta!" : "Respuesta incorrecta"}
          </span>
          <span className="block text-[12.5px] leading-snug opacity-95 mt-0.5">
            {message ?? (ok ? "Sigue así, vas avanzando." : "Lee la explicación y continúa con calma.")}
          </span>
        </span>
      </div>
    </div>
  );
}

export default AnswerFeedback;
