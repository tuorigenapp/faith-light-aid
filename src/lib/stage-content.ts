import type { QuizItem } from "@/components/StageQuiz";

export type StageContent = {
  words: string[];
  quiz: QuizItem[];
  tips: { title: string; body: string }[];
  challenge: string;
};

const BY_FOCUS: Record<string, StageContent> = {
  "restauración familiar": {
    words: ["FAMILIA", "PERDON", "LINAJE", "ABUELA", "PADRE", "MADRE", "HIJO", "AMOR"],
    quiz: [
      {
        q: "¿Qué es lo primero que necesita un patrón familiar para dejar de repetirse?",
        options: ["Ignorarlo hasta olvidarlo", "Ser visto y nombrado", "Culpar a quien lo empezó"],
        correct: 1,
        tip: "Lo que se nombra pierde poder. Lo que se esconde, se repite en silencio.",
      },
      {
        q: "Cuando devuelves con respeto lo que no es tuyo, tu linaje…",
        options: ["Se ofende y se aleja", "Descansa contigo", "Te castiga"],
        correct: 1,
        tip: "Devolver no es rechazar; es honrar. Cada uno carga lo suyo, tú caminas liviana.",
      },
      {
        q: "El perdón familiar más difícil es casi siempre…",
        options: ["A un desconocido", "A tu madre o padre", "A un compañero de trabajo"],
        correct: 1,
        tip: "Perdonar a quien te dio la vida es soltar la deuda que te tenía atada al dolor.",
      },
    ],
    tips: [
      { title: "Sabías que…", body: "Los patrones se repiten hasta 7 generaciones si nadie los cierra conscientemente. Tú puedes ser quien cierre." },
      { title: "Hazlo hoy", body: "Escribe una carta a un ancestro (no la envías). Solo lo que necesitabas decirle. Después, agradece." },
    ],
    challenge: "Hoy mira una foto familiar y di en voz alta: 'Gracias por lo que me dieron. Lo que no es mío, lo devuelvo con amor.'",
  },
  "sanidad emocional": {
    words: ["PAZ", "CALMA", "SANAR", "LLORAR", "SENTIR", "ABRAZO", "TERNURA", "SOLTAR"],
    quiz: [
      {
        q: "Una emoción reprimida durante años…",
        options: ["Desaparece sola", "Se guarda en el cuerpo", "Se cura durmiendo"],
        correct: 1,
        tip: "Lo que no lloras con lágrimas, tu cuerpo lo llora con síntomas.",
      },
      {
        q: "¿Cuál es la mejor manera de acompañar una emoción intensa?",
        options: ["Distraerte con el celular", "Respirar y ponerle nombre", "Enojarte contigo"],
        correct: 1,
        tip: "Nombrar la emoción baja su intensidad hasta un 40% en minutos.",
      },
      {
        q: "Tu niña interior necesita hoy…",
        options: ["Reglas más duras", "Ser escuchada sin juicio", "Que la ignores"],
        correct: 1,
        tip: "Habla con ternura contigo. Esa voz interna aprende del tono que le das.",
      },
    ],
    tips: [
      { title: "Sabías que…", body: "Poner la mano en el pecho y respirar 6 segundos activa el nervio vago y calma el sistema nervioso." },
      { title: "Hazlo hoy", body: "Escribe: 'Hoy me sentí ___ porque ___. Y está bien.' Sin corregir. Sin justificar." },
    ],
    challenge: "Regálate 3 minutos de silencio con la mano en el corazón antes de dormir.",
  },
  "identidad": {
    words: ["VALOR", "SOY", "DIGNA", "DIGNO", "LUZ", "VERDAD", "ESPEJO", "AMOR"],
    quiz: [
      {
        q: "Tu valor como persona depende de…",
        options: ["Lo que produces", "Lo que existes", "Lo que otros piensan"],
        correct: 1,
        tip: "Vales por ser, no por hacer. Lo demás es agregado, no fundamento.",
      },
      {
        q: "La voz crítica interna casi siempre tiene la voz de…",
        options: ["Un extraño", "Alguien que te marcó de pequeño", "Tu jefe"],
        correct: 1,
        tip: "Identifica esa voz. Ponle nombre. Y responde: 'Gracias, ya no te necesito así'.",
      },
      {
        q: "Cuando dices 'yo soy ___', estás…",
        options: ["Describiendo un dato", "Programando tu identidad", "Perdiendo el tiempo"],
        correct: 1,
        tip: "Tus palabras se convierten en tu realidad. Elige las tuyas con reverencia.",
      },
    ],
    tips: [
      { title: "Sabías que…", body: "El cerebro no distingue entre lo que ves y lo que imaginas con emoción. Por eso las afirmaciones funcionan." },
      { title: "Hazlo hoy", body: "Repite frente al espejo, mirándote a los ojos: 'Soy digna de amor sin condiciones'." },
    ],
    challenge: "Escribe 5 cosas que amas de ti sin mencionar logros ni utilidad.",
  },
  "reconexión": {
    words: ["FE", "LUZ", "ORAR", "ALMA", "PAZ", "GRACIA", "CIELO", "AMOR"],
    quiz: [
      {
        q: "Conectar con lo espiritual empieza por…",
        options: ["Un ritual perfecto", "Un silencio honesto", "Un templo grande"],
        correct: 1,
        tip: "Dios/Universo/Fuente escucha primero al que se sienta en silencio, no al que grita fuerte.",
      },
      {
        q: "Cuando pides desde el miedo…",
        options: ["Manifiestas más miedo", "Recibes más rápido", "Nada cambia"],
        correct: 0,
        tip: "Pide desde la gratitud anticipada. El agradecimiento es la frecuencia del cumplimiento.",
      },
      {
        q: "La oración más poderosa suele ser…",
        options: ["Muy larga", "Gracias', repetido con fe", "En otro idioma"],
        correct: 1,
        tip: "La gratitud abre puertas que la queja mantiene cerradas.",
      },
    ],
    tips: [
      { title: "Sabías que…", body: "5 minutos diarios de silencio consciente reordenan la ansiedad y aumentan la claridad de decisión." },
      { title: "Hazlo hoy", body: "Escribe 3 cosas por las que puedes decir 'gracias' hoy, incluso las difíciles." },
    ],
    challenge: "Antes de dormir, di en voz alta: 'Gracias por lo vivido hoy. Confío en lo que viene mañana.'",
  },
  "propósito": {
    words: ["DON", "SERVIR", "VIDA", "VOZ", "SUEÑO", "PASO", "FUEGO", "LUZ"],
    quiz: [
      {
        q: "Tu propósito casi siempre está escondido en…",
        options: ["Lo que odias hacer", "Lo que te duele profundamente", "Lo que te pagan bien"],
        correct: 1,
        tip: "Lo que te rompió el corazón suele ser lo que vienes a sanar en otros.",
      },
      {
        q: "El primer paso del propósito no es claridad, es…",
        options: ["Movimiento pequeño", "Un plan de 10 años", "Renunciar a todo"],
        correct: 0,
        tip: "El propósito se revela caminando, no analizando.",
      },
      {
        q: "Cuando dudas de tu don, es porque…",
        options: ["No lo tienes", "Es real y te asusta", "Deberías copiar a otro"],
        correct: 1,
        tip: "El miedo suele ser la brújula del propósito, no una señal de retirada.",
      },
    ],
    tips: [
      { title: "Sabías que…", body: "El propósito se siente como un llamado incómodo y persistente. No calla aunque lo ignores." },
      { title: "Hazlo hoy", body: "Anota 3 momentos donde te sentiste completamente vivo. Ahí hay pistas." },
    ],
    challenge: "Da un paso hoy hacia lo que llevas años posponiendo. Aunque sea de 5 minutos.",
  },
  "disciplina espiritual": {
    words: ["HABITO", "DIARIO", "PAZ", "ORDEN", "FE", "CONSTANCIA", "ORAR", "SANAR"],
    quiz: [
      {
        q: "Un hábito espiritual se sostiene por…",
        options: ["Motivación diaria", "Repetición pequeña", "Fuerza de voluntad extrema"],
        correct: 1,
        tip: "5 minutos todos los días superan a 2 horas una vez al mes.",
      },
      {
        q: "El mejor momento para tu práctica diaria es…",
        options: ["Cuando 'te dé el tiempo'", "El mismo horario cada día", "Cuando estés inspirado"],
        correct: 1,
        tip: "El cerebro adora la repetición en el mismo horario. Ahí se forma el rito.",
      },
      {
        q: "Si un día fallas la práctica…",
        options: ["Se pierde todo lo hecho", "Simplemente vuelves mañana", "Debes castigarte"],
        correct: 1,
        tip: "La constancia no es perfección; es volver una y otra vez sin drama.",
      },
    ],
    tips: [
      { title: "Sabías que…", body: "Un hábito se instala más rápido si lo asocias a algo que ya haces (después del café, antes de dormir…)." },
      { title: "Hazlo hoy", body: "Elige UNA práctica mínima de 3 minutos y ponla junto a un hábito existente." },
    ],
    challenge: "Programa una alarma diaria a la misma hora: 3 respiraciones + 1 frase de gratitud.",
  },
};

