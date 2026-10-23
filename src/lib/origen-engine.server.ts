/**
 * Asistente ORÍGEN sin créditos: compone respuestas con bancos de frases del método,
 * el Cerebro ORÍGEN y una semilla (nombre + fecha + pregunta + día). Sin IA externa.
 */

import { christianText, hasIncompatibleSpiritualLanguage } from "./christian-language";
const STOP = new Set("que de la el en y a los las un una por con para mi me se lo le su es no si como mas más pero ya muy esta este esto eso hoy al del yo tu te o sus cuando donde porque quiero saber va voy hay ser estoy tengo".split(" "));

export type EngineInput = { name?: string; birthdate?: string; question?: string; scope: string; scopeRef?: string | null; title?: string };

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed || 1;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clean = (s: string) => christianText(s).replace(/\s+/g, " ").trim();

export function keywords(q = "") {
  return Array.from(new Set(q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zñ\s]/g, " ").split(/\s+/).filter(w => w.length > 3 && !STOP.has(w)))).slice(0, 8);
}

type Topic = "pareja" | "familia" | "dinero" | "salud" | "decision" | "perdida" | "fe" | "general";
const TOPIC_WORDS: Record<Exclude<Topic, "general">, string[]> = {
  pareja: ["pareja", "novio", "novia", "esposo", "esposa", "amor", "relacion", "volvera", "regresa", "ex", "matrimonio", "ama", "quiere"],
  familia: ["madre", "mama", "padre", "papa", "hijo", "hija", "hermano", "hermana", "familia", "abuela", "abuelo", "suegra"],
  dinero: ["dinero", "trabajo", "empleo", "negocio", "deuda", "deudas", "jefe", "empresa", "ventas", "casa", "pago"],
  salud: ["ansiedad", "miedo", "salud", "triste", "tristeza", "depresion", "cansada", "cansado", "dormir", "vacio", "paz"],
  decision: ["decision", "decidir", "mudar", "viaje", "cambiar", "elegir", "irme", "quedarme", "empezar"],
  perdida: ["perdida", "murio", "fallecio", "duelo", "extraño", "partio", "luto"],
  fe: ["dios", "fe", "proposito", "llamado", "oracion", "espiritual", "mision"],
};
function topicOf(words: string[], scope: string): Topic {
  if (scope === "pareja") return "pareja";
  if (scope === "patrones") return "familia";
  let best: Topic = "general", n = 0;
  for (const [t, list] of Object.entries(TOPIC_WORDS)) {
    const c = words.filter(w => list.some(l => w.startsWith(l))).length;
    if (c > n) { n = c; best = t as Topic; }
  }
  return best;
}

