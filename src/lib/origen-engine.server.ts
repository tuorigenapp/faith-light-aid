/**
 * Asistente ORÍGEN sin créditos: compone respuestas con bancos de frases del método,
 * el Cerebro ORÍGEN y una semilla (nombre + fecha + pregunta + día). Sin IA externa.
 */

const BANNED = /\b(tarot|cartas?|or[áa]culos?|tiradas?|arcanos?|mism[íi]simo|cabal)\b/gi;
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
const clean = (s: string) => s.replace(BANNED, "camino").replace(/\s+/g, " ").trim();

export function keywords(q = "") {
  return Array.from(new Set(q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zñ\s]/g, " ").split(/\s+/).filter(w => w.length > 3 && !STOP.has(w)))).slice(0, 8);
}

export function lifePath(dob?: string) {
  const d = (dob || "").replace(/\D/g, "");
  if (!d) return null;
  let s = d.split("").reduce((a, x) => a + Number(x), 0);
  while (s > 9 && s !== 11 && s !== 22) s = String(s).split("").reduce((a, x) => a + Number(x), 0);
  return s;
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

const PATH_TONE: Record<number, string> = {
  1: "una fuerza de inicio que necesita dar el primer paso sin pedir permiso",
  2: "una sensibilidad que percibe lo que otros callan y a veces carga lo ajeno",
  3: "una voz que se apaga cuando no se expresa y se enciende cuando se dice la verdad",
  4: "una necesidad de orden y suelo firme antes de abrir puertas nuevas",
  5: "un deseo de libertad que choca con lo que se repite por costumbre",
  6: "un corazón que cuida a todos y olvida cuidarse a sí mismo",
  7: "una búsqueda interior profunda que pide silencio para escuchar",
  8: "una autoridad personal que aprende a no cederla por miedo a perder",
  9: "un ciclo que pide cerrar con gratitud lo que ya cumplió su tiempo",
  11: "una percepción muy fina que intuye antes de que las cosas pasen",
  22: "una capacidad de construir algo grande cuando deja de dudar de sí",
};

const BANK = {
  energia: {
    general: ["Tu estado interior hoy se percibe inquieto por fuera y firme por dentro: hay una parte de ti que ya sabe la respuesta y otra que todavía la negocia.", "Se percibe cansancio de sostener sola lo que no te toca, y al mismo tiempo una claridad nueva que empezó a despertar hace poco."],
    pareja: ["Entre ustedes se percibe un lazo real, pero con un desequilibrio: una parte da más de lo que recibe y la otra se protege con distancia.", "La otra persona piensa en ti más de lo que demuestra, pero su miedo a comprometerse pesa más que su deseo en este momento."],
    familia: ["En tu entorno familiar hay una carga que se repite: alguien espera de ti un papel que no elegiste y eso drena tu paz.", "Se percibe una herida antigua en la línea familiar que todavía decide por ti en los momentos de tensión."],
    dinero: ["En lo material se percibe movimiento, pero también una duda heredada que te hace frenar justo antes de crecer.", "Hay alguien en tu entorno laboral que observa tu trabajo con más interés del que dice; no todo lo que ves es indiferencia."],
    salud: ["Tu interior pide pausa: el cuerpo está sosteniendo emociones que la mente no ha querido mirar todavía.", "Se percibe un vacío que no es falta de algo externo, sino de reconexión contigo y con Dios."],
    decision: ["La decisión ya está tomada en tu interior; lo que falta es permiso para sostenerla frente a los demás.", "Se percibe que estás dando vueltas por miedo a equivocarte, no por falta de claridad."],
    perdida: ["El dolor que cargas es amor que no encontró dónde ir. Tu interior no pide olvidar, pide un lugar nuevo para ese amor.", "Se percibe un duelo que quedó a medias, sostenido en silencio para no preocupar a otros."],
    fe: ["Tu conexión espiritual está despertando: no es que Dios esté lejos, es que estás aprendiendo a escucharlo de otra forma.", "Se percibe un llamado claro hacia un propósito, frenado por la sensación de no ser suficiente."],
  },
  tiempo: ["En los próximos 3 días algo que estaba quieto se mueve: una noticia, una conversación o una puerta que creías cerrada.", "Hacia el fin de semana vas a sentir con claridad cuál es el paso correcto; no lo fuerces antes.", "Antes de que cierre este mes se completa un ciclo que llevas tiempo sosteniendo.", "En los próximos 7 días se revela una intención que hoy está oculta; obsérvala sin reaccionar.", "Lo que se está gestando en el plano espiritual madura en las próximas dos semanas; lo invisible ya está trabajando."],
  senal: ["Vas a notar el número 11 o 111 repetido en un reloj, una placa o un recibo: es confirmación de que vas por buen camino.", "Una palabra va a repetirse en conversaciones distintas, presta atención a ella: es tu respuesta.", "Una canción que te recuerda a alguien sonará sin que la busques; tómala como recordatorio, no como orden de volver atrás.", "Si ves las 3:33 o las 4:44 en el reloj, detente un momento y respira: es momento de soltar, no de insistir.", "Una persona inesperada te va a escribir o llamar con un mensaje sencillo que te dará paz.", "Alerta: si sientes prisa por responder algo importante, espera un día. La impaciencia es tu único tropiezo esta semana."],
  mandato: {
    general: ["Suelta hoy la necesidad de que todos entiendan tu decisión. Abraza tu paz aunque a otros les incomode.", "Deja de esperar la señal perfecta: da un paso pequeño hoy y el siguiente aparecerá."],
    pareja: ["No sigas mendigando atención. Si te busca, que sea con hechos; si no, suelta con dignidad y abraza tu valor.", "Habla claro una sola vez lo que necesitas, sin reclamos. Su respuesta te dirá todo lo que necesitas saber."],
    familia: ["Pon un límite amoroso pero firme: no eres responsable de sanar a quien no quiere sanar.", "Perdona en tu interior, aunque no lo digas en voz alta. Ese perdón es para ti, no para ellos."],
    dinero: ["Cobra lo que vale tu trabajo y deja de pedir disculpas por crecer.", "Ordena hoy una sola cuenta, una sola deuda o un solo papel pendiente: el orden abre la provisión."],
    salud: ["Hoy no te exijas resolverlo todo. Descansa, respira y habla con alguien de confianza; si el malestar sigue, busca también ayuda profesional.", "Escribe lo que sientes antes de dormir. Lo que sale del pecho deja de pesar en el cuerpo."],
    decision: ["Elige lo que te da paz, no lo que te da aprobación. Decide hoy y sostén tu decisión sin explicarla de más.", "Corta lo que te mantiene en duda: una conversación pendiente, una opción que ya sabes que no es."],
    perdida: ["Honra a quien partió con un gesto concreto hoy: una vela, una oración, una carta. Luego permítete vivir.", "Suelta la culpa: hiciste lo que pudiste con lo que sabías. Abraza el amor que queda."],
    fe: ["Dedica cinco minutos hoy al silencio y la oración. Lo que buscas afuera te espera adentro.", "Deja de pedir confirmaciones y empieza a caminar: la fe se confirma en el paso."],
  },
  manana: ["Mañana presta atención a la primera conversación del día: traerá una pista importante.", "Vuelve mañana: se abre un movimiento que conviene mirar con calma.", "En las próximas horas puede llegar una prueba de paciencia; no reacciones de inmediato."],
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
        if (s.length < 50 || s.length > 220 || /\b(cap[íi]tulo|p[áa]gina|libro|autor|isbn|copyright)\b/i.test(s)) continue;
        const low = s.toLowerCase();
        const score = words.reduce((a, w) => a + (low.includes(w) ? 2 : 0), 0) + r() * 0.5;
        if (score > 0.4) sentences.push({ s: clean(s), score });
      }
    }
    return sentences.sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.s);
  } catch { return []; }
}

