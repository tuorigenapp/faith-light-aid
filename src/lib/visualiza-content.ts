/** Theme-specific legacy fallbacks; no AI requests and no image generation. */
export type PracticeContent = { affirmation: string; lesson: string; exercise: string; tasks: string[]; search_words: string[]; quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[] };
type Theme = { match: RegExp; emoji: string; tone: string; words: string[]; action: string; avoid: string; truth: string };
const THEMES: Theme[] = [
  { match: /bano con sal/, emoji: "💧", tone: "bg-accent-blue/15 text-accent-blue", words: ["HIGIENE", "CUIDADO", "DESCANSO", "CUERPO", "PAUSA", "PRUDENCIA", "ORACION", "CALMA"], action: "hacer una pausa de aseo con agua a temperatura cómoda, evitando sal sobre piel irritada y sin atribuirle poder espiritual", avoid: "usar sal para tratar una enfermedad o atribuirle poder para cambiar tu vida", truth: "La sal no elimina cargas espirituales; cuida tu piel y acompaña tu descanso con oración." },
  { match: /bano con hierbas/, emoji: "🍃", tone: "bg-accent-green/15 text-accent-green", words: ["PLANTAS", "ENTORNO", "CUIDADO", "VENTILAR", "CALMA", "DESCANSO", "HIGIENE", "PRUDENCIA"], action: "preparar un entorno ventilado y tranquilo para descansar, sin ingerir plantas ni aplicar mezclas desconocidas sobre la piel", avoid: "usar hierbas irritantes, ingerir preparados desconocidos o considerarlos una cura espiritual", truth: "Un entorno agradable puede acompañar el descanso; las plantas no sustituyen tratamientos ni la oración." },
  { match: /diario/, emoji: "📝", tone: "bg-accent-pink/15 text-accent-pink", words: ["DIARIO", "REGISTRO", "HECHO", "EMOCION", "FECHA", "APRENDER", "VERDAD", "BALANCE"], action: "registrar un hecho del día, distinguir hechos de suposiciones y revisar qué aprendiste al volver a leer una entrada anterior", avoid: "inventar avances o convertir una suposición en un hecho registrado", truth: "Un diario permite observar tu proceso con honestidad, sin exigirte un progreso perfecto." },
  { match: /visualizacion guiada/, emoji: "🌅", tone: "bg-accent-blue/15 text-accent-blue", words: ["ATENCION", "RESPIRAR", "PRESENTE", "ENSAYAR", "CONDUCTA", "PAUSA", "FOCO", "CALMA"], action: "hacer una pausa breve, imaginar cómo responderías con calma a una situación concreta y ensayar esa respuesta sin confundirla con un hecho", avoid: "usar la imaginación para negar tu situación actual o prometer resultados", truth: "Ensayar mentalmente una respuesta puede prepararte para actuar, sin controlar el futuro." },
  { match: /renovacion|bano|sal\b|hierba/, emoji: "💧", tone: "bg-accent-blue/15 text-accent-blue", words: ["RENOVAR", "ASEO", "PAUSA", "DESCANSO", "CUIDADO", "ORACION", "LIMPIEZA", "CALMA"], action: "reservar un momento de aseo cotidiano y descanso, sin atribuir poder espiritual al agua, la sal o las plantas", avoid: "usar sustancias irritantes o tratar el baño como un ritual que elimina problemas", truth: "El aseo cuida tu cuerpo; la renovación de tu fe se cultiva en oración y decisiones responsables." },
  { match: /meditacion biblica|lectura|palabra/, emoji: "📖", tone: "bg-accent-blue/15 text-accent-blue", words: ["LECTURA", "CONTEXTO", "BIBLIA", "PALABRA", "ESCUCHA", "APLICAR", "SENTIDO", "REFLEXION"], action: "leer un pasaje bíblico completo, observar su contexto y escribir una aplicación concreta", avoid: "usar un versículo aislado para predecir el futuro o justificar daño", truth: "Leer la Biblia con atención incluye su contexto y una aplicación respetuosa de las personas." },
  { match: /ayuno/, emoji: "🍃", tone: "bg-accent-green/15 text-accent-green", words: ["PRUDENCIA", "ORACION", "DESCANSO", "CUIDADO", "ATENCION", "HABITO", "PAUSA", "SERVICIO"], action: "hacer una pausa voluntaria de una distracción y dedicar ese tiempo a orar o servir, sin restringir comida ni medicación", avoid: "descuidar tu salud o suspender un tratamiento para cumplir una práctica espiritual", truth: "Una pausa espiritual no exige poner en riesgo tu salud; consulta a un profesional antes de modificar tu alimentación." },
  { match: /liberacion|limpieza espiritual/, emoji: "🕊️", tone: "bg-accent-blue/15 text-accent-blue", words: ["LIBERTAD", "ORACION", "APOYO", "CUIDADO", "DECISION", "VERDAD", "DESCANSO", "ESCUCHA"], action: "nombrar una carga que puedes compartir en oración y pedir acompañamiento de confianza", avoid: "atribuir todo malestar a causas sobrenaturales o someterte a prácticas que te asusten", truth: "La oración cristiana puede acompañar tu proceso sin coerción ni sustituir la atención que necesitas." },
  { match: /gratitud|plenitud/, emoji: "🌻", tone: "bg-gold/15 text-gold", words: ["GRATITUD", "DETALLE", "AYUDA", "REGALO", "SERVICIO", "MEMORIA", "ALEGRIA", "CUIDADO"], action: "anotar tres ayudas reales recibidas y agradecer de forma concreta a una persona", avoid: "obligarte a sentir alegría o negar una dificultad para parecer agradecido", truth: "Puedes agradecer lo bueno y reconocer a la vez lo que duele; la gratitud no borra tus necesidades." },
  { match: /fe y confianza|plan divino|camino en fe/, emoji: "🙏", tone: "bg-accent-blue/15 text-accent-blue", words: ["CONFIANZA", "ORACION", "ESCUCHA", "PACIENCIA", "ESPERANZA", "DECISION", "CUIDADO", "PRUDENCIA"], action: "llevar una incertidumbre a la oración y decidir un paso prudente que sí esté en tus manos", avoid: "tomar una decisión riesgosa suponiendo que la fe garantiza un resultado", truth: "Confiar en Dios no elimina la incertidumbre; puedes actuar con prudencia y pedir consejo." },
  { match: /salud|bienestar/, emoji: "💚", tone: "bg-accent-green/15 text-accent-green", words: ["SALUD", "DESCANSO", "CUIDADO", "HABITO", "APOYO", "AGUA", "PAUSA", "ATENCION"], action: "elegir un hábito seguro de descanso o cuidado y seguir las indicaciones de tu profesional de salud", avoid: "sustituir tratamientos por afirmaciones o prometerte una curación", truth: "La oración acompaña el cuidado de tu salud, pero esta práctica no diagnostica ni reemplaza tratamientos." },
  { match: /future self|visualizacion guiada|vida ideal/, emoji: "🌅", tone: "bg-gold/15 text-gold", words: ["IMAGINAR", "PRESENTE", "HABITO", "DECISION", "VALORES", "ENFOQUE", "PASO", "CUIDADO"], action: "imaginar una conducta cotidiana coherente con tus valores y practicarla en una situación real", avoid: "confundir lo imaginado con un hecho o esperar que pensar algo lo haga ocurrir", truth: "Imaginar puede ayudarte a preparar una acción; lo importante es lo que haces en el presente." },
  { match: /scripting|escritura|diario/, emoji: "📝", tone: "bg-accent-pink/15 text-accent-pink", words: ["ESCRIBIR", "DIARIO", "HECHO", "EMOCION", "DECISION", "REGISTRO", "VERDAD", "APRENDER"], action: "escribir un hecho del día, la emoción que sentiste y una decisión posible, separando hechos de suposiciones", avoid: "anotar resultados que no ocurrieron como si fueran hechos", truth: "Escribir con honestidad te ayuda a comprenderte; no necesitas inventar avances para registrar tu proceso." },
  { match: /creencias/, emoji: "💡", tone: "bg-gold/15 text-gold", words: ["CREENCIA", "EVIDENCIA", "VERDAD", "PREGUNTA", "MATIZ", "RESPETO", "DIGNIDAD", "DECISION"], action: "revisar una creencia que te limita, buscar evidencia y formular una alternativa equilibrada", avoid: "cambiar una idea difícil por una promesa absoluta sin fundamento", truth: "Una creencia más justa reconoce tus dificultades y tus capacidades sin negar la realidad." },
  { match: /habitos|constancia/, emoji: "🌱", tone: "bg-accent-green/15 text-accent-green", words: ["HABITO", "HORARIO", "SENAL", "PASO", "REPETIR", "REGISTRO", "DESCANSO", "AJUSTE"], action: "elegir un hábito de dos minutos, asociarlo a una rutina existente y marcar solo las veces que lo realizas", avoid: "hacer un plan imposible o abandonar por haber omitido un día", truth: "La constancia crece con pasos sostenibles y ajustes amables, no con perfección." },
  { match: /accion valiente/, emoji: "🦁", tone: "bg-gold/15 text-gold", words: ["VALENTIA", "PASO", "APOYO", "DECISION", "PRUDENCIA", "MIEDO", "INTENTO", "APRENDER"], action: "dar un paso pequeño y seguro que has postergado, buscando apoyo si la situación lo requiere", avoid: "arriesgar tu seguridad para demostrar valentía", truth: "Actuar con valentía puede ser pedir ayuda o empezar poco a poco, sin exponerte al daño." },
  { match: /mapa de vision/, emoji: "🧭", tone: "bg-accent-blue/15 text-accent-blue", words: ["META", "VALORES", "PLAN", "PLAZO", "RECURSOS", "PASO", "PRIORIDAD", "REVISION"], action: "organizar una meta por escrito con recursos, un plazo realista y un primer paso verificable", avoid: "tomar un mapa de metas como una garantía de resultados", truth: "Un mapa te ayuda a planear y revisar tus decisiones; no controla lo que hará el futuro." },
  { match: /narcisis|abuso|manipula|limites/, emoji: "🛡️", tone: "bg-accent-blue/15 text-accent-blue", words: ["LIMITES", "RESPETO", "APOYO", "SEGURIDAD", "DIGNIDAD", "DECISION", "VERDAD", "CUIDADO"], action: "identificar una conducta que no aceptarás y preparar un límite seguro con apoyo", avoid: "confrontar a una persona violenta sin apoyo", truth: "La fe no te obliga a tolerar abuso; protegerte y buscar ayuda es válido." },
  { match: /pareja|amor|relacion|vincul/, emoji: "🤝", tone: "bg-accent-pink/15 text-accent-pink", words: ["DIALOGO", "ESCUCHA", "ACUERDO", "RESPETO", "VINCULO", "CUIDADO", "EMPATIA", "CONFIAR"], action: "expresar una necesidad concreta sin acusaciones y escuchar la respuesta", avoid: "suponer lo que la otra persona piensa sin preguntarle", truth: "Una relación sana necesita respeto, escucha y acuerdos, no control." },
  { match: /dinero|deuda|abundancia|provision|finanza|financier|prosper/, emoji: "🌱", tone: "bg-accent-green/15 text-accent-green", words: ["AHORRO", "ORDEN", "PROVISION", "RECURSOS", "TRABAJO", "PRIORIDAD", "GENEROSO", "CUENTA"], action: "revisar un gasto real y decidir una prioridad para tu presupuesto", avoid: "gastar por impulso o esperar dinero sin organizar tus recursos", truth: "Confiar en la provisión de Dios también implica administrar con responsabilidad." },
  { match: /trabajo|negocio|empleo|profesion/, emoji: "💼", tone: "bg-accent-blue/15 text-accent-blue", words: ["OFICIO", "SERVICIO", "ESFUERZO", "ENFOQUE", "EQUIPO", "HORARIO", "ORDEN", "HONESTO"], action: "elegir una tarea laboral pendiente y reservar un tiempo concreto para realizarla", avoid: "medir tu valor solamente por tu productividad", truth: "El trabajo con integridad deja espacio para el descanso y el trato digno." },
  { match: /familia|arbol|mama|papa|linaje|infancia|nino|hogar|casa/, emoji: "🏡", tone: "bg-gold/15 text-gold", words: ["FAMILIA", "HISTORIA", "CRIANZA", "HOGAR", "MEMORIA", "TERNURA", "CUIDADO", "LIMITES"], action: "nombrar una costumbre familiar que deseas conservar y otra que necesitas cambiar", avoid: "cargar con decisiones que pertenecen a otros familiares", truth: "Puedes honrar tu historia familiar y elegir un trato diferente para tu presente." },
  { match: /perdida|duelo|dolor|ausencia/, emoji: "🕊️", tone: "bg-accent-blue/15 text-accent-blue", words: ["RECUERDO", "CONSUELO", "AUSENCIA", "COMPANIA", "MEMORIA", "DESCANSO", "LLANTO", "CUIDADO"], action: "escribir un recuerdo significativo y pedir compañía si la necesitas", avoid: "exigirte dejar de sentir tristeza en un plazo fijo", truth: "El duelo no tiene un calendario obligatorio; Dios puede acompañarte en tu tristeza." },
  { match: /ansiedad|depres|miedo|calma|emocion|paz interior|sanacion interior/, emoji: "💚", tone: "bg-accent-green/15 text-accent-green", words: ["CALMA", "PAUSA", "APOYO", "EMOCION", "DESCANSO", "CUIDADO", "RESPIRAR", "PRESENTE"], action: "reconocer una emoción, hacer una pausa y contactar a alguien de confianza", avoid: "culparte por sentir malestar o reemplazar atención profesional con esta práctica", truth: "Sentir malestar no significa falta de fe; buscar acompañamiento profesional es válido." },
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
      { question: `¿Qué puedes anotar después de la práctica «${topic}»?`, options: ["Exigirme resultados inmediatos", "Hacerlo sin considerar mi seguridad", theme.truth], correctIndex: 2, explanation: `Anota cómo aplicaste este cuidado: ${theme.action}.` },
    ],
  };
}
type LegacyRow = { id?: string; title: string; day_index: number; affirmation?: string | null; lesson?: string | null; exercise?: string | null; quiz?: unknown; word_game?: unknown };
export function resolvePractice(category: string, row: LegacyRow, siblings: LegacyRow[] = []): PracticeContent {
  const fallback = thematicPractice(category, row.title, row.day_index);
  const other = (s: LegacyRow) => s !== row && (row.id ? s.id !== row.id : s.title !== row.title || s.day_index !== row.day_index);
  const repeated = (key: keyof LegacyRow, value: unknown) => siblings.some(s => other(s) && value && JSON.stringify(s[key]) === JSON.stringify(value));
  const q = row.quiz && typeof row.quiz === "object" && !Array.isArray(row.quiz) ? row.quiz as { tasks?: string[]; questions?: PracticeContent["quiz"] } : {};
  const game = row.word_game && typeof row.word_game === "object" && !Array.isArray(row.word_game) ? row.word_game as { words?: string[] } : {};
  return {
    affirmation: row.affirmation && !repeated("affirmation", row.affirmation) ? row.affirmation : fallback.affirmation,
    lesson: row.lesson && !repeated("lesson", row.lesson) ? row.lesson : fallback.lesson,
    exercise: row.exercise && !repeated("exercise", row.exercise) ? row.exercise : fallback.exercise,
    tasks: Array.isArray(q.tasks) && q.tasks.length && !siblings.some(s => other(s) && JSON.stringify((s.quiz as typeof q)?.tasks) === JSON.stringify(q.tasks)) ? q.tasks : fallback.tasks,
    quiz: Array.isArray(q.questions) && q.questions.length && !siblings.some(s => other(s) && JSON.stringify((s.quiz as typeof q)?.questions) === JSON.stringify(q.questions)) ? q.questions : fallback.quiz,
    search_words: Array.isArray(game.words) && game.words.length && !siblings.some(s => { const sibling = s.word_game as typeof game | null; return other(s) && Array.isArray(sibling?.words) && [...sibling.words].sort().join("|") === [...game.words ?? []].sort().join("|"); }) ? game.words : fallback.search_words,
  };
}