export function getStageContent(focusArea: string | null | undefined, stageId: number): StageContent {
  const key = (focusArea ?? "").toLowerCase();
  const base = BY_FOCUS[key] ?? BY_FOCUS["reconexión"];
  // subtle per-stage variation for the challenge line
  const variants = [
    base.challenge,
    `Día ${stageId}: ${base.challenge}`,
  ];
  return { ...base, challenge: variants[stageId % variants.length] };
}

/* ───────────── Soluciones (exactamente 4) y tareas en tiempo real ───────────── */

type StepsByFocus = Record<string, string[]>;

const SOLUTIONS_BY_FOCUS: StepsByFocus = {
  "restauración familiar": [
    "Observa. Piensa en una escena familiar que aún te pesa y obsérvala sin juzgarte.",
    "Escribe. Pon en palabras qué sentiste y qué te hubiera gustado que pasara distinto.",
    "Habla. Di en voz alta lo que necesitabas decirle a esa persona de tu familia.",
    "Decide. Elige hoy soltar esa carga y devolver lo que no te pertenece.",
  ],
  "sanidad emocional": [
    "Observa. Identifica qué emoción está presente en tu cuerpo ahora mismo.",
    "Escribe. Describe en pocas frases qué la originó y desde cuándo la sientes.",
    "Habla. Nombra en voz alta esa emoción: 'Siento ___ y está bien sentirlo'.",
    "Decide. Elige una acción pequeña de autocuidado para hacer hoy mismo.",
  ],
  "identidad": [
    "Observa. Reconoce un pensamiento crítico que tienes sobre ti.",
    "Escribe. Anota de dónde crees que aprendiste esa voz crítica.",
    "Habla. Repite en voz alta una verdad que la reemplace, mirándote si puedes.",
    "Decide. Elige una acción de hoy que demuestre que crees en tu valor.",
  ],
  "reconexión": [
    "Observa. Nota en silencio cómo está tu relación con lo espiritual hoy.",
    "Escribe. Anota una gratitud concreta del día de hoy.",
    "Habla. Di en voz alta una oración corta y sincera con tus propias palabras.",
    "Decide. Elige un momento fijo de tu día para volver a este silencio.",
  ],
  "propósito": [
    "Observa. Recuerda un momento reciente donde te sentiste plenamente vivo.",
    "Escribe. Anota qué don o talento estaba presente en ese momento.",
    "Habla. Declara en voz alta un paso concreto que darás esta semana.",
    "Decide. Elige la acción más pequeña posible y date un plazo de hoy.",
  ],
  "disciplina espiritual": [
    "Observa. Revisa cómo ha ido tu constancia esta semana, sin culpa.",
    "Escribe. Anota el mejor momento del día para tu práctica diaria.",
    "Habla. Comprométete en voz alta con una frase: 'Hoy vuelvo a empezar'.",
    "Decide. Elige tu práctica mínima de hoy y complétala ahora.",
  ],
};