const BANK = {
  energia: {
    general: ["Lo que compartes merece atención, no un juicio. Puedes llevar tu inquietud a Dios y reconocer qué necesitas antes de tomar una decisión.", "No necesitas resolver toda tu historia de una vez. Con el apoyo de tu fe y de personas de confianza, puedes empezar por nombrar lo que te duele."],
    pareja: ["Para comprender un vínculo, observa el respeto, la comunicación y los hechos de ambos. Ninguna reflexión puede conocer pensamientos ajenos ni decidir por ti.", "Tu valor ante Dios no depende de recibir atención de una pareja. Pregúntate si puedes hablar con honestidad, expresar límites y sentirte a salvo en esta relación."],
    familia: ["En tu historia familiar puede haber maneras de relacionarse que aprendiste sin elegirlas. Explora cuáles reconoces en tu experiencia, sin asumir culpas ni secretos de otras generaciones.", "Honrar a tu familia no exige guardar silencio ante lo que te hiere. Desde la fe cristiana puedes cuidar tus vínculos y poner límites respetuosos."],
    dinero: ["Una preocupación económica merece pasos concretos y apoyo, no culpa espiritual. Revisa lo que está bajo tu control y pide a Dios sabiduría para administrar tus recursos.", "Tu dignidad no se mide por el dinero que tienes. Ordenar tus prioridades y pedir orientación puede ayudarte a tomar decisiones más serenas."],
    salud: ["Tu malestar merece ser escuchado con cuidado. La oración puede acompañarte, pero no reemplaza atención médica o psicológica cuando la necesitas.", "Descansar y pedir apoyo no significa que te falte fe. Puedes acercarte a Dios y a un profesional de confianza sin tener que elegir entre ambos."],
    decision: ["Una decisión importante puede requerir tiempo, información y una conversación sincera. Ora por sabiduría y separa los hechos de los temores antes de elegir.", "No tienes que confundir la prisa con una respuesta de Dios. Revisa tus opciones, tus valores y los efectos de cada paso con calma."],
    perdida: ["El duelo no tiene un calendario obligatorio. Puedes compartir tu tristeza con Dios y con alguien de confianza, sin exigirte olvidar a quien amas.", "Extrañar y agradecer pueden convivir. Permítete recordar con ternura y buscar compañía cuando el dolor se vuelve difícil de llevar."],
    fe: ["Tus preguntas no te hacen menos digno de amor. Puedes acercarte a Dios con sinceridad y buscar acompañamiento cristiano que respete tu proceso.", "La oración puede ser sencilla: decirle a Dios lo que sientes y pedir sabiduría para el siguiente paso. No necesitas una señal extraordinaria para buscar apoyo."],
  },
  mandato: {
    general: ["Escribe qué necesitas y elige una acción pequeña que puedas hacer sin dañarte ni dañar a otros.", "Habla con alguien de confianza sobre lo que te preocupa y pide compañía para el paso que elijas."],
    pareja: ["Expresa una necesidad concreta sin acusaciones y escucha la respuesta. Si hay violencia o miedo por tu seguridad, busca ayuda y prioriza protegerte.", "Observa si hay respeto por tus límites. Una relación sana no te exige abandonar tu dignidad, tus amistades ni tu seguridad."],
    familia: ["Practica un límite claro y respetuoso. Perdonar no obliga a reconciliarte ni a exponerte de nuevo al daño.", "Identifica una frase aprendida en casa que te pesa y escribe una respuesta más compasiva a la luz de tu fe."],
    dinero: ["Revisa un gasto, una cuenta o una tarea pendiente y establece un siguiente paso realista.", "Busca orientación confiable antes de comprometer dinero y evita decidir por presión o promesas de prosperidad garantizada."],
    salud: ["Respira con suavidad, descansa y comparte cómo te sientes. Si el malestar persiste o se intensifica, pide ayuda profesional.", "Anota lo que sientes y qué apoyo necesitas; llévalo a una persona de confianza o a tu profesional de salud."],
    decision: ["Escribe tus opciones y sus consecuencias. Pide sabiduría en oración y considera consejo de una persona prudente.", "Elige un paso pequeño que puedas revisar después, sin obligarte a resolver todo en este momento."],
    perdida: ["Si te ayuda, escribe un recuerdo o una oración. No te apresures a cerrar el duelo: busca compañía para atravesarlo.", "Reconoce el amor que sigue siendo importante para ti y permite que otras personas te acompañen."],
    fe: ["Dedica unos minutos a la oración y lee un pasaje bíblico con calma, sin buscar predicciones.", "Comparte tu inquietud con una persona de confianza de tu comunidad cristiana que escuche sin juzgarte."],
  },
  manana: ["Cuando puedas, revisa cómo te fue y ajusta tu paso sin exigirte perfección.", "Haz espacio para el descanso y vuelve a esta reflexión a tu propio ritmo.", "Observa qué acción te ayuda de verdad y cuál necesita más apoyo."],
};

const VERSES = ["Jeremías 29:11", "Isaías 43:19", "Salmo 34:18", "Proverbios 3:5-6", "Filipenses 4:6-7", "Eclesiastés 3:1", "Romanos 8:28", "Isaías 41:10"];

function pick<T>(r: () => number, arr: T[]) { return arr[Math.floor(r() * arr.length)]; }

/** Frases cortas del Cerebro ORÍGEN que coinciden con la pregunta. */
async function brainLines(scope: string, scopeRef: string | null | undefined, words: string[], r: () => number) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("brain_documents").select("content, scope, scope_ref").eq("is_active", true).in("scope", ["origen", scope]).limit(40);
    const rows = (data ?? []).filter(d => d.scope === "origen" || !d.scope_ref || d.scope_ref === scopeRef);
    const sentences: { s: string; score: number }[] = [];
    for (const d of rows) {
      for (const s of (d.content || "").slice(0, 60000).split(/(?<=[.!?])\s+/)) {
        if (s.length < 50 || s.length > 220 || hasIncompatibleSpiritualLanguage(s) || /\b(cap[íi]tulo|p[áa]gina|libro|autor|isbn|copyright)\b/i.test(s)) continue;
        const low = s.toLowerCase();
        const score = words.reduce((a, w) => a + (low.includes(w) ? 2 : 0), 0) + r() * 0.5;
        if (score > 0.4) sentences.push({ s: clean(s), score });
      }
    }
    return sentences.sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.s);
  } catch { return []; }
}