export const SUBTOPIC_CONTENT_RULE = "Cada campo debe tratar exclusivamente el tema principal y el título de ESTE subtema. Prohibido reutilizar lecciones, tareas, afirmaciones, palabras o preguntas de otros subtemas. Usa situaciones, acciones y vocabulario propios del subtema, progresivos para su día. No generes imágenes, cover_prompt, fotos ni fondos para subcategorías: usan emojis temáticos. No prometas curación ni resultados automáticos; oración y fe cristiana con acciones responsables.";
const AFF_TEMPLATES = [
  (t: string) => `Con la ayuda de Dios, trabajo «${t}» con verdad y pasos responsables.`,
  (t: string) => `Hoy entrego «${t}» en oración y elijo un paso concreto.`,
  (_t: string, w: string) => `Elijo cultivar ${w} en mi día con paciencia.`,
  (t: string) => `No tengo que resolver «${t}» de una vez; avanzo poco a poco.`,
  (_t: string, w: string) => `Dios me acompaña mientras practico ${w}.`,
  (t: string) => `Mi valor no depende de cómo vaya «${t}» hoy.`,
  (_t: string, w: string) => `Pido sabiduría para vivir ${w} con equilibrio.`,
  (t: string) => `Puedo pedir apoyo para «${t}» sin sentir vergüenza.`,
  (_t: string, w: string) => `Cada pequeño acto de ${w} cuenta delante de Dios.`,
  (t: string) => `Reconozco con honestidad dónde estoy en «${t}».`,
  (_t: string, w: string) => `Agradezco a Dios por la ${w} que ya está creciendo en mí.`,
  (t: string) => `Hoy respondo a «${t}» con calma, no con prisa.`,
  (_t: string, w: string) => `Elijo la ${w} aunque todavía me cueste.`,
  (t: string) => `Si fallo en «${t}», vuelvo a empezar sin culpa.`,
  (_t: string, w: string) => `Mis decisiones de hoy reflejan ${w} y respeto.`,
  (t: string) => `Pongo «${t}» en manos de Dios y hago mi parte.`,
  (_t: string, w: string) => `La ${w} se construye con constancia, no con perfección.`,
  (t: string) => `Cierro este día dando gracias por lo aprendido en «${t}».`,
];

/** 14 offline daily affirmations per subtopic; rotate with the day and the theme, no network or AI. */
export function dailyAffirmations(category: string, title: string, day = 1, base?: string | null): string[] {
  const theme = subtopicVisual(title, category);
  const topic = title.trim() || category;
  const words = theme.words.map(w => w.toLowerCase());
  const start = (Math.max(1, day) - 1) * 5;
  const list = Array.from({ length: 14 }, (_, i) => {
    const k = start + i;
    return AFF_TEMPLATES[k % AFF_TEMPLATES.length]!(topic, words[(k + day) % words.length]!);
  });
  return [...new Set([...(base ? [base] : []), ...list])].slice(0, 14);
}
