import { Sun, Heart, Sparkles, Droplets, Leaf, Star, Flower2, HandHeart } from "lucide-react";

/**
 * Paleta arcoíris compartida para las tarjetas de afirmaciones.
 * Fondos pastel vivos con acento fuerte del mismo tono; cicla por índice
 * para que cada afirmación tenga un color distinto (amarillo, rosa, morado,
 * azul, verde, naranja, turquesa, fucsia) en toda la app.
 */
export const AFFIRMATION_STYLES = [
  { Icon: Sun, color: "#B47A00", bg: "#FFF3D6" }, // amarillo
  { Icon: Heart, color: "#D9468F", bg: "#FFE1F1" }, // rosa
  { Icon: Sparkles, color: "#7C4FD0", bg: "#EDE7FF" }, // morado
  { Icon: Droplets, color: "#1D6FD1", bg: "#DCEBFF" }, // azul
  { Icon: Leaf, color: "#1F8A63", bg: "#DFF6EA" }, // verde
  { Icon: Star, color: "#E07A1F", bg: "#FFEAD9" }, // naranja
  { Icon: Flower2, color: "#0E8F8F", bg: "#DCF5F5" }, // turquesa
  { Icon: HandHeart, color: "#C2418A", bg: "#FFE9EE" }, // fucsia
];

export function affirmationStyle(index: number) {
  const n = AFFIRMATION_STYLES.length;
  return AFFIRMATION_STYLES[((index % n) + n) % n];
}

export default AFFIRMATION_STYLES;