function nonce() {
  try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0]; } catch { return Math.floor(Math.random() * 4294967295); }
}

async function base(inp: EngineInput) {
  const words = keywords(inp.question);
  // Semilla única por consulta + petición: nunca dos respuestas iguales.
  const r = rng(hash(`${inp.name}|${inp.birthdate}|${inp.question}|${inp.scopeRef ?? inp.scope}|${Date.now()}|${nonce()}`));
  const topic = topicOf(words, inp.scope);
  const first = (inp.name || "").trim().split(/\s+/)[0] || "";
  const brain = await brainLines(inp.scope, inp.scopeRef, words, r);
  return { words, r, topic, first, brain };
}

/** Toma un elemento que no se haya usado antes en esta misma respuesta. */
function take(r: () => number, arr: string[], used: Set<string>) {
  const free = arr.filter(x => !used.has(x));
  const v = pick(r, free.length ? free : arr);
  used.add(v);
  return v;
}

const VOICE = {
  apertura: [
    "{n}, gracias por confiar lo que estás viviendo. Esta reflexión parte de lo que compartes, no de una revelación ni de una predicción.",
    "{n}, podemos mirar tu inquietud con honestidad y esperanza cristiana, sin decidir por ti.",
    "Tu pregunta importa, {n}. Merece ser escuchada con respeto y sin respuestas que te hagan sentir culpable.",
    "{n}, empieza por reconocer lo que necesitas; Dios puede acompañarte también en medio de tus dudas.",
  ],
  emociones: [
    "Pregúntate qué emoción reconoces y qué situación la despierta; solo tú puedes confirmar cómo te sientes.",
    "Si notas tensión o cansancio, date una pausa y busca apoyo sin juzgarte por necesitarlo.",
    "Escribir lo que te preocupa puede ayudarte a distinguir una necesidad de una suposición.",
    "No tienes que cargar esto a solas; una conversación segura puede ayudarte a ordenar lo que vives.",
  ],
  reflexion: [
    "Considera esta imagen como una metáfora: un camino se recorre paso a paso, sin tener que ver todo el trayecto.",
    "Imagina una conversación en la que puedes hablar con respeto y ser escuchado; identifica qué necesitas para acercarte a ella.",
    "Mirar tu situación con calma puede ayudarte a separar lo que sabes de lo que temes.",
    "Tu historia no es una condena. Puedes reconocer lo aprendido y elegir un paso diferente con ayuda.",
  ],
  palabra: [
    "Puedes recordar en tu oración que no tienes que demostrar tu valor para merecer amor y cuidado.",
    "La fe cristiana invita a buscar verdad, amor y prudencia, no a vivir pendiente de señales ocultas.",
    "Pide a Dios sabiduría para cuidar tu vida y actuar con honestidad.",
    "Una oración sencilla puede ser: «Señor, ayúdame a reconocer lo que necesito y a pedir apoyo con humildad».",
  ],
  tiempo: [
    "No podemos saber cuándo cambiará tu situación ni prometer acontecimientos. Empieza por una acción que esté a tu alcance.",
    "Durante los próximos días, reserva un momento para observar cómo te sientes y qué apoyo necesitas, sin exigir un resultado inmediato.",
    "El tiempo de un proceso es diferente para cada persona. Ora, busca orientación y avanza al ritmo que puedas sostener.",
    "Pon una fecha para revisar tus propios pasos, no para esperar una predicción: puedes ajustar tu plan con lo que aprendas.",
    "No interpretes un retraso como castigo de Dios. Considera los hechos y las opciones de ayuda disponibles.",
  ],
  senal: [
    "Observa hechos concretos: si se respetan tus límites y puedes hablar con seguridad.",
    "Nota si una práctica te ayuda a descansar, a expresarte o a pedir apoyo; úsala como información sobre tu bienestar.",
    "Contrasta una decisión con el amor, la verdad y la prudencia que enseña la fe cristiana.",
    "Una conversación honesta puede aportar claridad, sin ser una garantía sobre el futuro.",
    "Si una propuesta te presiona o te pone en peligro, detente y busca consejo confiable.",
  ],
  cierre: [
    "Puedes volver a esta reflexión cuando necesites ordenar tus ideas; no es una predicción ni una obligación.",
    "Busca compañía y orientación cuando la carga sea demasiado grande. Pedir ayuda también es cuidar tu vida.",
    "Dios puede acompañarte en este proceso, sin que tengas que atravesarlo todo a solas.",
    "Reconoce cada paso real, por pequeño que sea, y trata tu proceso con compasión.",
  ],
};

