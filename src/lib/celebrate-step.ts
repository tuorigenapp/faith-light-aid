import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";

/**
 * Celebración corta y no bloqueante al completar algo real.
 * Desaparece sola en pocos segundos.
 */
export function celebrateStep(title: string, body?: string, opts?: { confetti?: boolean }) {
  if (opts?.confetti !== false) celebrate(1400);
  toast.success(title, { description: body, duration: 4000 });
}

export const CELEBRATIONS = {
  etapaCamino: () => celebrateStep("¡Etapa del día completada! 🌿", "Mañana se abre la siguiente. Hoy ya moviste algo real."),
  etapaCategoria: (nombre?: string) =>
    celebrateStep("¡Día completado! ✨", nombre ? `Avanzaste en ${nombre}. Vuelve mañana por el siguiente.` : "Vuelve mañana por el siguiente."),
  vivelo: () => celebrateStep("¡Lo viviste, no solo lo escuchaste! 🎧", "Tu audio del día quedó registrado."),
  quizPalabra: () => celebrateStep("¡Respuesta correcta! 📖", "La Palabra de hoy ya es tuya."),
  ejercicio: () => celebrateStep("¡Ejercicio del día hecho! 💪", "Pequeño hoy, distinto en 30 días."),
} as const;
