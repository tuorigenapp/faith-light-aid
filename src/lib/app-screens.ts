/** Capturas reales y actuales de ORÍGEN, compartidas por la página de inicio y /empezar. */
import dashboard from "@/assets/screens-v3/dashboard.jpg";
import etapas from "@/assets/screens-v3/etapas.jpg";
import consultas from "@/assets/screens-v3/consultas.jpg";
import chat from "@/assets/screens-v3/chat.jpg";
import ministracion from "@/assets/screens-v3/ministracion.jpg";
import pareja from "@/assets/screens-v3/pareja.jpg";
import patrones from "@/assets/screens-v3/patrones.jpg";
import visualiza from "@/assets/screens-v3/visualiza.jpg";
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

export type AppScreen = { img: string; t: string; d: string };

export const APP_SCREENS: AppScreen[] = [
  { img: dashboard, t: "Tu inicio", d: "Tu misión del día, racha y todo tu camino" },
  { img: etapas, t: "Mi camino ORÍGEN", d: "Una etapa nueva cada día, a tu ritmo" },
  { img: consultas, t: "Consultas ORÍGEN", d: "Todas las consultas en un solo lugar, con PDF" },
  { img: chat, t: "Mentora ORÍGEN", d: "Te escucha y guarda tus conversaciones" },
  { img: ministracion, t: "Dios te dice hoy", d: "Una palabra personal cada día" },
  { img: pareja, t: "Consulta de pareja", d: "Entiende lo que hay entre ustedes con respeto" },
  { img: patrones, t: "Patrones familiares", d: "Descubre lo que se repite en tu familia" },
  { img: exercisesShot.url, t: "Ejercicios diarios", d: "Prácticas cortas que sí se sienten" },
  { img: visualiza, t: "Visualízalo y Vívelo", d: "Programas guiados de fe, identidad y bienestar" },
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
];