type Kind = "energia" | "tiempo" | "senales" | "mensaje" | "verso" | "vision" | "sentir" | "origen" | "consejo";

function kindOf(label: string): Kind {
  const l = label.toLowerCase();
  if (/vers[íi]culo|biblia|escritura/.test(l)) return "verso";
  if (/tiempo|cu[áa]ndo|fecha|plazo|futuro|pr[óo]xim/.test(l)) return "tiempo";
  if (/se[ñn]al|confirm|n[úu]mero|sincron/.test(l)) return "senales";
  if (/visi[óo]n|veo|imagen|revela/.test(l)) return "vision";
  if (/sient|emoci|coraz[óo]n|cuerpo/.test(l)) return "sentir";
  if (/origen|ra[íi]z|linaje|famil|patr[óo]n|herenc/.test(l)) return "origen";
  if (/mensaje|gu[íi]a|dios te|palabra/.test(l)) return "mensaje";
  if (/consejo|acci[óo]n|paso|soltar|recomend|qu[ée] hacer/.test(l)) return "consejo";
  return "energia";
}

const ORIGEN_LINES = [
  "Explora si aprendiste a callar para evitar conflictos. No podemos afirmar cómo empezó un patrón sin conocer tu historia.",
  "Recuerda qué se decía en casa sobre pedir ayuda y observa si esa idea todavía influye en tus decisiones.",
  "Puedes honrar a tu familia sin atribuirle culpas, deudas espirituales ni secretos que no has confirmado.",
  "Identifica una dinámica que reconoces en tu experiencia y una alternativa más respetuosa para tu vida.",
  "La restauración cristiana puede acompañarse de límites sanos y apoyo profesional; no exige mantenerte en una relación dañina.",
];

/** Arma una sección de 4 a 6 frases según su tipo, sin repetir piezas dentro de la respuesta. */
function compose(kind: Kind, b: Awaited<ReturnType<typeof base>>, used: Set<string>, title?: string, question?: string) {
  const r = b.r, n = b.first || "alma querida";
  const t = (arr: string[]) => take(r, arr, used).replace(/\{n\}/g, n);
  const qq = (question || "").trim().replace(/[¿?]/g, "").slice(0, 80);
  const focus = qq ? `Lo que preguntas —«${qq}»— ` : "Lo que hoy te inquieta ";
  const brain = () => { const x = b.brain.find(s => !used.has(s)); if (x) { used.add(x); return ` ${x}`; } return ""; };
  switch (kind) {
    case "energia": {
      return clean(`${t(VOICE.apertura)} ${take(r, BANK.energia[b.topic], used)} ${t(VOICE.emociones)} ${focus}toca justo este punto${title ? ` de «${title}»` : ""}.${brain()}`);
    }
    case "vision": return clean(`${t(VOICE.reflexion)} ${t(VOICE.reflexion)} ${t(VOICE.palabra)} ${focus}puede explorarse con reflexión, oración y hechos concretos.${brain()}`);
    case "sentir": return clean(`${t(VOICE.emociones)} ${t(VOICE.emociones)} ${take(r, BANK.energia[b.topic], used)} No es debilidad: es tu interior pidiendo que lo escuches.`);
    case "origen": return clean(`${t(ORIGEN_LINES)} ${t(ORIGEN_LINES)} ${t(VOICE.reflexion)}${brain()}`);
    case "tiempo": return clean(`${t(VOICE.tiempo)} ${t(VOICE.tiempo)} ${t(VOICE.tiempo)} Ninguna fecha garantiza un resultado.`);
    case "senales": return clean(`${t(VOICE.senal)} ${t(VOICE.senal)} ${t(VOICE.senal)}`);
    case "mensaje": return clean(`${t(VOICE.palabra)} ${take(r, BANK.mandato[b.topic], used)} ${t(VOICE.cierre)}${brain()}`);
    case "consejo": return clean(`${take(r, BANK.mandato[b.topic], used)} ${take(r, BANK.mandato.general, used)} ${take(r, BANK.manana, used)}`);
    case "verso": { const v = take(r, VERSES, used); return `Lectura bíblica sugerida: ${v}. Lee el pasaje completo en su contexto${question ? " y reflexiona sobre lo que preguntaste" : ""}. No es una predicción; puede acompañar tu oración y tus decisiones.`; }
  }
}

