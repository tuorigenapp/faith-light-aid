import logo from "@/assets/logo-origen.png";
import companion from "@/assets/origen-companion.png";
import dove from "@/assets/origen-dove.png";
import music from "@/assets/explore/music.jpg";
import clean from "@/assets/explore/clean.jpg";
import identity from "@/assets/explore/identity.jpg";
import christ from "@/assets/explore/christ.jpg";
import listen from "@/assets/explore/listen.jpg";
import patterns from "@/assets/patrones-step1.png";
import patternsSecond from "@/assets/patrones-step2.png";
import pareja from "@/assets/pareja-hero.jpg";
import ministracion from "@/assets/ministracion-palabra-cielo.jpg";
import { PROGRAMAS } from "./programas";
import { EXPLORE_ITEMS, exploreKey } from "./explore-content";

export type AppCover = { key: string; section: string; title: string; image: string; scope: "imagen" | "explorar"; visibility?: boolean };
export const APP_COVERS: AppCover[] = [
  { key: "imagen:logo", section: "Logos e isotipos", title: "Logo original ORÍGEN", image: logo, scope: "imagen" },
  { key: "imagen:companion", section: "Logos e isotipos", title: "Compañero ORÍGEN · Perfil y Premios", image: companion, scope: "imagen" },
  { key: "imagen:dove", section: "Logos e isotipos", title: "Paloma ORÍGEN · Perfil y Premios", image: dove, scope: "imagen" },
  { key: "imagen:visualiza:principal", section: "Visualízalo y Vívelo", title: "Portada general", image: listen, scope: "imagen" },
  { key: "imagen:visualiza:musica", section: "Visualízalo y Vívelo", title: "Oración y Reflexión con Música", image: music, scope: "imagen" },
  { key: "imagen:visualiza:limpieza", section: "Visualízalo y Vívelo", title: "Limpieza Espiritual", image: clean, scope: "imagen" },
  { key: "imagen:visualiza:identidad", section: "Visualízalo y Vívelo", title: "Salto de Identidad", image: identity, scope: "imagen" },
  { key: "imagen:visualiza:cristo", section: "Visualízalo y Vívelo", title: "Método de Cristo 3·6·9", image: christ, scope: "imagen" },
  ...PROGRAMAS.map(p => ({ key: `imagen:programa:${p.id}`, section: "Programas de sanación", title: p.title, image: p.cover, scope: "imagen" as const })),
  { key: "imagen:consulta:pareja", section: "Consultas", title: "¿Deuda o propósito? · Portada", image: pareja, scope: "imagen" },
  { key: "imagen:consulta:patrones", section: "Consultas", title: "Patrones familiares · Portada", image: patterns, scope: "imagen" },
  { key: "imagen:consulta:patrones-preparacion", section: "Consultas", title: "Patrones familiares · Preparación", image: patternsSecond, scope: "imagen" },
  { key: "imagen:consulta:ministracion", section: "Consultas", title: "Dios te dice hoy · Portada", image: ministracion, scope: "imagen" },
  ...EXPLORE_ITEMS.map(e => ({ key: exploreKey(e.title), section: "Explorar e Inicio", title: e.title, image: e.image, scope: "explorar" as const, visibility: true })),
];