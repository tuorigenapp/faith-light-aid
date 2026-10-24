/** Capturas reales y actuales de ORÍGEN, compartidas por la página de inicio y /empezar. */
import dashboard from "@/assets/screens-v3/dashboard.jpg";
import etapas from "@/assets/screens-current/etapas-actual.png.asset.json";
import consultas from "@/assets/screens-v3/consultas.jpg";
import chat from "@/assets/screens-v3/chat.jpg";
import ministracion from "@/assets/screens-v3/ministracion.jpg";
import pareja from "@/assets/screens-v3/pareja.jpg";
import patrones from "@/assets/screens-v3/patrones.jpg";
import visualiza from "@/assets/screens-current/visualiza-actual.png.asset.json";
import diario from "@/assets/screens-v3/diario.jpg";
import premios from "@/assets/screens-v3/premiosorigen.jpg";
import comunidad from "@/assets/screens-v3/comunidad.jpg";
import biblioteca from "@/assets/screens-v3/biblioteca.jpg";
import juegos from "@/assets/screens-v3/juegos.jpg";
import ruleta from "@/assets/screens-v3/ruleta.jpg";
import arbol from "@/assets/screens-v3/arbol.jpg";
import miArbol from "@/assets/screens-v3/arbol-mi-arbol.jpg";
import palabra from "@/assets/screens-v3/palabra.jpg";
import hojas from "@/assets/screens-v3/comprarmonedas.jpg";
import historial from "@/assets/screens-v3/historial.jpg";
import invita from "@/assets/screens-v3/invita.jpg";
import exercisesShot from "@/assets/screens-current/ejercicios.png.asset.json";
import profileShot from "@/assets/screens-current/perfil.png.asset.json";
import categoriesShot from "@/assets/screens-current/categorias-actual.png.asset.json";
import visualizaCategories from "@/assets/screens-current/visualiza-categorias-actual.png.asset.json";
import visualizaCustom from "@/assets/screens-current/visualiza-personalizadas-actual.png.asset.json";
import visualizaHealing from "@/assets/screens-current/visualiza-sanacion-actual.png.asset.json";
import visualizaSubtopic from "@/assets/screens-current/visualiza-subcategoria-actual.png.asset.json";
import visualizaPractice from "@/assets/screens-current/visualiza-practica-actual.png.asset.json";
import visualizaLesson from "@/assets/screens-current/visualiza-leccion-actual.png.asset.json";
import visualizaAffirmations from "@/assets/screens-current/visualiza-afirmaciones-actual.png.asset.json";
import caminoChild from "@/assets/screens-current/camino-0-actual.png.asset.json";
import caminoWoman from "@/assets/screens-current/camino-1-actual.png.asset.json";
import caminoMan from "@/assets/screens-current/camino-2-actual.png.asset.json";
import caminoIdentity from "@/assets/screens-current/camino-3-actual.png.asset.json";
import caminoFreedom from "@/assets/screens-current/camino-4-actual.png.asset.json";
import caminoPeace from "@/assets/screens-current/camino-5-actual.png.asset.json";
import caminoBoundaries from "@/assets/screens-current/camino-6-actual.png.asset.json";
import caminoLoss from "@/assets/screens-current/camino-7-actual.png.asset.json";
import type { FUNNEL_INTERACTIONS } from "@/lib/funnel-interactions";
import { diversifyScreens } from "@/lib/app-screen-order";

export type AppScreen = { img: string; t: string; d: string; group?: "camino" | "visualiza"; icon?: keyof typeof FUNNEL_INTERACTIONS };

