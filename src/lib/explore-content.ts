import pilarMentora from "@/assets/pilar-mentora.png";
import pilarPareja from "@/assets/pilar-pareja.png";
import pilarPatron from "@/assets/pilar-patron.png";
import pilarMinistracion from "@/assets/dios-te-dice-hoy.png";
import visualizaBanner from "@/assets/visualiza-banner-home-v2.png";
import ninoCover from "@/assets/prog-nino-interior.png";
import glowMujerCover from "@/assets/prog-glowup-mujer.png";
import glowHombreCover from "@/assets/prog-glowup-hombre.jpg";
import magneticoCover from "@/assets/prog-magnetico.png";
import permisoCover from "@/assets/prog-permiso.png";
import exerciseCover from "@/assets/prayer-exercise.jpg";
import treeCover from "@/assets/hojas-tree.png";
import diarioCover from "@/assets/onb-portal.png";
import bibliotecaCover from "@/assets/lp-recibes.png.asset.json";
import premiosCover from "@/assets/e3d-star.png";
import monedasCover from "@/assets/e3d-coin.png";

export type ExploreItem = {
  title: string;
  description: string;
  image: string;
  to: string;
  locked?: boolean;
  tag: string;
};

export const FEATURED_EXPLORE: ExploreItem[] = [
  { title: "Ruth Esther", description: "Habla con tu mentora espiritual.", image: pilarMentora, to: "/chat", tag: "Mentora" },
  { title: "Patrones familiares", description: "Mira qué se repite en tu historia.", image: pilarPatron, to: "/patrones", tag: "Consulta" },
  { title: "Ejercicios diarios", description: "Un mapa con juegos y práctica diaria.", image: exerciseCover, to: "/ejercicios", tag: "Diario" },
  { title: "Premios ORÍGEN", description: "Racha, XP y bonificaciones.", image: premiosCover, to: "/premiosorigen", tag: "Premios" },
];

export const EXPLORE_ITEMS: ExploreItem[] = [
  ...FEATURED_EXPLORE,
  { title: "¿Deuda o propósito?", description: "Lectura profunda de pareja.", image: pilarPareja, to: "/pareja", tag: "Pareja" },
  { title: "Dios te dice hoy", description: "Ministración desde la Corte Celestial.", image: pilarMinistracion, to: "/ministracion", tag: "Palabra" },
  { title: "Visualízalo y Vívelo", description: "Audios, ejercicios y visualización guiada.", image: visualizaBanner, to: "/visualiza", tag: "Audio" },
  { title: "Mi árbol", description: "Agrega familiares y mira tu linaje.", image: treeCover, to: "/arbol", tag: "Familia" },
  { title: "Diario íntimo", description: "Escribe, guarda y vuelve a mirar tu proceso.", image: diarioCover, to: "/diario", tag: "Diario" },
  { title: "Biblioteca", description: "Recursos para acompañar tu camino.", image: bibliotecaCover, to: "/biblioteca", tag: "Lectura", locked: true },
  { title: "Comprar monedas", description: "Recarga Hojas de Sanación.", image: monedasCover, to: "/comprarmonedas", tag: "Hojas" },
  { title: "Niño interior", description: "Sana a mamá, papá y tu historia.", image: ninoCover, to: "/programas/nino-interior", tag: "Programa", locked: true },
  { title: "Glow Up Mujer", description: "Belleza, carácter y propósito.", image: glowMujerCover, to: "/programas/glowup-mujer", tag: "Programa", locked: true },
  { title: "Glow Up Hombre", description: "Disciplina, enfoque, fe y propósito.", image: glowHombreCover, to: "/programas/glowup-hombre", tag: "Programa", locked: true },
  { title: "Magnético", description: "Presencia y atracción sana.", image: magneticoCover, to: "/programas/magnetico", tag: "Programa", locked: true },
  { title: "Permiso para existir", description: "Voz, límites y decisión.", image: permisoCover, to: "/programas/permiso-mujer", tag: "Programa", locked: true },
];
