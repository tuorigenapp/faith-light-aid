import logo from "@/assets/logo-origen.png";
import companion from "@/assets/origen-companion.png";
import dove from "@/assets/origen-dove.png";
import lion from "@/assets/origen-lion.png";
import lamb from "@/assets/origen-lamb.png";
import guia from "@/assets/mensajes/guia-palabra.png";
import psicologa from "@/assets/mensajes/psicologa.png";
import coach from "@/assets/mensajes/coach.png";
import mascot from "@/assets/mensajes/origen-mascot.png";
import abuelo from "@/assets/mensajes/abuelo-noche.png";
import music from "@/assets/visualiza/cat-musica.jpg";
import clean from "@/assets/visualiza/cat-limpieza.jpg";
import identity from "@/assets/visualiza/cat-identidad.jpg";
import christ from "@/assets/visualiza/cat-cristo.jpg";
import listen from "@/assets/explore/listen.jpg";
import patterns from "@/assets/patrones-step1.png";
import patternsSecond from "@/assets/patrones-step2.png";
import pareja from "@/assets/pareja-hero.jpg";
import ministracion from "@/assets/ministracion-palabra-cielo.jpg";
import consultaMentora from "@/assets/consultas/consulta-mentora.jpg";
import consultaPareja from "@/assets/consultas/consulta-pareja.jpg";
import consultaPatrones from "@/assets/consultas/consulta-patrones.jpg";
import consultaMinistracion from "@/assets/consultas/consulta-ministracion.jpg";
import consultaArbol from "@/assets/consultas/consulta-arbol.jpg";
import { PROGRAMAS } from "./programas";
import { EXPLORE_ITEMS, exploreKey } from "./explore-content";

export type AppCover = { key: string; section: string; title: string; image: string; scope: "imagen" | "explorar"; visibility?: boolean };
export const APP_COVERS: AppCover[] = [
  { key: "imagen:logo", section: "Logos e isotipos", title: "Logo original ORÍGEN", image: logo, scope: "imagen" },
  { key: "imagen:companion", section: "Logos e isotipos", title: "Compañero ORÍGEN · Perfil y Premios", image: companion, scope: "imagen" },
  { key: "imagen:dove", section: "Logos e isotipos", title: "Paloma ORÍGEN · Perfil y Premios", image: dove, scope: "imagen" },
  { key: "imagen:lion", section: "Logos e isotipos", title: "León ORÍGEN · Premios", image: lion, scope: "imagen" },
  { key: "imagen:lamb", section: "Logos e isotipos", title: "Cordero ORÍGEN · Premios", image: lamb, scope: "imagen" },
  ...[
    { id: "palabra", title: "Samuel · Guía de la Palabra", image: guia },
    { id: "emocional", title: "Dra. Lucía · Acompañamiento emocional", image: psicologa },
    { id: "tarea", title: "Coach · Práctica diaria", image: coach },
    { id: "crecimiento", title: "Compañero · Crecimiento", image: mascot },
    { id: "noche", title: "Guía · Cierre de la noche", image: abuelo },
  ].map(a => ({ key: `imagen:mensaje:${a.id}`, section: "Mensajes ORÍGEN · asistentes", title: a.title, image: a.image, scope: "imagen" as const })),
  { key: "imagen:visualiza:principal", section: "Visualízalo y Vívelo", title: "Portada general", image: listen, scope: "imagen" },
  { key: "imagen:visualiza:musica", section: "Visualízalo y Vívelo", title: "Oración y Reflexión con Música", image: music, scope: "imagen" },
  { key: "imagen:visualiza:limpieza", section: "Visualízalo y Vívelo", title: "Limpieza Espiritual", image: clean, scope: "imagen" },
  { key: "imagen:visualiza:identidad", section: "Visualízalo y Vívelo", title: "Salto de Identidad", image: identity, scope: "imagen" },
  { key: "imagen:visualiza:cristo", section: "Visualízalo y Vívelo", title: "Método de Cristo 3·6·9", image: christ, scope: "imagen" },
  ...PROGRAMAS.map(p => ({ key: `imagen:programa:${p.id}`, section: "Programas de sanación", title: p.title, image: p.cover, scope: "imagen" as const })),
  { key: "imagen:consulta:banner-mentora", section: "Consultas · portadas con botón", title: "Conversa con Ruth Esther · Banner", image: consultaMentora, scope: "imagen" },
  { key: "imagen:consulta:banner-pareja", section: "Consultas · portadas con botón", title: "¿Deuda o propósito? · Banner", image: consultaPareja, scope: "imagen" },
  { key: "imagen:consulta:banner-patrones", section: "Consultas · portadas con botón", title: "Patrones familiares · Banner", image: consultaPatrones, scope: "imagen" },
  { key: "imagen:consulta:banner-ministracion", section: "Consultas · portadas con botón", title: "Dios te dice hoy · Banner", image: consultaMinistracion, scope: "imagen" },
  { key: "imagen:consulta:banner-arbol", section: "Consultas · portadas con botón", title: "Sana tu árbol familiar · Banner", image: consultaArbol, scope: "imagen" },
  { key: "imagen:consulta:pareja", section: "Consultas", title: "¿Deuda o propósito? · Portada", image: pareja, scope: "imagen" },
  { key: "imagen:consulta:patrones", section: "Consultas", title: "Patrones familiares · Portada", image: patterns, scope: "imagen" },
  { key: "imagen:consulta:patrones-preparacion", section: "Consultas", title: "Patrones familiares · Preparación", image: patternsSecond, scope: "imagen" },
  { key: "imagen:consulta:ministracion", section: "Consultas", title: "Dios te dice hoy · Portada", image: ministracion, scope: "imagen" },
  ...EXPLORE_ITEMS.map(e => ({ key: exploreKey(e.title), section: "Explorar e Inicio", title: e.title, image: e.image, scope: "explorar" as const, visibility: true })),
];