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

function nonce() {
  try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0]; } catch { return Math.floor(Math.random() * 4294967295); }
}

async function base(inp: EngineInput) {
  const words = keywords(inp.question);
  // Semilla única por consulta + petición: nunca dos respuestas iguales.
  const r = rng(hash(`${inp.name}|${inp.birthdate}|${inp.question}|${inp.scopeRef ?? inp.scope}|${Date.now()}|${nonce()}`));
  const topic = topicOf(words, inp.scope);
  const lp = lifePath(inp.birthdate);
  const first = (inp.name || "").trim().split(/\s+/)[0] || "";
  const brain = await brainLines(inp.scope, inp.scopeRef, words, r);
  return { words, r, topic, lp, first, brain };
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
    "Al sostener tu nombre en silencio, {n}, lo primero que llega es una imagen muy nítida.",
    "{n}, cuando me conecto con lo que escribiste, el ambiente se vuelve denso y luego se abre, como una ventana que alguien empuja desde afuera.",
    "Antes de leer tu pregunta completa ya sentí el peso que traes, {n}.",
    "{n}, me detengo en tu nombre y percibo que no es la primera vez que haces esta pregunta; la has repetido muchas noches por dentro.",
    "Lo que tu historia muestra hoy, {n}, llega con fuerza y sin rodeos.",
    "{n}, al abrir esta lectura siento calor en las manos: es señal de que lo que viene es verdad y necesitas escucharlo así, directo.",
    "Respiro contigo un momento, {n}, y lo que se presenta primero no es miedo, es cansancio.",
  ],
  clarisintencia: [
    "Siento una presión en el pecho, del lado izquierdo: es lo que estás guardando para no preocupar a nadie.",
    "Percibo un nudo en el estómago cada vez que piensas en esto; tu cuerpo lo sabe antes que tu mente.",
    "Me llega una sensación de frío en la espalda, como quien carga algo que no le pertenece desde hace años.",
    "Siento que la garganta se te cierra cuando intentas decir lo que de verdad quieres; ahí está el bloqueo.",
    "Hay una tensión en los hombros que no es física: es la responsabilidad de sostener a otros mientras nadie te sostiene a ti.",
    "Percibo un latido acelerado al final del día, justo cuando todo queda en silencio y vuelve el pensamiento.",
  ],
  vision: [
    "Veo una puerta entreabierta con luz al otro lado, y tú de pie sin decidir cruzar.",
    "Se me muestra un camino de tierra que se divide en dos; uno está iluminado y el otro es el conocido.",
    "Veo una mesa con una silla vacía: alguien o algo dejó un espacio que todavía no has vuelto a ocupar.",
    "Aparece la imagen de una ventana con lluvia que se detiene de golpe y deja ver un cielo limpio.",
    "Veo tus manos soltando una cuerda muy gastada; del otro lado no hay caída, hay suelo firme.",
    "Se presenta un reloj detenido que vuelve a avanzar: algo que estaba pausado en tu vida retoma su curso.",
    "Veo una casa con las luces encendidas y una conversación pendiente en la cocina.",
    "Aparece un sobre cerrado sobre una mesa: es una noticia que ya está escrita y aún no llega a tus manos.",
  ],
  clariaudiencia: [
    "Escucho con claridad una frase: «ya no tienes que demostrar nada».",
    "Llega una palabra que se repite tres veces: «suelta, suelta, suelta».",
    "Oigo una voz suave que dice: «lo que es para ti no se va a perder aunque te detengas a respirar».",
    "Escucho: «no es un castigo, es una preparación».",
    "Me llega la frase: «deja de pedir permiso para estar en paz».",
    "Escucho tu propio nombre dicho con ternura, como lo diría alguien que te ama y ya no está cerca.",
  ],
  tiempo: [
    "En los próximos 3 días algo que estaba quieto se mueve: una noticia, una conversación o una puerta que creías cerrada.",
    "Hacia el fin de semana vas a sentir con claridad cuál es el paso correcto; no lo fuerces antes.",
    "Antes de que termine este mes se completa un ciclo que llevas tiempo sosteniendo.",
    "En los próximos 7 días se revela una intención que hoy está oculta; obsérvala sin reaccionar.",
    "En unas dos semanas madura lo que hoy se está gestando en silencio.",
    "Un martes o un jueves cercano llega una respuesta por un canal sencillo: un mensaje, una llamada o un encuentro casual.",
    "En 21 días vas a mirar atrás y notarás que esta pregunta ya no te pesa igual.",
    "Al cambiar la luna, en los próximos días, se cierra una etapa y se abre otra más liviana.",
  ],
  senal: [
    "Vas a notar el 11:11 o el 111 repetido en un reloj, una placa o un recibo: es confirmación de que vas por buen camino.",
    "Una palabra va a repetirse en conversaciones distintas; presta atención a ella, es tu respuesta.",
    "Una canción que te recuerda a alguien sonará sin que la busques; tómala como recordatorio, no como orden de volver atrás.",
    "Si ves las 3:33 o las 4:44 en el reloj, detente y respira: es momento de soltar, no de insistir.",
    "Una persona inesperada te escribirá con un mensaje sencillo que te dará paz.",
    "Verás una pluma blanca o una mariposa cerca de tu casa; es señal de protección.",
    "Vas a encontrar una moneda o un objeto perdido: lo que creías perdido vuelve de otra forma.",
    "Soñarás con agua clara; ese sueño confirma limpieza en lo que hoy te preocupa.",
    "Alerta: si sientes prisa por responder algo importante, espera un día. La impaciencia es tu único tropiezo esta semana.",
    "El número 7 aparecerá en una fecha, una dirección o una cuenta; marca el día en que llega el cambio.",
  ],
  cierre: [
    "No estás sola en esto; lo que hoy se te muestra es para que camines más liviana.",
    "Confía en lo que sentiste al leer estas palabras: esa reacción es tu verdad.",
    "Guarda esta lectura y vuelve a ella en una semana; vas a reconocer lo que se cumplió.",
    "Tu historia no termina aquí, está cambiando de capítulo.",
    "Lo que se rompe hoy deja espacio para algo que sí te corresponde.",
  ],
};

