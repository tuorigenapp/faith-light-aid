import ninoCover from "@/assets/programas/prog-nino.jpg";
import glowMujerCover from "@/assets/programas/prog-glowup-mujer.jpg";
import magneticoCover from "@/assets/programas/prog-magnetico.jpg";
import permisoMujerCover from "@/assets/programas/prog-permiso-mujer.jpg";
import permisoHombreCover from "@/assets/programas/prog-permiso-hombre.jpg";
import glowHombreCover from "@/assets/programas/prog-glowup-hombre.jpg";

export type Programa = {
  id: string;
  title: string;
  subtitle: string;
  claim: string;
  cover: string;
  emoji: string;
  gradient: string;
  tint: string;
  pillars: { title: string; desc: string }[];
  days: string[];
  affirmations: string[];
  exercises: string[];
  scripture: { text: string; ref: string };
};

const AFF_BASE = [
  "Hoy elijo sanar en lugar de repetir.",
  "Dios está reescribiendo mi historia desde la raíz.",
  "Suelto lo que no me pertenece y recibo paz.",
  "Mi valor no depende de la aprobación de nadie.",
  "Merezco relaciones que no me cuesten mi paz.",
  "Soy nueva criatura: lo viejo ya pasó.",
  "Avanzo con calma, un día a la vez.",
];

const EX_BASE = [
  "Escribe 5 líneas: ¿qué patrón noté hoy en mí?",
  "Respiración 3·6·9 durante 3 minutos antes de responder a alguien.",
  "Envía o escribe (sin enviar) una carta de perdón de 10 líneas.",
  "Anota 3 límites que vas a sostener esta semana.",
  "Haz una lista de 10 cosas que agradeces de tu presente.",
  "Mírate al espejo 60 segundos y repite la afirmación en voz alta.",
  "Cierra el día en oración escrita: entrega lo que no puedes controlar.",
];

function week(prefix: string, items: string[]) {
  return items.map((t, i) => `Día ${i + 1} · ${prefix}: ${t}`);
}