/** Respuesta de 4 puntos para cualquier consulta (incluye las creadas en el panel). */
export async function engineReading(inp: EngineInput) {
  const b = await base(inp);
  const used = new Set<string>();
  return {
    energia: compose("energia", b, used, inp.title, inp.question),
    tiempo: compose("tiempo", b, used, inp.title, inp.question),
    senales: compose("senales", b, used, inp.title, inp.question),
    mensaje: compose("mensaje", b, used, inp.title, inp.question),
    verso: take(b.r, VERSES, used),
    topic: b.topic,
    b, used,
  };
}

const TITLE_BY_KIND: Record<Kind, string[]> = {
  energia: ["Tu inquietud merece atención", "Una reflexión sobre tu bienestar", "Cómo cuidar tu bienestar hoy"],
  vision: ["Mirar tu situación con prudencia", "Distinguir los hechos de los temores", "Reflexionar sobre tu pregunta"],
  origen: ["De dónde viene lo que vives", "La raíz de lo que se repite", "Lo que tu historia te muestra"],
  sentir: ["Lo que tu corazón está cargando", "Lo que sientes y no has dicho", "Lo que tu cuerpo te avisa"],
  tiempo: ["Tus pasos para los próximos días", "Avanza a tu ritmo", "Cómo acompañar tu proceso"],
  senales: ["Hechos que puedes observar", "Discernir con prudencia", "Cómo reconocer un paso sano"],
  consejo: ["Lo que te toca hacer hoy", "Tu paso concreto", "Qué soltar y qué abrazar"],
  mensaje: ["Una reflexión para tu oración", "Esperanza desde la fe cristiana", "Tu palabra para hoy"],
  verso: ["Una palabra para sostenerte", "Tu versículo de hoy", "Escritura para tu camino"],
};
const HEADLINE: Record<Topic, string[]> = {
  pareja: ["Tu dignidad también importa en el amor", "Comprender tu relación desde el respeto", "Puedes buscar claridad sin decidir por miedo"],
  familia: ["Lo que se repite en tu familia puede terminar contigo", "Tu historia no te condena, te prepara", "Hoy puedes soltar lo que heredaste sin elegir"],
  dinero: ["Tu situación económica merece apoyo, no culpa", "Pide sabiduría y organiza tu próximo paso", "Tu dignidad no depende de tus ingresos"],
  salud: ["Tu paz vuelve cuando te escuchas de verdad", "Lo que sientes tiene un origen y tiene salida", "Tu interior te está pidiendo una pausa sagrada"],
  decision: ["La respuesta ya vive dentro de ti", "Es tiempo de elegir sin miedo", "Tu siguiente paso está más claro de lo que crees"],
  perdida: ["Puedes recordar con amor y atravesar el duelo acompañado", "Tu dolor merece cuidado y compañía", "Dios puede acompañarte en tu tristeza"],
  fe: ["Puedes acercarte a Dios con tus preguntas", "Camina con fe y pide sabiduría", "Una reflexión de fe para acompañarte"],
  general: ["Lo que necesitas saber hoy ya está aquí", "Tu camino se aclara un paso a la vez", "Hoy tu historia te habla con claridad"],
};

