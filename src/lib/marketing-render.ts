/**
 * Render puro de campañas (correo y push). Lo usan el servidor al enviar y el
 * cPanel para la vista previa, así lo que ves es exactamente lo que se envía.
 */

export const SITE = "https://tuorigen.app";
export const SUPPORT_EMAIL = "supportorigenapp@gmail.com";

/** Etiquetas de sección: en correo se vuelven botón, en push el destino al tocar. */
export const SECTION_TAGS: Record<string, { path: string; label: string }> = {
  etapas: { path: "/etapas", label: "Camino ORÍGEN" },
  camino: { path: "/etapas", label: "Camino ORÍGEN" },
  ejercicios: { path: "/ejercicios", label: "Ejercicios diarios" },
  visualiza: { path: "/visualiza", label: "Visualízalo y Vívelo" },
  palabra: { path: "/palabra", label: "Palabra de hoy" },
  arbol: { path: "/arbol", label: "Mi Árbol" },
  membresia: { path: "/membresia", label: "Camino Origen" },
  descuento: { path: "/membresia", label: "mi descuento" },
  comunidad: { path: "/comunidad", label: "Comunidad ORÍGEN" },
  consultas: { path: "/consultas", label: "Consultas" },
  diario: { path: "/diario", label: "Mi Diario" },
  mentor: { path: "/chat", label: "Mi Mentora" },
  juegos: { path: "/juegos", label: "Juegos" },
  invita: { path: "/invita", label: "Regalar ORÍGEN" },
  inicio: { path: "/dashboard", label: "ORÍGEN" },
};

export const SHORTCODES: { code: string; desc: string }[] = [
  { code: "[usuario]", desc: "Nombre de la persona" },
  { code: "[sitio]", desc: "tuorigen.app" },
  ...Object.entries(SECTION_TAGS)
    .filter(([k]) => k !== "camino")
    .map(([k, v]) => ({ code: `[${k}]`, desc: `Botón a ${v.label}` })),
  { code: "[enlace:/ruta]", desc: "Botón a cualquier sección" },
];

export function firstName(p: { display_name?: string | null; full_name?: string | null } | null | undefined): string {
  const raw = (p?.display_name || p?.full_name || "").trim().split(/\s+/)[0] ?? "";
  if (!raw || raw.includes("@")) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/** Reemplaza nombre y sitio. Sin nombre registrado usa un saludo cálido. */
export function personalize(text: string, name: string): string {
  return text
    .replace(/\[(usuario|nombre)\]/gi, name || "amiga")
    .replace(/\[sitio\]/gi, "tuorigen.app");
}

function absolute(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE}${path.startsWith("/") ? "" : "/"}${path}`;
}

const TAG_RE = /\[(enlace:([^\]\s]+)|[a-záéíóúñ]+)\]/gi;

/** Texto de push: etiquetas → nombre legible; la primera define a dónde lleva. */
export function renderPushText(text: string, name: string): { text: string; url: string | null } {
  let url: string | null = null;
  const out = personalize(text, name).replace(TAG_RE, (m, inner: string, link?: string) => {
    if (link) {
      url ??= link;
      return "";
    }
    const t = SECTION_TAGS[inner.toLowerCase()];
    if (!t) return m;
    url ??= t.path;
    return t.label;
  });
  return { text: out.replace(/\s{2,}/g, " ").trim(), url };
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export type ButtonTone = "green" | "purple";

export function buttonHtml(label: string, href: string, tone: ButtonTone = "green"): string {
  const bg = tone === "green" ? "#16a34a" : "#6d4aff";
  const url = escapeHtml(absolute(href));
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto"><tr><td align="center" bgcolor="${bg}" style="border-radius:14px;box-shadow:0 4px 14px rgba(22,163,74,.3)"><a href="${url}" target="_blank" style="display:inline-block;padding:15px 28px;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:14px">${escapeHtml(label)} &rarr;</a></td></tr></table><p style="margin:0 0 6px;text-align:center;font:12px Arial,sans-serif;color:#8a8496">Si el botón no abre: <a href="${url}" style="color:#6d4aff">${url}</a></p>`;
}