export const PROGRAMAS: Programa[] = [
  {
    id: "nino-interior",
    title: "Sanar a tu niño o niña interior",
    subtitle: "Sana a mamá, sana a papá, sánate tú",
    claim: "El adulto que eres se calma cuando el niño que fuiste se siente visto.",
    cover: ninoCover,
    emoji: "🧒",
    gradient: "from-primary via-accent-pink to-gold",
    tint: "text-primary",
    pillars: [
      { title: "Herida de origen", desc: "Identificas la escena que marcó tu forma de amar." },
      { title: "Sanar a mamá", desc: "Cierras el vacío materno sin culpar a nadie." },
      { title: "Sanar a papá", desc: "Recuperas la seguridad y el sostén." },
      { title: "Reparentar", desc: "Aprendes a darte lo que nadie te dio." },
    ],
    days: [
      ...week("Reconocer", ["la escena que aún te dolía", "la voz que te callaba", "el miedo que aprendiste", "lo que necesitabas y no llegó", "el rol que asumiste en casa", "tu enojo guardado", "tu ternura olvidada"]),
      ...week("Sanar", ["carta a mamá", "carta a papá", "el perdón que te libera", "devolver cargas que no eran tuyas", "abrazo al niño de 7 años", "duelo del padre ideal", "gratitud por lo que sí hubo"]),
      ...week("Reparentar", ["nueva voz interna", "límites con amor", "juego y descanso", "cuerpo seguro", "pedir ayuda sin vergüenza", "elegir vínculos sanos", "compromiso de por vida"]),
    ],
    affirmations: AFF_BASE,
    exercises: EX_BASE,
    scripture: { text: "Aunque mi padre y mi madre me dejaran, con todo, Jehová me recogerá.", ref: "Salmos 27:10" },
  },
  {
    id: "glowup-mujer",
    title: "Glow Up: Mujer de alto valor",
    subtitle: "Belleza, carácter y propósito",
    claim: "No se trata de gustar más, se trata de habitarte mejor.",
    cover: glowMujerCover,
    emoji: "👑",
    gradient: "from-accent-pink via-primary to-gold",
    tint: "text-accent-pink",
    pillars: [
      { title: "Belleza real", desc: "Cuidas tu cuerpo sin castigarlo." },
      { title: "Mente poderosa", desc: "Cambias el diálogo interno." },
      { title: "Carácter", desc: "Sostienes tus límites con calma." },
      { title: "Propósito", desc: "Ordenas tu vida hacia lo que sí quieres." },
    ],
    days: [
      ...week("Base", ["espejo sin crítica", "rutina que te honra", "descanso como decisión", "movimiento amable", "alimentación sin culpa", "orden en tu espacio", "silencio y oración"]),
      ...week("Carácter", ["tu sí y tu no", "dejar de justificarte", "conversación difícil", "soltar la aprobación", "dinero y dignidad", "amistades que suman", "cerrar puertas viejas"]),
      ...week("Propósito", ["tu don visible", "hablar en público de ti", "meta de 90 días", "presencia y postura", "mujer que inspira", "relación sin mendigar", "tu nueva versión"]),
    ],
    affirmations: AFF_BASE,
    exercises: EX_BASE,
    scripture: { text: "Fuerza y honor son su vestidura; y se ríe de lo por venir.", ref: "Proverbios 31:25" },
  },
  {
    id: "glowup-hombre",
    title: "Glow Up: Hombre de alto valor",
    subtitle: "Disciplina, enfoque, fe y propósito",
    claim: "Un hombre de valor no se impone: se sostiene.",
    cover: glowHombreCover,
    emoji: "🦁",
    gradient: "from-primary via-accent-blue to-gold",
    tint: "text-accent-blue",
    pillars: [
      { title: "Carácter íntegro", desc: "Haces lo que dices, aunque nadie mire." },
      { title: "Mente poderosa", desc: "Dominas el impulso y la reacción." },
      { title: "Relaciones sanas", desc: "Amas y lideras sin controlar." },
      { title: "Vida con propósito", desc: "Construyes algo que deja huella." },
    ],
    days: [
      ...week("Disciplina", ["tu palabra vale", "levantarte a tiempo", "cuerpo como responsabilidad", "cortar lo que te distrae", "administrar tu dinero", "silencio y oración", "cerrar el día con orden"]),
      ...week("Dominio", ["enojo bajo control", "hablar sin herir", "pedir perdón", "soltar el orgullo", "sanar la figura paterna", "proteger sin controlar", "honrar tu palabra en pareja"]),
      ...week("Propósito", ["visión de 5 años", "trabajo con excelencia", "liderar tu casa", "mentoría y hermandad", "servir a otros", "constancia sin aplausos", "hombre nuevo"]),
    ],
    affirmations: AFF_BASE,
    exercises: EX_BASE,
    scripture: { text: "Esfuérzate y sé valiente; no temas ni desmayes.", ref: "Josué 1:9" },
  },
  {
    id: "magnetico",
    title: "Vuélvete magnético o magnética",
    subtitle: "Presencia, energía y atracción sana",
    claim: "Atraes lo que eres, no lo que persigues.",
    cover: magneticoCover,
    emoji: "✨",
    gradient: "from-gold via-accent-pink to-primary",
    tint: "text-gold",
    pillars: [
      { title: "Energía limpia", desc: "Sacas de ti lo que espanta lo bueno." },
      { title: "Presencia", desc: "Aprendes a estar sin actuar." },
      { title: "Autoestima", desc: "Dejas de perseguir para empezar a elegir." },
      { title: "Atracción sana", desc: "Vínculos que llegan sin ansiedad." },
    ],
    days: [
      ...week("Limpiar", ["queja y drama", "vínculos que te vacían", "ansiedad al escribir primero", "necesidad de gustar", "comparación en redes", "resentimiento antiguo", "ruido mental"]),
      ...week("Encender", ["mirada y postura", "voz tranquila", "escuchar de verdad", "misterio saludable", "agenda propia", "cuerpo con energía", "gratitud magnética"]),
      ...week("Atraer", ["claridad de lo que quieres", "conversaciones que conectan", "límites atractivos", "no perseguir", "recibir sin desconfiar", "elegir con paz", "vida que otros quieren estar cerca"]),
    ],
    affirmations: AFF_BASE,
    exercises: EX_BASE,
    scripture: { text: "Sobre toda cosa guardada, guarda tu corazón; porque de él mana la vida.", ref: "Proverbios 4:23" },
  },
  {
    id: "permiso-mujer",
    title: "Deja de pedir permiso para existir (Mujer)",
    subtitle: "Tu voz, tu espacio, tu decisión",
    claim: "No naciste para pedir permiso: naciste para ocupar tu lugar.",
    cover: permisoMujerCover,
    emoji: "🕊️",
    gradient: "from-accent-pink via-gold to-primary",
    tint: "text-accent-pink",
    pillars: [
      { title: "Tu voz", desc: "Dices lo que piensas sin temblar." },
      { title: "Tus límites", desc: "El no también es amor." },
      { title: "Tu espacio", desc: "Dejas de encogerte para caber." },
      { title: "Tu decisión", desc: "Eliges sin buscar aprobación." },
    ],
    days: [
      ...week("Ver", ["dónde te callas", "a quién le pides permiso", "el miedo a molestar", "el rol de complacer", "culpa heredada", "tu cansancio real", "lo que sí quieres"]),
      ...week("Hablar", ["decir no sin explicar", "pedir lo que necesitas", "conversación pendiente", "sostener el silencio del otro", "dinero y voz", "cuerpo que no se disculpa", "descansar sin justificar"]),
      ...week("Ocupar", ["decidir sin consultar", "presencia en la mesa", "mostrar tu trabajo", "amar sin desaparecer", "familia y límites", "planes propios", "mujer libre"]),
    ],
    affirmations: AFF_BASE,
    exercises: EX_BASE,
    scripture: { text: "Para libertad fue que Cristo nos hizo libres.", ref: "Gálatas 5:1" },
  },
  {
    id: "permiso-hombre",
    title: "Deja de pedir permiso para existir (Hombre)",
    subtitle: "Deja de fingir fuerza y empieza a tener paz",
    claim: "Ser hombre no es callar: es hablar con verdad.",
    cover: permisoHombreCover,
    emoji: "🛡️",
    gradient: "from-accent-blue via-primary to-gold",
    tint: "text-accent-blue",
    pillars: [
      { title: "Verdad", desc: "Dejas de aparentar que todo está bien." },
      { title: "Emoción", desc: "Sientes sin explotar ni huir." },
      { title: "Límites", desc: "Sostienes tu lugar sin agredir." },
      { title: "Dirección", desc: "Vives por convicción, no por aprobación." },
    ],
    days: [
      ...week("Ver", ["la máscara que usas", "a quién intentas demostrarle", "el enojo que tapa tristeza", "el miedo al fracaso", "herencia de tu padre", "tu soledad real", "lo que sí quieres"]),
      ...week("Hablar", ["nombrar lo que sientes", "pedir ayuda", "conversación pendiente", "perdonar sin volver atrás", "dinero sin vergüenza", "cuerpo y descanso", "hermandad real"]),
      ...week("Dirigir", ["decidir con paz", "liderar sin controlar", "trabajo con propósito", "amar con presencia", "corregir sin herir", "constancia", "hombre libre"]),
    ],
    affirmations: AFF_BASE,
    exercises: EX_BASE,
    scripture: { text: "El justo está confiado como un león.", ref: "Proverbios 28:1" },
  },
];

export const UNLOCK_COST = 10;

export function getPrograma(id: string) {
  return PROGRAMAS.find((p) => p.id === id) ?? null;
}

export function weekOfDay(day: number) {
  return Math.ceil(day / 7);
}