export const APP_SCREENS: AppScreen[] = diversifyScreens<AppScreen>([
  { img: dashboard, t: "Tu inicio", d: "Tu misión del día, racha y todo tu camino" },
  { img: etapas.url, t: "Mi camino ORÍGEN · Etapas", d: "Tu mapa, progreso y lecciones diarias", group: "camino", icon: "path" },
  { img: categoriesShot.url, t: "Categorías de Camino ORÍGEN", d: "Elige el tema que deseas trabajar", group: "camino", icon: "categories" },
  { img: caminoChild.url, t: "Camino · Niño interior", d: "Así se ve tu mapa de sanación diaria", group: "camino", icon: "healingHeart" },
  { img: caminoWoman.url, t: "Camino · Glow Up Mujer", d: "Lecciones para fortalecer tu identidad", group: "camino", icon: "butterfly" },
  { img: caminoMan.url, t: "Camino · Glow Up Hombre", d: "Carácter, hábitos y propósito día a día", group: "camino", icon: "compass" },
  { img: caminoIdentity.url, t: "Camino · Magnético/a", d: "Presencia, valor propio y relaciones sanas", group: "camino", icon: "dove" },
  { img: caminoFreedom.url, t: "Camino · Permiso para existir", d: "Tu voz y tus límites, paso a paso", group: "camino", icon: "mentor" },
  { img: caminoPeace.url, t: "Camino · Paz interior", d: "El mapa de depresión y ansiedad", group: "camino", icon: "rest" },
  { img: caminoBoundaries.url, t: "Camino · Relaciones sanas", d: "Pasos para salir de una relación narcisista", group: "camino", icon: "couple" },
  { img: caminoLoss.url, t: "Camino · Sanar una pérdida", d: "Un camino para acompañar tu duelo", group: "camino", icon: "prayer" },
  { img: visualiza.url, t: "Visualízalo y Vívelo", d: "Tu seguimiento y programas guiados", group: "visualiza", icon: "audio" },
  { img: visualizaCategories.url, t: "Visualízalo · Categorías", d: "Música, limpieza, identidad y Cristo 3·6·9", group: "visualiza", icon: "categories" },
  { img: visualizaCustom.url, t: "Visualízalo · Nuevos temas", d: "Relaciones sanas y árbol familiar", group: "visualiza", icon: "familyTree" },
  { img: visualizaHealing.url, t: "Visualízalo · Programas de sanación", d: "Niño interior, Glow Up y libertad personal", group: "visualiza", icon: "healingHeart" },
  { img: visualizaSubtopic.url, t: "Visualízalo · Subcategorías", d: "Elige tu enfoque dentro de cada tema", group: "visualiza", icon: "compass" },
  { img: visualizaAffirmations.url, t: "Visualízalo · Afirmaciones diarias", d: "Frases de tu tema en un carrusel de colores", group: "visualiza", icon: "sun" },
  { img: visualizaPractice.url, t: "Visualízalo · Práctica por dentro", d: "Tu afirmación y juegos de la lección", group: "visualiza", icon: "game" },
  { img: visualizaLesson.url, t: "Visualízalo · Lección y tareas", d: "Reflexión y acciones propias de tu tema", group: "visualiza", icon: "journal" },
  { img: consultas, t: "Consultas ORÍGEN", d: "Todas las consultas en un solo lugar, con PDF" },
  { img: chat, t: "Mentora ORÍGEN", d: "Te escucha y guarda tus conversaciones" },
  { img: ministracion, t: "Dios te dice hoy", d: "Una palabra personal cada día" },
  { img: pareja, t: "Consulta de pareja", d: "Entiende lo que hay entre ustedes con respeto" },
  { img: patrones, t: "Patrones familiares", d: "Descubre lo que se repite en tu familia" },
  { img: exercisesShot.url, t: "Ejercicios diarios", d: "Prácticas cortas que sí se sienten" },
  { img: palabra, t: "Palabra del día", d: "Escritura, reflexión y oración para cada día" },
  { img: diario, t: "Diario espiritual", d: "Privado, solo tú y Dios, con papelera" },
  { img: premios, t: "Premios ORÍGEN", d: "Tu racha, tus logros y tus Hojas de Sanación" },
  { img: profileShot.url, t: "Tu perfil", d: "Tu historia y el avance de tu camino" },
  { img: comunidad, t: "Comunidad", d: "Personas en un camino parecido al tuyo" },
  { img: biblioteca, t: "Biblioteca digital", d: "Libros para tu proceso, cada semana" },
  { img: juegos, t: "Juegos del día", d: "Gimnasia emocional de 3 minutos" },
  { img: ruleta, t: "Ruleta de premios", d: "Un giro cada 24 horas, siempre ganas" },
  { img: arbol, t: "Árbol de Sanación", d: "Mira crecer tu avance con cada paso" },
  { img: miArbol, t: "Tu árbol generacional", d: "Conoce tus raíces y organiza tu historia" },
  { img: hojas, t: "Hojas de Sanación", d: "Tu moneda de avance dentro de la app" },
  { img: historial, t: "Tu historial", d: "Todos tus movimientos y respuestas guardadas" },
  { img: invita, t: "Programa de afiliados", d: "Gana compartiendo ORÍGEN" },
]);