async function base(inp: EngineInput) {
  const words = keywords(inp.question);
  const today = new Date().toISOString().slice(0, 10);
  const r = rng(hash(`${inp.name}|${inp.birthdate}|${inp.question}|${today}|${inp.scopeRef ?? inp.scope}`));
  const topic = topicOf(words, inp.scope);
  const lp = lifePath(inp.birthdate);
  const first = (inp.name || "").trim().split(/\s+/)[0] || "";
  const brain = await brainLines(inp.scope, inp.scopeRef, words, r);
  return { words, r, topic, lp, first, brain };
}

/** Respuesta de 4 puntos para cualquier consulta (incluye las creadas en el panel). */
export async function engineReading(inp: EngineInput) {
  const b = await base(inp);
  const tone = b.lp && PATH_TONE[b.lp] ? ` Por tu fecha de nacimiento cargas ${PATH_TONE[b.lp]}.` : "";
  const focus = b.words.length ? ` Lo que preguntas sobre «${b.words.slice(0, 2).join(" y ")}» toca justo ese punto.` : "";
  const energia = clean(`${b.first ? `${b.first}, ` : ""}${pick(b.r, BANK.energia[b.topic])}${tone}${focus}${b.brain[0] ? ` ${b.brain[0]}` : ""}`);
  const tiempo = clean(`${pick(b.r, BANK.tiempo)} ${pick(b.r, BANK.tiempo.filter(Boolean))}`.replace(/(.+?\.)\s\1/, "$1"));
  const s1 = pick(b.r, BANK.senal);
  const senales = clean(`${s1} ${pick(b.r, BANK.senal.filter(x => x !== s1))}`);
  const mensaje = clean(`${pick(b.r, BANK.mandato[b.topic])}${b.brain[1] ? ` ${b.brain[1]}` : ""} ${pick(b.r, BANK.manana)}`);
  return { energia, tiempo, senales, mensaje, verso: pick(b.r, VERSES), topic: b.topic };
}