const ESSENCE: Record<number, string> = {
  1: "Tu esencia trae fuerza de inicio: te toca abrir el camino sin esperar aprobación.",
  2: "Tu esencia es sensible: percibes lo que otros callan y por eso terminas cargando lo ajeno.",
  3: "Tu esencia es expresiva: cuando callas te apagas y cuando hablas con verdad todo se ordena.",
  4: "Tu esencia busca suelo firme: necesitas orden antes de abrir puertas nuevas.",
  5: "Tu esencia pide libertad y choca con lo que se repite por costumbre.",
  6: "Tu esencia cuida a todos y olvida cuidarse a sí misma.",
  7: "Tu esencia es profunda: necesitas silencio para escuchar lo que Dios ya te está diciendo.",
  8: "Tu esencia tiene autoridad: tu reto es no cederla por miedo a perder.",
  9: "Tu esencia está cerrando ciclos: te toca soltar con gratitud lo que ya cumplió su tiempo.",
  11: "Tu esencia intuye antes de que las cosas pasen; no dudes de lo que presientes.",
  22: "Tu esencia construye en grande cuando deja de dudar de sí.",
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
  "Esto no empezó contigo. Del lado materno viene una forma de amar que aguanta en silencio, y tú la aprendiste antes de saber hablar.",
  "En tu línea paterna se repite la idea de que pedir es debilidad; por eso te cuesta recibir aunque lo necesites.",
  "Se muestra una abuela o bisabuela que tuvo que callar algo grande para proteger a la familia; esa lealtad invisible sigue viva en ti.",
  "Hay un patrón de abandono que se repite cada generación de forma distinta: a veces es alguien que se va, a veces es alguien que está pero no se queda emocionalmente.",
  "Tu familia te enseñó a ser fuerte para todos; hoy tu historia te pide ser fuerte para ti.",
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
      const ess = b.lp && ESSENCE[b.lp] && !used.has("ess") ? (used.add("ess"), ` ${ESSENCE[b.lp]}`) : "";
      return clean(`${t(VOICE.apertura)} ${take(r, BANK.energia[b.topic], used)} ${t(VOICE.clarisintencia)}${ess} ${focus}toca justo este punto${title ? ` de «${title}»` : ""}.${brain()}`);
    }
    case "vision": return clean(`${t(VOICE.vision)} ${t(VOICE.vision)} ${t(VOICE.clariaudiencia)} ${focus}tiene respuesta, y esa imagen es la respuesta.${brain()}`);
    case "sentir": return clean(`${t(VOICE.clarisintencia)} ${t(VOICE.clarisintencia)} ${take(r, BANK.energia[b.topic], used)} No es debilidad: es tu interior pidiendo que lo escuches.`);
    case "origen": return clean(`${t(ORIGEN_LINES)} ${t(ORIGEN_LINES)} ${t(VOICE.vision)}${brain()}`);
    case "tiempo": return clean(`${t(VOICE.tiempo)} ${t(VOICE.tiempo)} ${t(VOICE.tiempo)} No adelantes lo que todavía se está acomodando.`);
    case "senales": return clean(`${t(VOICE.senal)} ${t(VOICE.senal)} ${t(VOICE.senal)}`);
    case "mensaje": return clean(`${t(VOICE.clariaudiencia)} ${take(r, BANK.mandato[b.topic], used)} ${t(VOICE.cierre)}${brain()}`);
    case "consejo": return clean(`${take(r, BANK.mandato[b.topic], used)} ${take(r, BANK.mandato.general, used)} ${take(r, BANK.manana, used)}`);
    case "verso": { const v = take(r, VERSES, used); return `«Confía en el Señor con todo tu corazón y no te apoyes en tu propia prudencia» — ${v}. Lee este pasaje esta noche${question ? " pensando en lo que preguntaste" : ""}; una frase te hablará directo.`; }
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
  energia: ["Lo que se percibe en ti hoy", "Tu estado interior en este momento", "Cómo está tu energía hoy"],
  vision: ["Lo que se revela de tu situación", "Lo que se ve con claridad", "Lo que hay detrás de tu pregunta"],
  origen: ["De dónde viene lo que vives", "La raíz de lo que se repite", "Lo que tu historia te muestra"],
  sentir: ["Lo que tu corazón está cargando", "Lo que sientes y no has dicho", "Lo que tu cuerpo te avisa"],
  tiempo: ["Lo que viene en los próximos días", "Tu línea de tiempo", "Cuándo se mueve lo que esperas"],
  senales: ["Señales para confirmar", "Presta atención a esto", "Lo que te va a confirmar el camino"],
  consejo: ["Lo que te toca hacer hoy", "Tu paso concreto", "Qué soltar y qué abrazar"],
  mensaje: ["El mensaje de tus guías", "Lo que Dios quiere que escuches", "Tu palabra para hoy"],
  verso: ["Una palabra para sostenerte", "Tu versículo de hoy", "Escritura para tu camino"],
};
const HEADLINE: Record<Topic, string[]> = {
  pareja: ["El amor que buscas empieza por cómo te tratas a ti", "Lo que está entre ustedes ya se está revelando", "Tu corazón merece una respuesta clara"],
  familia: ["Lo que se repite en tu familia puede terminar contigo", "Tu historia no te condena, te prepara", "Hoy puedes soltar lo que heredaste sin elegir"],
  dinero: ["Tu abundancia se desbloquea cuando dejas de dudar", "La puerta que esperas ya se está moviendo", "Mereces crecer sin pedir permiso"],
  salud: ["Tu paz vuelve cuando te escuchas de verdad", "Lo que sientes tiene un origen y tiene salida", "Tu interior te está pidiendo una pausa sagrada"],
  decision: ["La respuesta ya vive dentro de ti", "Es tiempo de elegir sin miedo", "Tu siguiente paso está más claro de lo que crees"],
  perdida: ["El amor que perdiste sigue vivo de otra forma", "Tu dolor también es un camino de regreso a ti", "Lo que partió te dejó una misión"],
  fe: ["Dios no se ha ido: te está hablando distinto", "Tu propósito está despertando", "Hoy el Cielo te responde"],
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