const TASKS_BY_FOCUS: StepsByFocus = {
  "restauración familiar": [
    "Escribe ahora una carta breve a un familiar (no se la envías) y guárdala aquí.",
    "Identifica una carga familiar que cargas y marca la casilla al reconocerla.",
    "Ora ahora la oración de liberación familiar y confirma cuando termines.",
    "Declara en voz alta: 'Devuelvo con amor lo que no es mío' y confírmalo.",
  ],
  "sanidad emocional": [
    "Escribe ahora cómo te sientes en este momento, sin corregirte.",
    "Identifica en tu cuerpo dónde sientes esa emoción y descríbelo.",
    "Ora ahora pidiendo paz para esta emoción y confirma cuando termines.",
    "Respira profundo 3 veces con la mano en el pecho y confírmalo aquí.",
  ],
  "identidad": [
    "Escribe ahora 3 cualidades tuyas que no dependen de tus logros.",
    "Identifica la voz crítica que más repites contigo y nómbrala.",
    "Declara en voz alta una verdad sobre tu valor y confírmalo.",
    "Ora ahora agradeciendo por cómo fuiste creada/o y confírmalo.",
  ],
  "reconexión": [
    "Escribe ahora 3 cosas por las que puedes agradecer hoy.",
    "Identifica qué te ha alejado últimamente de tu momento de silencio.",
    "Ora ahora en silencio 1 minuto y confirma cuando termines.",
    "Declara en voz alta: 'Hoy elijo confiar' y confírmalo.",
  ],
  "propósito": [
    "Escribe ahora un momento donde te sentiste plenamente vivo.",
    "Identifica un don tuyo que hoy puedes usar para servir a alguien.",
    "Declara en voz alta el paso pequeño que darás hoy.",
    "Ora ahora pidiendo claridad para tu camino y confírmalo.",
  ],
  "disciplina espiritual": [
    "Escribe ahora la hora exacta en la que harás tu práctica diaria.",
    "Identifica el hábito existente al que unirás tu nueva práctica.",
    "Ora ahora 3 respiraciones con gratitud y confírmalo.",
    "Declara en voz alta tu compromiso de hoy y confírmalo.",
  ],
};

function focusKey(focusArea: string | null | undefined) {
  const key = (focusArea ?? "").toLowerCase();
  return SOLUTIONS_BY_FOCUS[key] ? key : "reconexión";
}

/** Exactamente 4 soluciones simples y accionables, coherentes con el tema de la etapa. */
export function getSolutionSteps(focusArea: string | null | undefined): string[] {
  return SOLUTIONS_BY_FOCUS[focusKey(focusArea)];
}

/** Tareas espirituales que se completan ahora mismo dentro de la app (checkbox + registro). */
export function getStageTasks(focusArea: string | null | undefined): string[] {
  return TASKS_BY_FOCUS[focusKey(focusArea)];
}
