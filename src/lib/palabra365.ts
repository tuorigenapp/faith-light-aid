/**
 * Palabras para ti hoy — Palabra del día.
 * 365 entradas (una por día del año), iguales para todos los usuarios ese día.
 * ORIGEN no es una religión: es una invitación a relacionarte con Dios desde
 * el amor, la paz y la sanación. Nadie debe sentirse intimidado por esto.
 */

export type Palabra = {
  day: number; // 1-365
  title: string;
  intro: string;
  passage: { reference: string; text: string };
  reflection: string;
  advice: string;
  closing: string;
};

const CLOSING = "Palabra de Dios a través de ORÍGEN";

/** 61 pasajes bíblicos reales, citados con fidelidad (estilo Reina-Valera). */
const PASSAGES: { reference: string; text: string }[] = [
  { reference: "Salmos 23:1-3", text: "Jehová es mi pastor; nada me faltará.\n\nEn lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.\n\nConfortará mi alma; me guiará por sendas de justicia por amor de su nombre." },
  { reference: "Isaías 41:10", text: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia." },
  { reference: "Mateo 11:28-30", text: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.\n\nLlevad mi yugo sobre vosotros, y aprended de mí, que soy manso y humilde de corazón; y hallaréis descanso para vuestras almas.\n\nPorque mi yugo es fácil, y ligera mi carga." },
  { reference: "Juan 3:16", text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna." },
  { reference: "Romanos 8:28", text: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados." },
  { reference: "Proverbios 3:5-6", text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.\n\nReconócelo en todos tus caminos, y él enderezará tus veredas." },
  { reference: "Filipenses 4:6-7", text: "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.\n\nY la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús." },
  { reference: "Salmos 34:18", text: "Cercano está Jehová a los quebrantados de corazón; y salva a los contritos de espíritu." },
  { reference: "Isaías 43:1-2", text: "No temas, porque yo te redimí; te puse nombre, mío eres tú.\n\nCuando pases por las aguas, yo estaré contigo; y si por los ríos, no te anegarán.\n\nCuando pases por el fuego, no te quemarás, ni la llama arderá en ti." },
  { reference: "Lamentaciones 3:22-23", text: "Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias.\n\nNuevas son cada mañana; grande es tu fidelidad." },
  { reference: "Salmos 46:1", text: "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones." },
  { reference: "Josué 1:9", text: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas." },
  { reference: "Romanos 12:2", text: "No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta." },
  { reference: "Salmos 139:13-14", text: "Porque tú formaste mis entrañas; tú me hiciste en el vientre de mi madre.\n\nTe alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien." },
  { reference: "Juan 14:27", text: "La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo." },
  { reference: "2 Corintios 5:17", text: "De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas." },
  { reference: "Salmos 121:1-2", text: "Alzaré mis ojos a los montes; ¿de dónde vendrá mi socorro?\n\nMi socorro viene de Jehová, que hizo los cielos y la tierra." },
  { reference: "Efesios 2:8-9", text: "Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios.\n\nNo por obras, para que nadie se gloríe." },
  { reference: "Gálatas 6:9", text: "No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos, si no desmayamos." },
  { reference: "Salmos 51:10", text: "Crea en mí, oh Dios, un corazón limpio, y renueva un espíritu recto dentro de mí." },
  { reference: "Isaías 40:31", text: "Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán." },
  { reference: "1 Corintios 13:4-7", text: "El amor es sufrido, es benigno; el amor no tiene envidia, no es jactancioso, no se envanece.\n\nNo hace nada indebido, no busca lo suyo, no se irrita, no guarda rencor.\n\nTodo lo sufre, todo lo cree, todo lo espera, todo lo soporta." },
  { reference: "Salmos 91:1-2", text: "El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente.\n\nDiré yo a Jehová: Esperanza mía, y castillo mío; mi Dios, en quien confiaré." },
  { reference: "Jeremías 29:11", text: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis." },
  { reference: "Mateo 6:33-34", text: "Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.\n\nAsí que, no os afanéis por el día de mañana, porque el día de mañana traerá su afán." },
  { reference: "Salmos 27:1", text: "Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién he de atemorizarme?" },
  { reference: "Romanos 15:13", text: "Y el Dios de esperanza os llene de todo gozo y paz en el creer, para que abundéis en esperanza por el poder del Espíritu Santo." },
  { reference: "Colosenses 3:23", text: "Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres." },
  { reference: "Salmos 103:2-5", text: "Bendice, alma mía, a Jehová, y no olvides ninguno de sus beneficios.\n\nÉl es quien perdona todas tus iniquidades, el que sana todas tus dolencias.\n\nÉl es quien rescata del hoyo tu vida, el que te corona de favores y misericordias." },
  { reference: "Deuteronomio 31:6", text: "Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo de ellos, porque Jehová tu Dios es el que va contigo; no te dejará ni te desamparará." },
  { reference: "Santiago 1:2-4", text: "Hermanos míos, tened por sumo gozo cuando os halléis en diversas pruebas.\n\nSabiendo que la prueba de vuestra fe produce paciencia.\n\nMas tenga la paciencia su obra completa, para que seáis perfectos y cabales, sin que os falte cosa alguna." },
  { reference: "Salmos 37:4-5", text: "Deléitate asimismo en Jehová, y él te concederá las peticiones de tu corazón.\n\nEncomienda a Jehová tu camino, y confía en él; y él hará." },
  { reference: "Juan 15:5", text: "Yo soy la vid, vosotros los pámpanos; el que permanece en mí, y yo en él, este lleva mucho fruto; porque separados de mí nada podéis hacer." },
  { reference: "1 Pedro 5:7", text: "Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros." },
  { reference: "Salmos 30:5", text: "Porque un momento será su ira, pero su favor dura toda una vida. Por la noche durará el lloro, y a la mañana vendrá la alegría." },
  { reference: "Hebreos 11:1", text: "Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve." },
  { reference: "Isaías 26:3", text: "Tú guardarás en completa paz a aquel cuyo pensamiento en ti persevera; porque en ti ha confiado." },
  { reference: "Filipenses 4:13", text: "Todo lo puedo en Cristo que me fortalece." },
  { reference: "Salmos 34:8", text: "Gustad, y ved que es bueno Jehová; dichoso el hombre que confía en él." },
  { reference: "Mateo 5:4", text: "Bienaventurados los que lloran, porque ellos recibirán consolación." },
  { reference: "Salmos 143:8", text: "Hazme oír por la mañana tu misericordia, porque en ti he confiado; hazme saber el camino por donde ande, porque a ti he elevado mi alma." },
  { reference: "Romanos 5:3-5", text: "Y no solo esto, sino que también nos gloriamos en las tribulaciones, sabiendo que la tribulación produce paciencia.\n\nY la paciencia, prueba; y la prueba, esperanza.\n\nY la esperanza no avergüenza; porque el amor de Dios ha sido derramado en nuestros corazones." },
  { reference: "Salmos 16:11", text: "Me mostrarás la senda de la vida; en tu presencia hay plenitud de gozo; delicias a tu diestra para siempre." },
  { reference: "Números 6:24-26", text: "Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti, y tenga de ti misericordia; Jehová alce sobre ti su rostro, y ponga en ti paz." },
  { reference: "1 Juan 4:18-19", text: "En el amor no hay temor, sino que el perfecto amor echa fuera el temor.\n\nNosotros le amamos a él, porque él nos amó primero." },
  { reference: "Salmos 55:22", text: "Echa sobre Jehová tu carga, y él te sustentará; no dejará para siempre caído al justo." },
  { reference: "Eclesiastés 3:1", text: "Todo tiene su tiempo, y todo lo que se quiere debajo del cielo tiene su hora." },
  { reference: "Salmos 42:11", text: "¿Por qué te abates, oh alma mía, y te turbas dentro de mí? Espera a Dios; porque aún he de alabarle, salvación mía y Dios mío." },
  { reference: "Efesios 3:17-19", text: "Que arraigados y cimentados en amor, seáis plenamente capaces de comprender con todos los santos cuál sea la anchura, la longitud, la profundidad y la altura.\n\nY de conocer el amor de Cristo, que excede a todo conocimiento, para que seáis llenos de toda la plenitud de Dios." },
  { reference: "Salmos 62:5-6", text: "Alma mía, en Dios solamente reposa, porque de él es mi esperanza.\n\nÉl solamente es mi roca y mi salvación; es mi refugio, no resbalaré." },
  { reference: "Mateo 7:7-8", text: "Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá.\n\nPorque todo aquel que pide, recibe; y el que busca, halla; y al que llama, se le abrirá." },
  { reference: "Rut 1:16", text: "No me ruegues que te deje, y me aparte de ti; porque a dondequiera que tú fueres, iré yo, y dondequiera que vivieres, viviré." },
  { reference: "Salmos 73:26", text: "Mi carne y mi corazón desfallecen; mas la roca de mi corazón y mi porción es Dios para siempre." },
  { reference: "2 Timoteo 1:7", text: "Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio." },
  { reference: "Salmos 126:5-6", text: "Los que sembraron con lágrimas, con regocijo segarán.\n\nIrá andando y llorando el que lleva la preciosa semilla; mas volverá a venir con regocijo, trayendo sus gavillas." },
  { reference: "Génesis 50:20", text: "Vosotros pensasteis mal contra mí, mas Dios lo encaminó a bien, para hacer lo que vemos hoy, para mantener en vida a mucho pueblo." },
  { reference: "Salmos 90:12", text: "Enséñanos de tal modo a contar nuestros días, que traigamos al corazón sabiduría." },
  { reference: "Nehemías 8:10", text: "No os entristezcáis, porque el gozo de Jehová es vuestra fuerza." },
  { reference: "Miqueas 6:8", text: "Solamente hacer justicia, y amar misericordia, y humillarte ante tu Dios." },
  { reference: "1 Tesalonicenses 5:16-18", text: "Estad siempre gozosos.\n\nOrad sin cesar.\n\nDad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús." },
  { reference: "Salmos 145:18", text: "Cercano está Jehová a todos los que le invocan, a todos los que le invocan de veras." },
  { reference: "Apocalipsis 21:4", text: "Enjugará Dios toda lágrima de los ojos de ellos; y ya no habrá muerte, ni habrá más llanto, ni clamor, ni dolor." },
];

const THEMES = [
  "confianza", "paz interior", "gratitud", "esperanza", "sanidad emocional", "propósito",
  "descanso", "identidad", "perdón", "gracia", "fortaleza", "renovación", "presencia",
  "familia", "raíces", "libertad", "paciencia", "fe silenciosa", "amor propio", "consuelo",
  "provisión", "valentía", "quietud", "restauración", "abundancia interior", "dirección",
  "certeza", "gozo profundo", "sabiduría", "reconciliación", "nuevos comienzos", "constancia",
  "humildad", "compasión", "unión familiar", "sanidad del linaje", "verdad", "protección",
  "paciencia activa", "raíces sanas", "aceptación", "voz interior", "asombro", "cuidado",
  "resiliencia", "ternura", "claridad", "arraigo", "propósito compartido", "memoria sanada",
  "gratitud diaria", "silencio fértil", "coraje tranquilo", "esperanza renovada", "luz interior",
  "camino propio", "descanso del alma", "raíz de paz", "confianza plena", "vínculos sanos",
  "presencia constante", "nueva mirada", "gracia diaria", "fuerza serena", "entrega",
  "libertad interior", "cercanía", "guía", "asombro cotidiano", "raíz firme", "corazón nuevo",
  "camino con sentido", "esperanza que sostiene",
];

const REFLECTION_TEMPLATES = [
  (t: string) =>
    `Cuando hablamos de ${t}, no hablamos de una idea lejana, sino de algo que puede tocar tu día concreto. A veces cargamos con historias, silencios y heridas que no elegimos, y por eso este pasaje no busca convencerte de nada: solo te recuerda que hay una presencia que sostiene incluso lo que tú todavía no logras nombrar. No necesitas tener todas las respuestas ni sentirte "suficientemente espiritual" para que esto te alcance. Basta con estar dispuesto a mirar hacia adentro un instante. En ese instante, algo se acomoda.`,
  (t: string) =>
    `Hay días en que ${t} parece un lujo lejano, algo reservado para otros que "ya lo resolvieron". Pero la vida real no funciona así: se construye en pequeños actos de honestidad con uno mismo. Este pasaje no te pide perfección, te invita a un movimiento simple: soltar el control por un momento y permitir que algo más grande que tu ansiedad tenga espacio. No es resignación, es descanso. Y desde el descanso, incluso lo difícil se vuelve más llevadero.`,
  (t: string) =>
    `${t.charAt(0).toUpperCase() + t.slice(1)} no se impone, se cultiva. Igual que una raíz que crece despacio bajo tierra antes de mostrarse en la superficie, lo que hoy sientes moverse dentro de ti está echando raíces, aunque no lo veas todavía. Este pasaje ha acompañado a personas de generaciones distintas, en momentos de duda y de certeza, y sigue diciendo lo mismo: no estás solo en esto. Sea cual sea tu historia familiar, hoy puedes elegir mirarla con otros ojos.`,
  (t: string) =>
    `A veces la mente corre más rápido que el corazón, y ahí es donde ${t} se vuelve necesaria: no como una emoción pasajera, sino como una decisión diaria de volver al centro. No se trata de negar lo que duele, sino de no quedarte a vivir permanentemente ahí. Este pasaje te ofrece una imagen sencilla y honesta de lo que significa ser sostenido, incluso cuando tú sientes que no tienes fuerzas para sostenerte a ti mismo.`,
  (t: string) =>
    `Piensa en ${t} como un lugar al que puedes volver, no como una meta que debas alcanzar de una vez. Nadie llega ahí de forma permanente; se visita, se pierde, se recupera. Lo importante no es no caerte, sino saber que hay una mano dispuesta a sostenerte cada vez que decides levantarte otra vez. Este pasaje lo dice con palabras sencillas porque lo profundo, casi siempre, se dice sin adornos.`,
];

const ADVICE_TEMPLATES = [
  (t: string) => `Consejo espiritual: hoy busca un espacio de cinco minutos en silencio y pregúntate en voz baja qué necesitas soltar para vivir un poco más cerca de la ${t}. No busques resolverlo todo, solo nómbralo.`,
  (t: string) => `Consejo espiritual: elige una sola acción pequeña hoy que refleje ${t} — una llamada, un perdón pendiente, una pausa — y hazla sin esperar un resultado inmediato.`,
  (t: string) => `Consejo espiritual: antes de dormir, agradece por tres cosas concretas del día, aunque hayan sido pequeñas. La gratitud abre espacio para la ${t}.`,
  (t: string) => `Consejo espiritual: si hoy sientes ansiedad, respira profundo tres veces y repite mentalmente esta palabra como ancla. No tienes que sentirte listo para recibir ${t}, solo dispuesto.`,
  (t: string) => `Consejo espiritual: escribe en un papel una frase que resuma lo que hoy leíste, y llévala contigo. Volver a leerla en un momento difícil puede devolverte a la ${t}.`,
  (t: string) => `Consejo espiritual: hoy evita juzgarte por lo que sientes. Obsérvalo con curiosidad, como quien observa el clima, y deja que la ${t} llegue a su propio ritmo.`,
  (t: string) => `Consejo espiritual: comparte con alguien de confianza una frase de esta palabra. Lo que se comparte, muchas veces, se multiplica en ${t} para ambos.`,
];

const TITLE_TEMPLATES = [
  (t: string) => `Hoy es un buen día para la ${t}`,
  (t: string) => `Una palabra para tu ${t}`,
  (t: string) => `${t.charAt(0).toUpperCase() + t.slice(1)}: la palabra de hoy`,
  (t: string) => `Vuelve hoy a tu ${t}`,
  (t: string) => `Un espacio para la ${t}`,
];

const INTRO_TEMPLATES = [
  (t: string) => `ORIGEN no te pide creer nada de golpe, solo te invita a recibir una palabra hoy. No es un dogma, es una relación: la de un Dios que se acerca sin exigir nada a cambio. Hoy, esa cercanía tiene que ver con la ${t}.`,
  (t: string) => `Cada día, esta palabra es la misma para todos los que la abren, porque hay verdades que no cambian según el momento. Hoy te acompaña un pasaje sobre ${t}, para que lo lleves contigo sin apuro.`,
  (t: string) => `No importa en qué punto de tu camino estés hoy: creyente, dudoso o simplemente curioso. Esta palabra busca un lugar sencillo en tu día, cerca de la ${t}.`,
  (t: string) => `A veces basta una frase leída a tiempo para cambiar el tono de un día entero. Hoy esa frase tiene que ver con la ${t}, y está aquí para ti, tal como eres.`,
];

function buildEntry(day: number): Palabra {
  const passage = PASSAGES[(day - 1) % PASSAGES.length];
  const theme = THEMES[(day - 1) % THEMES.length];
  const reflectionFn = REFLECTION_TEMPLATES[(day - 1) % REFLECTION_TEMPLATES.length];
  const adviceFn = ADVICE_TEMPLATES[(day - 1) % ADVICE_TEMPLATES.length];
  const titleFn = TITLE_TEMPLATES[(day - 1) % TITLE_TEMPLATES.length];
  const introFn = INTRO_TEMPLATES[(day - 1) % INTRO_TEMPLATES.length];

  return {
    day,
    title: titleFn(theme),
    intro: introFn(theme),
    passage,
    reflection: reflectionFn(theme),
    advice: adviceFn(theme),
    closing: CLOSING,
  };
}

const CACHE = new Map<number, Palabra>();

/** Día del año (1-366) para una fecha dada (por defecto hoy, hora local). */
export function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000) + 1;
}

/** Devuelve la palabra correspondiente a un día del año (1-365/366), ciclando si excede 365. */
export function getPalabraForDay(day: number): Palabra {
  const normalized = ((day - 1) % 365) + 1;
  if (!CACHE.has(normalized)) CACHE.set(normalized, buildEntry(normalized));
  return CACHE.get(normalized)!;
}

/** La palabra de hoy, igual para todos los usuarios en la misma fecha. */
export function getPalabraHoy(): Palabra {
  return getPalabraForDay(dayOfYear());
}

/** Texto listo para compartir. */
export function palabraShareText(p: Palabra): string {
  return [
    `✨ ${p.title} — ORÍGEN`,
    "",
    p.intro,
    "",
    `📖 ${p.passage.reference}`,
    p.passage.text,
    "",
    "💭 Reflexión",
    p.reflection,
    "",
    "🕊️ " + p.advice,
    "",
    p.closing,
    "",
    "(Comparte, que se difunda la Palabra de Dios de Hoy)",
  ].join("\n");
}
