import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import { celebrateBig } from "@/lib/celebrate-big";
import eStar from "@/assets/e3d-star.png";
import eHeart from "@/assets/e3d-heart-purple.png";
import eCross from "@/assets/e3d-cross.png";
import eHeadphones from "@/assets/e3d-headphones.png";
import ePractice from "@/assets/e3d-practice.png";

/**
 * Celebración corta y no bloqueante al completar algo real:
 * emoji 3D grande y centrado con el fondo difuminado + confeti.
 */
export function celebrateStep(
  title: string,
  body?: string,
  opts?: { confetti?: boolean; emoji?: string; big?: boolean },
) {
  if (opts?.confetti !== false) celebrate(1600);
  if (opts?.big === false) {
    toast.success(title, { description: body, duration: 4000 });
    return;
  }
  celebrateBig({ emoji: opts?.emoji ?? eStar, title, body });
}

export const CELEBRATIONS = {
  etapaCamino: () =>
    celebrateStep("¡Etapa del día completada!", "Mañana se abre la siguiente. Hoy ya moviste algo real.", {
      emoji: ePractice,
    }),
  etapaCategoria: (nombre?: string) =>
    celebrateStep(
      "¡Día completado!",
      nombre ? `Avanzaste en ${nombre}. Vuelve mañana por el siguiente.` : "Vuelve mañana por el siguiente.",
      { emoji: eStar },
    ),
  vivelo: () =>
    celebrateStep("¡Lo viviste, no solo lo escuchaste!", "Tu audio del día quedó registrado.", {
      emoji: eHeadphones,
    }),
  quizPalabra: () => celebrateStep("¡Respuesta correcta!", "La Palabra de hoy ya es tuya.", { emoji: eCross }),
  ejercicio: () => celebrateStep("¡Ejercicio del día hecho!", "Pequeño hoy, distinto en 30 días.", { emoji: eHeart }),
} as const;