/** Cuerpo de correo: etiquetas → botones, URLs sueltas → enlaces, saltos → <br>. */
export function renderEmailBody(text: string, name: string, wrap: (url: string) => string = (u) => u): string {
  const safe = escapeHtml(personalize(text, name));
  const withTags = safe.replace(TAG_RE, (m, inner: string, link?: string) => {
    if (link) return `</p>${buttonHtml("Entrar ahora", wrap(absolute(link)))}<p style="${P}">`;
    const t = SECTION_TAGS[inner.toLowerCase()];
    if (!t) return m;
    return `</p>${buttonHtml(`Ir a ${t.label}`, wrap(absolute(t.path)))}<p style="${P}">`;
  });
  const linked = withTags.replace(
    /(^|[\s(])(https?:\/\/[^\s<)]+)/g,
    (_m, pre: string, u: string) => `${pre}<a href="${wrap(u)}" style="color:#6d4aff;font-weight:700">${u}</a>`,
  );
  return `<p style="${P}">${linked.replace(/\n/g, "<br/>")}</p>`.replace(new RegExp(`<p style="${escapeRe(P)}">\\s*</p>`, "g"), "");
}

const P = "margin:0 0 14px;font:16px/1.6 Arial,sans-serif;color:#2b2533";
function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type EmailInput = {
  subject: string;
  content: string;
  image_url?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  headline?: string | null;
  discount_label?: string | null;
  accent?: string;
};

/** Correo completo: cabecera, imagen vertical clickeable, texto, botón y pie con soporte. */
export function renderEmailHtml(
  c: EmailInput,
  opts: { name: string; pixelUrl?: string; wrap?: (url: string) => string; unsubscribeUrl?: string },
): string {
  const wrap = opts.wrap ?? ((u: string) => u);
  const accent = c.accent ?? "#6d4aff";
  const target = c.button_url ? absolute(c.button_url) : `${SITE}/dashboard`;
  const img = c.image_url
    ? `<a href="${escapeHtml(wrap(target))}" target="_blank"><img src="${escapeHtml(absolute(c.image_url))}" alt="${escapeHtml(personalize(c.headline || c.subject, opts.name))}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0" /></a>`
    : "";
  const headline = c.headline
    ? `<h1 style="margin:0 0 12px;font:800 28px/1.15 Georgia,serif;color:${accent};text-align:center">${escapeHtml(personalize(c.headline, opts.name))}</h1>`
    : "";
  const coupon = c.discount_label
    ? `<table role="presentation" align="center" style="margin:6px auto 14px"><tr><td style="border:2px dashed ${accent};border-radius:14px;padding:12px 22px;font:800 22px Arial,sans-serif;color:${accent};text-align:center;letter-spacing:1px">${escapeHtml(c.discount_label)}</td></tr></table>`
    : "";
  const cta = c.button_text ? buttonHtml(c.button_text, wrap(target), "green") : "";
  const unsub = opts.unsubscribeUrl ?? `${SITE}/perfil`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(personalize(c.subject, opts.name))}</title></head>
