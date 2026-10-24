/** Theme-specific legacy fallbacks; no AI requests and no image generation. */
export type PracticeContent = { affirmation: string; lesson: string; exercise: string; tasks: string[]; search_words: string[]; quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[] };
type Theme = { match: RegExp; emoji: string; tone: string; words: string[]; action: string; avoid: string; truth: string };
const THEMES: Theme[] = [
  { match: /narcisis|abuso|manipula|limites/, emoji: "🛡️", tone: "bg-accent-blue/15 text-accent-blue", words: ["LIMITES", "RESPETO", "APOYO", "SEGURIDAD", "DIGNIDAD", "DECISION", "VERDAD", "CUIDADO"], action: "identificar una conducta que no aceptarás y preparar un límite seguro con apoyo", avoid: "confrontar a una persona violenta sin apoyo", truth: "La fe no te obliga a tolerar abuso; protegerte y buscar ayuda es válido." },
  { match: /pareja|amor|relacion|vincul/, emoji: "🤝", tone: "bg-accent-pink/15 text-accent-pink", words: ["DIALOGO", "ESCUCHA", "ACUERDO", "RESPETO", "VINCULO", "CUIDADO", "EMPATIA", "CONFIAR"], action: "expresar una necesidad concreta sin acusaciones y escuchar la respuesta", avoid: "suponer lo que la otra persona piensa sin preguntarle", truth: "Una relación sana necesita respeto, escucha y acuerdos, no control." },
  { match: /dinero|deuda|abundancia|provision|finanza|prosper/, emoji: "🌱", tone: "bg-accent-green/15 text-accent-green", words: ["AHORRO", "PRESUPUESTO", "ORDEN", "PROVISION", "RECURSOS", "TRABAJO", "PRIORIDAD", "GENEROSO"], action: "revisar un gasto real y decidir una prioridad para tu presupuesto", avoid: "gastar por impulso o esperar dinero sin organizar tus recursos", truth: "Confiar en la provisión de Dios también implica administrar con responsabilidad." },
  { match: /trabajo|negocio|empleo|profesion/, emoji: "💼", tone: "bg-accent-blue/15 text-accent-blue", words: ["OFICIO", "SERVICIO", "ESFUERZO", "ENFOQUE", "EQUIPO", "HORARIO", "ORDEN", "HONESTO"], action: "elegir una tarea laboral pendiente y reservar un tiempo concreto para realizarla", avoid: "medir tu valor solamente por tu productividad", truth: "El trabajo con integridad deja espacio para el descanso y el trato digno." },
  { match: /familia|arbol|mama|papa|linaje|infancia|nino|hogar|casa/, emoji: "🏡", tone: "bg-gold/15 text-gold", words: ["FAMILIA", "HISTORIA", "CRIANZA", "HOGAR", "MEMORIA", "TERNURA", "CUIDADO", "LIMITES"], action: "nombrar una costumbre familiar que deseas conservar y otra que necesitas cambiar", avoid: "cargar con decisiones que pertenecen a otros familiares", truth: "Puedes honrar tu historia familiar y elegir un trato diferente para tu presente." },
  { match: /perdida|duelo|dolor|ausencia/, emoji: "🕊️", tone: "bg-accent-blue/15 text-accent-blue", words: ["RECUERDO", "CONSUELO", "AUSENCIA", "COMPANIA", "MEMORIA", "DESCANSO", "LLANTO", "CUIDADO"], action: "escribir un recuerdo significativo y pedir compañía si la necesitas", avoid: "exigirte dejar de sentir tristeza en un plazo fijo", truth: "El duelo no tiene un calendario obligatorio; Dios puede acompañarte en tu tristeza." },
  { match: /ansiedad|depres|miedo|calma|emocion/, emoji: "💚", tone: "bg-accent-green/15 text-accent-green", words: ["CALMA", "PAUSA", "APOYO", "EMOCION", "DESCANSO", "CUIDADO", "RESPIRAR", "PRESENTE"], action: "reconocer una emoción, hacer una pausa y contactar a alguien de confianza", avoid: "culparte por sentir malestar o reemplazar atención profesional con esta práctica", truth: "Sentir malestar no significa falta de fe; buscar acompañamiento profesional es válido." },
  { match: /identidad|valor|glow|permiso|autoestima|magnet|voz/, emoji: "🦁", tone: "bg-gold/15 text-gold", words: ["DIGNIDAD", "IDENTIDAD", "VOZ", "CARACTER", "VALOR", "RESPETO", "DECISION", "PROPOSITO"], action: "reconocer una cualidad propia y practicar una decisión sin pedir aprobación innecesaria", avoid: "compararte para decidir cuánto vales", truth: "Tu dignidad no depende de agradar a todas las personas." },
  { match: /proposito|don|meta|direccion/, emoji: "🧭", tone: "bg-accent-blue/15 text-accent-blue", words: ["PROPOSITO", "SERVICIO", "TALENTO", "CAMINO", "DECISION", "ENFOQUE", "CONSTANCIA", "META"], action: "elegir una meta pequeña vinculada a tus dones y agendar el primer paso", avoid: "esperar una certeza absoluta antes de comenzar", truth: "Discernir tu propósito combina oración, servicio y acciones concretas." },
  { match: /./, emoji: "📖", tone: "bg-primary/12 text-primary", words: ["ORACION", "REFLEXION", "LECTURA", "ESCUCHA", "SERVICIO", "PRACTICA", "GRATITUD", "CONFIANZA"], action: "reconocer una situación concreta del tema y elegir una respuesta coherente con tu fe", avoid: "repetir palabras sin reflexionar ni dar un paso concreto", truth: "La oración acompaña tus decisiones; no garantiza resultados automáticos." },
];
const normalized = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function subtopicVisual(title: string, category = "") {
  const own = normalized(title);
  const found = THEMES.slice(0, -1).find(t => t.match.test(own)) ?? THEMES.find(t => t.match.test(normalized(category))) ?? THEMES[THEMES.length - 1];
  return found ?? THEMES[0];
}
export function thematicPractice(category: string, title: string, day = 1): PracticeContent {
  const theme = subtopicVisual(title, category);
  const topic = title.trim() || category;
  const phase = (Math.max(1, day) - 1) % 3;
  const tasks = [
    `Sobre «${topic}»: escribe una situación concreta ${phase === 0 ? "que deseas comprender" : phase === 1 ? "que necesitas cambiar" : "en la que notaste un avance"}.`,
    `Para «${topic}», da este paso: ${theme.action}.`,
    `Cierra «${topic}» con una oración por ${phase === 0 ? "claridad" : phase === 1 ? "fortaleza para actuar" : "gratitud y constancia"} y anota lo aprendido.`,
  ];
  const words = normalized(topic).toUpperCase().split(/[^A-Z]+/).filter(w => w.length >= 4 && w.length <= 9 && !["PARA", "COMO", "TODO", "DESDE", "ESTA"].includes(w));
  return {
    affirmation: `Con la ayuda de Dios, trabajo «${topic}» con verdad y pasos responsables.`,
    lesson: `En «${topic}», dentro de ${category}, comienza por mirar una situación real sin juzgarte. ${theme.truth} Distingue lo que depende de ti de las decisiones de otras personas. Tu paso de esta práctica será ${theme.action}. Lleva tus dudas a la oración y busca apoyo cuando lo necesites; avanzar no significa resolver todo de una vez.`,
    exercise: `Trabaja «${topic}»: ${tasks.join(" ")}`,
    tasks,
    search_words: [...new Set([...words, ...theme.words])].filter(word => word.length >= 4 && word.length <= 9).slice(0, 8),
    quiz: [
      { question: `En «${topic}», ¿cuál es un paso responsable?`, options: [theme.action, theme.avoid, "Ignorar lo que sucede"], correctIndex: 0, explanation: theme.truth },
      { question: `¿Qué conviene evitar al trabajar «${topic}»?`, options: ["Pedir apoyo cuando lo necesitas", theme.avoid, "Reconocer tu situación con honestidad"], correctIndex: 1, explanation: `Para ${category}, el cuidado y la responsabilidad van juntos.` },
      { question: `¿Qué puedes anotar después de la práctica «${topic}»?`, options: ["Un resultado que todavía no ocurrió", "Una promesa de que todo se resolverá", `La acción que realizaste y lo aprendido sobre ${topic}`], correctIndex: 2, explanation: "Registra acciones reales, sin exigirte resultados ni inventarlos." },
    ],
  };
}
type LegacyRow = { id?: string; title: string; day_index: number; affirmation?: string | null; lesson?: string | null; exercise?: string | null; quiz?: unknown; word_game?: unknown };
export function resolvePractice(category: string, row: LegacyRow, siblings: LegacyRow[] = []): PracticeContent {
  const fallback = thematicPractice(category, row.title, row.day_index);
  const repeated = (key: keyof LegacyRow, value: unknown) => siblings.some(s => s !== row && s.id !== row.id && value && JSON.stringify(s[key]) === JSON.stringify(value));
  const q = row.quiz && typeof row.quiz === "object" && !Array.isArray(row.quiz) ? row.quiz as { tasks?: string[]; questions?: PracticeContent["quiz"] } : {};
  const game = row.word_game && typeof row.word_game === "object" && !Array.isArray(row.word_game) ? row.word_game as { words?: string[] } : {};
  return {
    affirmation: row.affirmation && !repeated("affirmation", row.affirmation) ? row.affirmation : fallback.affirmation,
    lesson: row.lesson && !repeated("lesson", row.lesson) ? row.lesson : fallback.lesson,
    exercise: row.exercise && !repeated("exercise", row.exercise) ? row.exercise : fallback.exercise,
    tasks: q.tasks?.length && !siblings.some(s => s.id !== row.id && JSON.stringify((s.quiz as typeof q)?.tasks) === JSON.stringify(q.tasks)) ? q.tasks : fallback.tasks,
    quiz: q.questions?.length && !siblings.some(s => s.id !== row.id && JSON.stringify((s.quiz as typeof q)?.questions) === JSON.stringify(q.questions)) ? q.questions : fallback.quiz,
    search_words: game.words?.length && !repeated("word_game", row.word_game) ? game.words : fallback.search_words,
  };
}

export const SUBTOPIC_CONTENT_RULE = "Cada campo debe tratar exclusivamente el tema principal y el título de ESTE subtema. Prohibido reutilizar lecciones, tareas, afirmaciones, palabras o preguntas de otros subtemas. Usa situaciones, acciones y vocabulario propios del subtema, progresivos para su día. No generes imágenes, cover_prompt, fotos ni fondos para subcategorías: usan emojis temáticos. No prometas curación ni resultados automáticos; oración y fe cristiana con acciones responsables.";