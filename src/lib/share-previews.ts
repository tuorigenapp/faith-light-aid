/** Link-preview cards for private sections (their pages render only in the browser). */
const SITE = "https://tuorigen.app";

type Preview = { title: string; description: string; image: string };
const p = (title: string, description: string, image: string): Preview => ({ title, description, image });

const BY_SECTION: Record<string, Preview> = {
  dashboard: p("Tu día en ORÍGEN", "Tu palabra, tu práctica y tu avance de hoy. Entra y sigue tu camino.", "dashboard"),
  comunidad: p("Comunidad ORÍGEN", "No tienes que vivirlo en soledad. Entra, pregunta y acompáñanos.", "comunidad"),
  consultas: p("Consultas ORÍGEN", "Encuentra respuesta a lo que estás viviendo. Entra a tu consulta.", "consultas"),
  consulta: p("Consulta ORÍGEN", "Una consulta pensada para lo que estás viviendo. Entra y descúbrela.", "consultas"),
  visualiza: p("Visualízalo y Vívelo — ORÍGEN", "Programas, audios y prácticas con Dios. Entra a esta práctica.", "visualiza"),
  etapas: p("Mi camino ORÍGEN", "Sana tu historia etapa por etapa. Entra a tu camino.", "etapas"),
  categorias: p("Caminos ORÍGEN", "Una transformación por día. Entra y elige tu camino.", "categorias"),
  caminos: p("Camino ORÍGEN", "8 días para romper el ciclo. Entra a este camino.", "camino"),
  "camino-nuevo": p("Camino ORÍGEN", "8 días para romper el ciclo. Entra a este camino.", "camino"),
  programas: p("Programa ORÍGEN", "Un programa diario para tu sanación. Entra y empieza hoy.", "visualiza"),
  ejercicios: p("Ejercicios diarios — ORÍGEN", "Pequeños pasos que sanan. Entra a tu ejercicio de hoy.", "ejercicios"),
  arbol: p("Mi árbol familiar — ORÍGEN", "Mira qué se repite de generación en generación. Entra a tu árbol.", "arbol"),
  chat: p("Conversa con tu mentora — ORÍGEN", "Un espacio seguro para hablar de tu proceso. Entra a conversar.", "chat"),
  diario: p("Diario espiritual — ORÍGEN", "Escribe lo que Dios está sanando en ti. Entra a tu diario.", "diario"),
  palabra: p("Palabra del día — ORÍGEN", "Un mensaje de Dios para tu día. Entra y recíbelo.", "palabra"),
  juegos: p("Juegos ORÍGEN", "Respira, juega y renueva tu mente. Entra a jugar.", "juegos"),
  premiosorigen: p("Premios ORÍGEN", "Cada paso de tu camino cuenta. Entra a ver tus premios.", "premios"),
  ruleta: p("Ruleta de premios — ORÍGEN", "Tu giro de hoy te espera. Entra y gira.", "ruleta"),
  biblioteca: p("Biblioteca ORÍGEN", "Libros y guías para tu sanación. Entra a leer.", "biblioteca"),
  pareja: p("Consulta de pareja — ORÍGEN", "Comprende tu relación con claridad. Entra a tu consulta.", "pareja"),
  patrones: p("Tus patrones familiares — ORÍGEN", "Descubre el origen de lo que se repite. Entra y explóralo.", "patrones"),
  ministracion: p("Ministración ORÍGEN", "Oración y guía para tu corazón. Entra a tu ministración.", "ministracion"),
  invita: p("Te invito a ORÍGEN", "Lo que sanó en mí puede sanar en ti. Entra y empieza gratis.", "invita"),
  perfil: p("Mi perfil ORÍGEN", "Tu avance y tu camino en un solo lugar.", "perfil"),
  membresia: p("Camino Origen — ORÍGEN", "Desbloquea todo tu proceso de sanación. Entra y mira los planes.", "membresia"),
  explorar: p("Explora ORÍGEN", "Consultas, caminos, ejercicios y herramientas en un solo lugar.", "dashboard"),
  mensajes: p("Mensajes ORÍGEN", "Un mensaje diario hecho para tu proceso. Entra a leerlo.", "dashboard"),
  avisos: p("Avisos ORÍGEN", "Lo nuevo de tu camino en ORÍGEN.", "dashboard"),
  comprarmonedas: p("Hojas de Sanación — ORÍGEN", "Recarga tus Hojas y desbloquea más de tu camino.", "premios"),
  historial: p("Mi historial — ORÍGEN", "Todo tu proceso guardado en un lugar.", "perfil"),
};

export function sharePreviewFor(pathname: string): (Preview & { url: string }) | null {
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  const hit = BY_SECTION[first];
  if (!hit) return null;
  const preview = pathname.startsWith("/visualiza/cristo") ? { ...hit, title: "Método de Cristo 3·6·9 — ORÍGEN", image: "cristo" } : hit;
  return { ...preview, image: `${SITE}/og/${preview.image}.jpg`, url: `${SITE}${pathname}` };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Replace generic share tags in a page head with the section's own card. */
export function applySharePreview(html: string, pathname: string): string {
  const preview = sharePreviewFor(pathname);
  if (!preview) return html;
  const tags = [
    `<title>${esc(preview.title)}</title>`,
    `<meta name="description" content="${esc(preview.description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(preview.title)}">`,
    `<meta property="og:description" content="${esc(preview.description)}">`,
    `<meta property="og:url" content="${esc(preview.url)}">`,
    `<meta property="og:image" content="${preview.image}">`,
    `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(preview.title)}">`,
    `<meta name="twitter:description" content="${esc(preview.description)}">`,
    `<meta name="twitter:image" content="${preview.image}">`,
  ].join("");
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+(?:property="og:[^"]+"|name="(?:description|twitter:[^"]+)")[^>]*>/gi, "")
    .replace(/<head([^>]*)>/i, `<head$1>${tags}`);
}