<body style="margin:0;padding:0;background:#f4f1f8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f8"><tr><td align="center" style="padding:16px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td style="background:${accent};padding:14px 20px;text-align:center;font:800 18px Georgia,serif;letter-spacing:3px;color:#ffffff">ORÍGEN</td></tr>
${img ? `<tr><td>${img}</td></tr>` : ""}
<tr><td style="padding:26px 24px 8px">${headline}${coupon}${renderEmailBody(c.content, opts.name, wrap)}${cta}</td></tr>
<tr><td style="padding:18px 24px 24px;border-top:1px solid #eee;text-align:center;font:12px/1.6 Arial,sans-serif;color:#9a94a6">
¿Tienes alguna duda o inquietud? Escríbenos a <a href="mailto:${SUPPORT_EMAIL}" style="color:#7b7488">${SUPPORT_EMAIL}</a><br/>
Recibes este correo porque tienes una cuenta en tuorigen.app.<br/>
<a href="${escapeHtml(unsub)}" style="color:#9a94a6">Dejar de recibir estos mensajes</a>
</td></tr></table></td></tr></table>
${opts.pixelUrl ? `<img src="${escapeHtml(opts.pixelUrl)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />` : ""}
</body></html>`;
}

export function renderEmailText(c: EmailInput, name: string): string {
  const body = personalize(c.content, name).replace(TAG_RE, (m, inner: string, link?: string) => {
    if (link) return absolute(link);
    const t = SECTION_TAGS[inner.toLowerCase()];
    return t ? `${t.label}: ${absolute(t.path)}` : m;
  });
  return `${c.headline ? personalize(c.headline, name) + "\n\n" : ""}${body}\n\n${c.button_text && c.button_url ? `${c.button_text}: ${absolute(c.button_url)}\n\n` : ""}Soporte: ${SUPPORT_EMAIL}\nDejar de recibir estos mensajes: ${SITE}/perfil`;
}

/* ------------------------------ Push ------------------------------ */

export type PushStyle = "text" | "banner" | "discount";

export const PUSH_ICONS: { key: string; label: string; src: string }[] = [
  { key: "logo", label: "Logo ORÍGEN", src: "/icon-192.png" },
  { key: "descuento", label: "Cupón %", src: "/push-icons/descuento.png" },
  { key: "oferta", label: "Oferta relámpago", src: "/push-icons/oferta.png" },
  { key: "regalo", label: "Regalo", src: "/push-icons/regalo.png" },
  { key: "novedad", label: "Novedad", src: "/push-icons/novedad.png" },
  { key: "corazon", label: "Corazón", src: "/push-icons/corazon.png" },
  { key: "cruz", label: "Cruz", src: "/push-icons/cruz.png" },
  { key: "arbol", label: "Árbol", src: "/push-icons/arbol.png" },
];

export function pushIconSrc(key: string | null | undefined, style: PushStyle): string {
  const found = PUSH_ICONS.find((i) => i.key === key);
  if (found) return found.src;
  return style === "discount" ? "/push-icons/descuento.png" : "/icon-192.png";
}

export function buildPush(
  c: { subject: string | null; content: string; button_url: string | null; image_url: string | null; push_style?: string | null; push_icon?: string | null; discount_label?: string | null },
  name: string,
) {
  const style = (c.push_style as PushStyle) || "text";
  const t = renderPushText(c.content, name);
  const title = personalize(c.subject || "ORÍGEN", name);
  const body = style === "discount" && c.discount_label && !t.text.includes(c.discount_label) ? `${c.discount_label} · ${t.text}` : t.text;
  return {
    title,
    body,
    url: c.button_url || t.url || "/dashboard",
    icon: pushIconSrc(c.push_icon, style),
    image: style === "banner" && c.image_url ? absolute(c.image_url) : undefined,
  };
}

/* ------------------------- Biblioteca 100 ------------------------- */

export type TemplateCategory = "estaciones" | "fechas" | "metodo" | "descuentos" | "regalar" | "novedades" | "remarketing";

export const TEMPLATE_CATEGORIES: { key: TemplateCategory; label: string; count: number }[] = [
  { key: "estaciones", label: "Estaciones del año", count: 16 },
  { key: "fechas", label: "Fechas especiales", count: 24 },
  { key: "metodo", label: "Método ORÍGEN", count: 16 },
  { key: "descuentos", label: "Descuentos y ofertas", count: 14 },
  { key: "regalar", label: "Regalar ORÍGEN", count: 10 },
  { key: "novedades", label: "Novedades", count: 10 },
  { key: "remarketing", label: "Remarketing", count: 10 },
];

export type EmailTemplate = {
  id: string;
  category: TemplateCategory;
  title: string;
  subject: string;
  headline: string;
  content: string;
  image_url: string;
  button_text: string;
  button_url: string;
  discount_label: string | null;
  accent: string;
  variant: number;
};

type Topic = { title: string; image: string; url: string; cta: string; accent: string; discount?: string; months?: number[] };

const TOPICS: Record<TemplateCategory, Topic[]> = {
  estaciones: [
    { title: "Primavera: florece por dentro", image: "primavera", url: "/etapas", cta: "Empezar mi camino", accent: "#3f8f4e", months: [3, 4, 5] },
    { title: "Verano: pausa y paz", image: "verano", url: "/visualiza", cta: "Tomar mi pausa", accent: "#d17a22", months: [6, 7, 8] },
    { title: "Otoño: suelta lo que pesa", image: "otono", url: "/diario", cta: "Soltar hoy", accent: "#a5531f", months: [9, 10, 11] },
    { title: "Invierno: refugio en Dios", image: "invierno", url: "/palabra", cta: "Leer mi Palabra", accent: "#2f4a7a", months: [12, 1, 2] },
  ],
  fechas: [
    { title: "Año Nuevo, historia nueva", image: "fechas", url: "/etapas", cta: "Empezar el año sanando", accent: "#6d4aff", months: [1] },
    { title: "Amor que sana", image: "pareja", url: "/pareja", cta: "Sanar mi relación", accent: "#c2185b", months: [2] },
    { title: "Mujer valiosa", image: "metodo", url: "/visualiza", cta: "Reconocer mi valor", accent: "#8e44ad", months: [3] },
    { title: "Semana Santa: vida nueva", image: "fechas", url: "/palabra", cta: "Vivir esta semana con Él", accent: "#7a5a2f", months: [3, 4] },
    { title: "Para mamá, con amor", image: "familia", url: "/arbol", cta: "Sanar mi linaje materno", accent: "#c2185b", months: [5] },
    { title: "Para papá, con gratitud", image: "otono", url: "/arbol", cta: "Sanar mi linaje paterno", accent: "#2f4a7a", months: [6] },
    { title: "Mitad de año: ¿cómo está tu alma?", image: "verano", url: "/diagnostico", cta: "Hacer mi evaluación", accent: "#d17a22", months: [7] },
    { title: "Regreso a la rutina con paz", image: "remarketing", url: "/ejercicios", cta: "Mi ejercicio de hoy", accent: "#3f8f4e", months: [8, 9] },
    { title: "Gratitud que transforma", image: "familia", url: "/diario", cta: "Escribir mi gratitud", accent: "#a5531f", months: [11] },
    { title: "Black Friday ORÍGEN", image: "regalo", url: "/membresia", cta: "Ver mi descuento", accent: "#1d1b26", discount: "60% OFF", months: [11] },
    { title: "Navidad: el regalo de la paz", image: "invierno", url: "/invita", cta: "Regalar ORÍGEN", accent: "#b3261e", months: [12] },
    { title: "Cierra el año en paz", image: "fechas", url: "/diario", cta: "Mi cierre de año", accent: "#6d4aff", months: [12] },
  ],
  metodo: [
    { title: "Rompe el ciclo que se repite", image: "familia", url: "/patrones", cta: "Descubrir mi patrón", accent: "#6d4aff" },
    { title: "Ese vacío tiene un origen", image: "metodo", url: "/etapas", cta: "Encontrar el origen", accent: "#6d4aff" },
    { title: "Reconecta tu espíritu con Dios", image: "fechas", url: "/palabra", cta: "Reconectar hoy", accent: "#7a5a2f" },
    { title: "Tu árbol quiere sanar", image: "familia", url: "/arbol", cta: "Ver mi árbol", accent: "#3f8f4e" },
    { title: "5 minutos que cambian tu día", image: "primavera", url: "/ejercicios", cta: "Hacer mis 5 minutos", accent: "#3f8f4e" },
    { title: "Visualízalo y vívelo", image: "metodo", url: "/visualiza", cta: "Escuchar ahora", accent: "#8e44ad" },
    { title: "Tu mentora te escucha", image: "remarketing", url: "/chat", cta: "Hablar con mi mentora", accent: "#6d4aff" },
    { title: "No estás sola en esto", image: "pareja", url: "/comunidad", cta: "Entrar a la comunidad", accent: "#c2185b" },
  ],
  descuentos: [
    { title: "Camino Origen a US$5.99/mes", image: "regalo", url: "/membresia", cta: "Activar mi plan", accent: "#16a34a", discount: "6 MESES GRATIS" },
    { title: "Solo por hoy", image: "remarketing", url: "/membresia", cta: "Usar mi descuento", accent: "#b3261e", discount: "50% OFF" },
    { title: "Tu cupón expira pronto", image: "regalo", url: "/membresia", cta: "Usar antes de que caduque", accent: "#b3261e", discount: "40% OFF" },
    { title: "Oferta de temporada", image: "verano", url: "/membresia", cta: "Ver la oferta", accent: "#d17a22", discount: "30% OFF" },
    { title: "Plan anual especial", image: "metodo", url: "/membresia", cta: "Elegir plan anual", accent: "#16a34a", discount: "AHORRA 60%" },
    { title: "Últimas horas", image: "invierno", url: "/membresia", cta: "Aprovechar ahora", accent: "#b3261e", discount: "ÚLTIMO DÍA" },
    { title: "Descuento de bienvenida", image: "primavera", url: "/membresia", cta: "Reclamar mi regalo", accent: "#16a34a", discount: "20% OFF" },
  ],
  regalar: [
    { title: "Regala paz a quien amas", image: "regalo", url: "/invita", cta: "Regalar ORÍGEN", accent: "#6d4aff" },
    { title: "Invita y gana", image: "familia", url: "/invita", cta: "Invitar ahora", accent: "#16a34a" },
    { title: "Un regalo que sana", image: "pareja", url: "/invita", cta: "Enviar mi regalo", accent: "#c2185b" },
    { title: "Sana en familia", image: "familia", url: "/invita", cta: "Invitar a mi familia", accent: "#3f8f4e" },
    { title: "Comparte tu camino", image: "remarketing", url: "/invita", cta: "Compartir ORÍGEN", accent: "#6d4aff" },
  ],
  novedades: [
    { title: "Nuevo en Visualízalo", image: "metodo", url: "/visualiza", cta: "Ver lo nuevo", accent: "#8e44ad" },
    { title: "Nuevas consultas", image: "remarketing", url: "/consultas", cta: "Hacer mi consulta", accent: "#6d4aff" },
    { title: "Nuevos juegos de calma", image: "verano", url: "/juegos", cta: "Jugar ahora", accent: "#d17a22" },
    { title: "Nueva etapa disponible", image: "primavera", url: "/etapas", cta: "Abrir la etapa", accent: "#3f8f4e" },
    { title: "Nuevos premios ORÍGEN", image: "regalo", url: "/premiosorigen", cta: "Ver mis premios", accent: "#16a34a" },
  ],
  remarketing: [
    { title: "Te extrañamos, [usuario]", image: "remarketing", url: "/dashboard", cta: "Volver a mi camino", accent: "#6d4aff" },
    { title: "Dejaste algo pendiente", image: "otono", url: "/etapas", cta: "Continuar donde quedé", accent: "#a5531f" },
    { title: "Tu plan sigue esperándote", image: "metodo", url: "/membresia", cta: "Retomar mi plan", accent: "#16a34a", discount: "VUELVE CON 30% OFF" },
    { title: "Tu racha puede volver hoy", image: "primavera", url: "/ejercicios", cta: "Recuperar mi racha", accent: "#3f8f4e" },
    { title: "Última oportunidad", image: "invierno", url: "/membresia", cta: "Aprovechar ahora", accent: "#b3261e", discount: "ÚLTIMO AVISO" },
  ],
};

const SUBJECTS: Record<TemplateCategory, string[]> = {
  estaciones: ["[usuario], {t}", "{t} 🌿", "Esta temporada es para ti, [usuario]", "[usuario], una nueva estación empieza en ti"],
  fechas: ["[usuario], {t}", "{t} ✨", "Una fecha especial para tu corazón, [usuario]", "Hoy no es un día cualquiera, [usuario]"],
  metodo: ["[usuario], {t}", "{t}", "Lo que nadie te explicó, [usuario]", "[usuario], esto es para ti hoy"],
  descuentos: ["[usuario], {t} ⏳", "{t} — solo para ti", "Quedan pocas horas, [usuario]", "[usuario], tu descuento está activo"],
  regalar: ["[usuario], {t} 🎁", "{t}", "¿A quién le regalarías paz, [usuario]?", "Un regalo distinto, [usuario]"],
  novedades: ["[usuario], {t} 🆕", "Recién llegado: {t}", "Hay algo nuevo para ti, [usuario]", "{t} ya está en ORÍGEN"],
  remarketing: ["[usuario], {t}", "{t} 💚", "Tu lugar sigue aquí, [usuario]", "[usuario], no lo dejes para mañana"],
};

const BODIES: Record<TemplateCategory, string[]> = {
  estaciones: [
    "Hola [usuario],\n\nCada estación trae una invitación. Esta es la tuya: detenerte unos minutos y mirar hacia dentro con Dios.\n\nTu siguiente paso ya está listo:",
    "[usuario], la naturaleza cambia sin miedo. Tú también puedes soltar lo viejo y abrirte a lo nuevo.\n\nTe preparamos un momento especial:",
  ],
  fechas: [
    "Hola [usuario],\n\nLas fechas especiales despiertan recuerdos y emociones. En ORÍGEN te acompañamos a vivirlas en paz.\n\nEntra y regálate este momento:",
    "[usuario], hoy es una oportunidad para sanar lo que esta fecha mueve en ti.\n\nTe esperamos aquí:",
  ],
  metodo: [
    "Hola [usuario],\n\n¿Sientes que repites los mismos errores? No es casualidad: muchos patrones tienen un origen en tu historia familiar.\n\nEl Método ORÍGEN te ayuda a encontrarlo, paso a paso y de la mano de Dios.",
    "[usuario], la paz real no llega por fuerza de voluntad. Llega cuando entiendes de dónde viene lo que sientes.\n\nHoy puedes dar un paso pequeño:",
  ],
  descuentos: [
    "Hola [usuario],\n\nQueremos que nada te detenga. Por tiempo limitado tienes un precio especial para Camino Origen.\n\nCancela cuando quieras. Te avisamos antes de cualquier cobro.",
    "[usuario], tu descuento está listo y no durará mucho.\n\nAccede a todas las etapas, ejercicios, audios y a tu mentora:",
  ],
  regalar: [
    "Hola [usuario],\n\n¿Hay alguien que necesita paz? Regálale ORÍGEN y acompáñale a sanar su historia.\n\nEs fácil y toma un minuto:",
    "[usuario], el mejor regalo no se envuelve: se vive. Comparte ORÍGEN con quien amas.",
  ],
  novedades: [
    "Hola [usuario],\n\nAgregamos algo nuevo pensado para ti. Entra y descúbrelo antes que nadie.",
    "[usuario], ORÍGEN creció. Hay contenido nuevo esperándote ahora mismo:",
  ],
  remarketing: [
    "Hola [usuario],\n\nHace días no te vemos y queríamos decirte algo: tu proceso sigue aquí, justo donde lo dejaste.\n\nUn paso hoy es suficiente.",
    "[usuario], empezar y dejar es parte del camino. Lo importante es volver.\n\nTe guardamos tu lugar:",
  ],
};

/** Genera las 100 plantillas. `variants` cambia redacción e imagen por plantilla ("Actualizar"). */
export function buildTemplates(variants: Record<string, number> = {}): EmailTemplate[] {
  const all: EmailTemplate[] = [];
  for (const cat of TEMPLATE_CATEGORIES) {
    const topics = TOPICS[cat.key];
    for (let i = 0; i < cat.count; i++) {
      const id = `${cat.key}-${String(i + 1).padStart(2, "0")}`;
      const v = variants[id] ?? 0;
      const topic = topics[(i + v) % topics.length]!;
      const angle = Math.floor(i / topics.length) + v;
      const subj = SUBJECTS[cat.key][angle % SUBJECTS[cat.key].length]!.replace("{t}", topic.title.replace(/, \[usuario\]$/, ""));
      const body = BODIES[cat.key][angle % BODIES[cat.key].length]!;
      all.push({
        id,
        category: cat.key,
        title: `${topic.title}${angle ? ` · v${angle + 1}` : ""}`,
        subject: subj,
        headline: topic.title,
        content: body,
        image_url: `/email/${topic.image}.jpg`,
        button_text: topic.cta,
        button_url: topic.url,
        discount_label: topic.discount ?? null,
        accent: topic.accent,
        variant: v,
      });
    }
  }
  return all;
}

/* ---------------------- Asistente automático ---------------------- */

/** Horas (UTC) de los 3 correos del día: 9 am, 2 pm y 7 pm en Santo Domingo. */
export const AI_EMAIL_SLOTS_UTC = [13, 18, 23];
/** Horas (UTC) de push automáticos: cada 2 horas de 8 am a 10 pm (Santo Domingo). */
export const AI_PUSH_SLOTS_UTC = [12, 14, 16, 18, 20, 22, 0, 2];

/** Elige plantilla según mes, franja y modo, sin repetir en el día. */
export function pickAiTemplate(date: Date, slot: number, mode: "marketing" | "remarketing", templates: EmailTemplate[]): EmailTemplate {
  const month = date.getUTCMonth() + 1;
  const pool =
    mode === "remarketing"
      ? templates.filter((t) => t.category === "remarketing" || t.category === "descuentos")
      : templates.filter((t) => {
          if (t.category === "remarketing") return false;
          const topic = TOPICS[t.category].find((x) => x.title === t.headline);
          return !topic?.months || topic.months.includes(month);
        });
  const list = pool.length ? pool : templates;
  const day = Math.floor(date.getTime() / 86_400_000);
  return list[(day * 3 + slot) % list.length]!;
}

export type AiPush = { subject: string; content: string; push_style: PushStyle; push_icon: string; button_url: string; image_url: string | null; discount_label: string | null };

const AI_PUSHES: AiPush[] = [
  { subject: "Hola [usuario] 👋 tu Palabra de hoy", content: "Dos minutos con Dios sostienen tu paz. [palabra]", push_style: "banner", push_icon: "cruz", button_url: "/palabra", image_url: "/email/banner-fechas.jpg", discount_label: null },
  { subject: "Tu cupón expira pronto", content: "Camino Origen con 50% de descuento. ¡Úsalo antes de que caduque!", push_style: "discount", push_icon: "descuento", button_url: "/membresia", image_url: null, discount_label: "50% OFF" },
  { subject: "[usuario], tu árbol quiere sanar", content: "Descubre qué patrón se repite en tu familia. [arbol]", push_style: "text", push_icon: "arbol", button_url: "/arbol", image_url: null, discount_label: null },
  { subject: "Oferta relámpago ⚡", content: "Solo por hoy: plan anual a US$5.99/mes.", push_style: "discount", push_icon: "oferta", button_url: "/membresia", image_url: null, discount_label: "6 MESES GRATIS" },
  { subject: "Respira 5 minutos 💚", content: "Un audio de calma te espera en Visualízalo y Vívelo.", push_style: "banner", push_icon: "corazon", button_url: "/visualiza", image_url: "/email/banner-metodo.jpg", discount_label: null },
  { subject: "Nuevo en ORÍGEN 🆕", content: "Agregamos contenido nuevo para ti. Entra a verlo.", push_style: "text", push_icon: "novedad", button_url: "/explorar", image_url: null, discount_label: null },
  { subject: "Regala paz 🎁", content: "Invita a alguien que amas y acompáñale a sanar.", push_style: "text", push_icon: "regalo", button_url: "/invita", image_url: null, discount_label: null },
  { subject: "[usuario], tu ejercicio de hoy", content: "5 minutos que cambian tu día. [ejercicios]", push_style: "banner", push_icon: "corazon", button_url: "/ejercicios", image_url: "/email/banner-primavera.jpg", discount_label: null },
  { subject: "Tu mentora te escucha", content: "¿Algo te pesa hoy? Cuéntaselo con calma.", push_style: "text", push_icon: "logo", button_url: "/chat", image_url: null, discount_label: null },
  { subject: "Sana en familia 🌳", content: "Tu linaje también puede encontrar paz.", push_style: "banner", push_icon: "arbol", button_url: "/etapas", image_url: "/email/banner-familia.jpg", discount_label: null },
];

const AI_PUSHES_REMARKETING: AiPush[] = [
  { subject: "Te extrañamos, [usuario] 💚", content: "Tu camino sigue justo donde lo dejaste.", push_style: "banner", push_icon: "corazon", button_url: "/dashboard", image_url: "/email/banner-remarketing.jpg", discount_label: null },
  { subject: "Vuelve con descuento", content: "Retoma Camino Origen con 30% de descuento.", push_style: "discount", push_icon: "descuento", button_url: "/membresia", image_url: null, discount_label: "30% OFF" },
  { subject: "Tu racha puede volver hoy", content: "Un paso pequeño es suficiente. [ejercicios]", push_style: "text", push_icon: "oferta", button_url: "/ejercicios", image_url: null, discount_label: null },
];

export function pickAiPush(date: Date, mode: "marketing" | "remarketing"): AiPush {
  const list = mode === "remarketing" ? AI_PUSHES_REMARKETING : AI_PUSHES;
  const idx = Math.floor(date.getTime() / 7_200_000);
  return list[idx % list.length]!;
}