/** Llena las secciones definidas en el panel según su nombre. */
export async function engineSections(inp: EngineInput, sections: { key: string; label: string; hint?: string }[]) {
  const x = await engineReading(inp);
  const pool = [x.energia, x.tiempo, x.senales, x.mensaje];
  const out: Record<string, string> = {};
  sections.forEach((s, i) => {
    const l = `${s.label} ${s.hint ?? ""}`.toLowerCase();
    out[s.key] = /energ|vibra|canaliz|situaci|present|hoy/.test(l) ? x.energia
      : /tiempo|cu[áa]ndo|fecha|plazo|futuro/.test(l) ? x.tiempo
      : /se[ñn]al|confirm|n[úu]mero/.test(l) ? x.senales
      : /mensaje|gu[íi]a|consejo|acci[óo]n|paso|soltar/.test(l) ? x.mensaje
      : /vers[íi]culo|palabra|biblia/.test(l) ? `«Confía en el Señor con todo tu corazón» — ${x.verso}`
      : pool[i % pool.length];
  });
  return out;
}

export async function engineMinistracion(inp: EngineInput) {
  const x = await engineReading(inp);
  const b = await base(inp);
  const lado = b.r() > 0.5 ? "materno" : "paterno";
  const sv = (s: string) => s.replace(/vibraci[óo]n|energ[íi]a/gi, "condición");
  return {
    headline: pick(b.r, ["Hoy el Cielo te pide soltar para recibir", "Lo que esperas ya está en camino", "Tu restauración empieza con una decisión", "Es tiempo de cerrar un ciclo con amor"]),
    dictamen: sv(x.energia),
    linea_tiempo: x.tiempo,
    senales: [pick(b.r, ["Una conversación honesta con alguien cercano te confirmará lo que ya intuías.", "Sentirás paz al tomar una decisión que venías aplazando."]), pick(b.r, ["Llegará una respuesta práctica por un canal normal: un mensaje o una llamada.", "Notarás que reaccionas distinto ante algo que antes te alteraba."])],
    ministracion: x.mensaje,
    rompe_ciclo: `Del lado ${lado} viene un patrón que se repite: callar lo que duele para mantener la paz de otros, y pagar con la propia. Tú no tienes que seguir cargándolo. Sana la idea de que amar es aguantar; suelta la culpa de poner límites. Cierra la conversación pendiente —aunque sea por escrito y sin enviarla— con quien te enseñó a callar. Hoy deja de justificar lo que te hiere. La instrucción es simple: di la verdad con amor una vez, y sostenla.`,
    versiculo: `«He aquí que yo hago cosa nueva» — ${pick(b.r, VERSES)}`,
  };
}

export async function enginePareja(inp: EngineInput & { partnerName?: string; partnerDob?: string }) {
  const x = await engineReading({ ...inp, scope: "pareja" });
  const a = lifePath(inp.birthdate) ?? 0, c = lifePath(inp.partnerDob) ?? 0;
  const v = ((a + c) % 3) as 0 | 1 | 2;
  const verdict = (["proposito", "deuda", "leccion"] as const)[v];
  const titles = { proposito: "Relación de Propósito de Alma", deuda: "Patrón Heredado del Linaje", leccion: "Lección de Vida Compartida" };
  const p = inp.partnerName?.split(/\s+/)[0] || "esta persona";
  return {
    verdict, verdict_title: titles[verdict],
    summary: x.energia.replace(/La otra persona/g, p),
    pattern: verdict === "deuda" ? `Se observa que entre tú y ${p} podría repetirse una dinámica de tu familia: uno persigue y el otro se aleja.` : verdict === "proposito" ? `Se observa un camino compartido: ${p} y tú se impulsan cuando dejan de competir y empiezan a acompañarse.` : `Se observa una lección clara: ${p} llega a mostrarte dónde te pierdes a ti misma por complacer.`,
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