/** Llena las secciones definidas en el panel según su nombre; cada una con texto propio. */
export async function engineSections(inp: EngineInput, sections: { key: string; label: string; hint?: string }[]) {
  const b = await base(inp);
  const used = new Set<string>();
  const out: Record<string, string> = {};
  const titles: Record<string, string> = {};
  const order: Kind[] = ["energia", "vision", "origen", "sentir", "tiempo", "senales", "consejo", "mensaje"];
  const seen = new Set<Kind>();
  sections.forEach((s, i) => {
    let k = kindOf(`${s.label} ${s.hint ?? ""}`);
    if (seen.has(k)) k = order.find(o => !seen.has(o)) ?? order[i % order.length];
    seen.add(k);
    out[s.key] = compose(k, b, used, inp.title, inp.question);
    titles[s.key] = pick(b.r, TITLE_BY_KIND[k]);
  });
  out.__headline = pick(b.r, HEADLINE[b.topic as Topic] ?? HEADLINE.general);
  out.__titles = JSON.stringify(titles);
  return out;
}

export async function engineMinistracion(inp: EngineInput) {
  const x = await engineReading(inp);
  const b = x.b;
  return {
    headline: pick(b.r, ["Tu restauración puede empezar con un paso pequeño", "Una reflexión de fe para cuidar tu paz", "Puedes pedir ayuda y seguir caminando con Dios"]),
    dictamen: x.energia,
    linea_tiempo: x.tiempo,
    senales: [clean(pick(b.r, VOICE.senal)), clean(pick(b.r, VOICE.senal))],
    ministracion: x.mensaje,
    rompe_ciclo: clean(`${pick(b.r, ORIGEN_LINES)} ${pick(b.r, BANK.mandato.familia)} Puedes llevar este paso a la oración y pedir acompañamiento.`),
    versiculo: `Lectura bíblica sugerida: ${x.verso}. Lee el pasaje completo en su contexto.`,
  };
}

export async function enginePareja(inp: EngineInput & { partnerName?: string; partnerDob?: string }) {
  const x = await engineReading({ ...inp, scope: "pareja" });
  // Describe only the concern shared by the person; dates never determine compatibility.
  const q = (inp.question || "").toLowerCase();
  const verdict = /familia|madre|padre|repit|patr[oó]n/.test(q) ? "deuda" : /respeto|confianza|acompa[nñ]|comparti/.test(q) ? "proposito" : "leccion";
  const titles = { proposito: "Cuidar un propósito compartido", deuda: "Explorar una dinámica aprendida", leccion: "Comprender tu relación con prudencia" };
  const p = clean(inp.partnerName?.split(/\s+/)[0] || "esta persona");
  return {
    verdict, verdict_title: titles[verdict],
    summary: x.energia.replace(/La otra persona/g, p),
    pattern: verdict === "deuda" ? `Si reconoces una dinámica familiar entre tú y ${p}, explórala con ejemplos concretos y sin atribuir culpas.` : verdict === "proposito" ? `Para explorar un propósito compartido con ${p}, conversen sobre sus valores y observen si hay respeto y apoyo mutuo.` : `Reflexiona sobre cómo te sientes en tu relación con ${p}, qué necesitas expresar y cuáles límites deseas cuidar.`,
    advice: x.mensaje, next_step: x.tiempo,
  };
}

export async function enginePatrones(inp: EngineInput & { familyCount: number }) {
  const x = await engineReading({ ...inp, scope: "patrones" });
  return {
    observation: x.energia,
    patterns: ["Callar para evitar conflictos", "Cargar responsabilidades ajenas", "Miedo a recibir", "Relaciones que se repiten", "Autoexigencia heredada"].sort(() => 0.5 - Math.random()).slice(0, 4),
    reflection: `${x.mensaje} ${x.tiempo}`,
    recommendations: ["Escribe tres frases que escuchabas de niña en casa y cuál ya no quieres repetir.", "Completa tu árbol familiar en la app para ver qué se repite por cada lado.", "Practica la respiración guiada 4-4-6 antes de una conversación difícil.", "Haz una oración de perdón por tu línea familiar esta noche."],
    needs_more: inp.familyCount === 0,
  };
}

/** Registra la consulta para el panel (nunca bloquea la respuesta). */
export async function logAssistant(kind: string, userId: string | null, question: string, scopeRef?: string | null, title?: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("assistant_events").insert({ kind, user_id: userId, question: question.slice(0, 1000), scope_ref: scopeRef ?? null, title: title ?? null, keywords: keywords(question) });
  } catch { /* noop */ }
}

export async function userFrom(request: Request) {
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.getUser(token);
    return data.user?.id ?? null;
  } catch { return null; }
}
