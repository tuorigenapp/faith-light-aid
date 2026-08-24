/**
 * Catálogo de 365 ejercicios diarios de ORIGEN.
 * Un ejercicio por día del año, generado de forma determinista a partir de
 * una base curada de prácticas reales (sanación emocional, patrones
 * familiares heredados, niño interior, perdón, identidad y relación con Dios).
 * ORIGEN no es religión: es una invitación a una relación personal con Dios,
 * nunca lenguaje impositivo ni esotérico.
 */

import { appDayStart } from "@/lib/app-day";

export type DailyExercise = {
  day: number; // 1..365
  theme: string;
  title: string;
  purpose: string;
  durationMin: number;
  steps: string[];
  scripture?: string;
  closing: string;
};

type Template = {
  title: string;
  purpose: string;
  durationMin: number;
  steps: string[];
  scriptures?: string[];
  closing: string;
};

const THEMES = [
  "Sanación emocional",
  "Patrones familiares heredados",
  "Niño interior",
  "Perdón",
  "Identidad",
  "Relación con Dios",
  "Integración y descanso",
] as const;

// ---------------------------------------------------------------------------
// Banco de ~42 ejercicios base (6 por tema), contenido real y coherente.
// ---------------------------------------------------------------------------

const BASE: Record<(typeof THEMES)[number], Template[]> = {
  "Sanación emocional": [
    {
      title: "Nombrar sin corregir",
      purpose: "Aprender a reconocer una emoción sin apurarte a arreglarla ni justificarla.",
      durationMin: 6,
      steps: [
        "Siéntate en silencio y respira profundo tres veces.",
        "Completa en voz alta: “Hoy me sentí ___ porque ___”.",
        "No agregues “pero no es para tanto” ni te corrijas.",
        "Pon una mano en el pecho y quédate 30 segundos con esa emoción.",
        "Escribe una frase de cierre: “Está bien sentir esto, no me define”.",
      ],
      scriptures: ["“Echa sobre él toda tu ansiedad, porque él tiene cuidado de ti.” — 1 Pedro 5:7"],
      closing: "Sentir no es debilidad: es información. Hoy le diste espacio a lo que sentías en vez de esconderlo.",
    },
    {
      title: "Mapa corporal de la tensión",
      purpose: "Ubicar dónde vive el estrés en tu cuerpo para soltarlo conscientemente.",
      durationMin: 7,
      steps: [
        "Recorre tu cuerpo mentalmente de la cabeza a los pies.",
        "Detente donde sientas tensión, apretón o pesadez.",
        "Respira hacia esa zona 5 veces, sosteniendo el aire 3 segundos.",
        "Pregúntate: “¿qué historia estoy cargando aquí?”",
        "Suelta los hombros y exhala largo, como si soltaras peso.",
      ],
      closing: "Tu cuerpo guarda lo que la mente calla. Escucharlo es un acto de amor propio.",
    },
    {
      title: "Carta que no se envía",
      purpose: "Sacar del pecho lo que no has podido decirle a alguien, sin exponerte.",
      durationMin: 10,
      steps: [
        "Escribe una carta a quien te causó dolor reciente.",
        "Dile exactamente lo que sentiste, sin filtrar el enojo o la tristeza.",
        "Termina la carta con lo que necesitabas escuchar de esa persona.",
        "Léela en voz baja una vez.",
        "Rómpela, guárdala o quémala con cuidado: no se envía, se suelta.",
      ],
      closing: "No necesitas que la otra persona lea tu verdad para que sea válida. Ya la nombraste.",
    },
    {
      title: "Respiración 4·7·8 para la ansiedad",
      purpose: "Bajar la activación del cuerpo cuando la ansiedad se adelanta a los hechos.",
      durationMin: 4,
      steps: [
        "Inhala por la nariz contando 4.",
        "Sostén el aire contando 7.",
        "Exhala lento por la boca contando 8.",
        "Repite el ciclo 5 veces.",
        "Al terminar, nombra 3 cosas reales que ves a tu alrededor.",
      ],
      scriptures: ["“No se turbe vuestro corazón; creéis en Dios, creed también en mí.” — Juan 14:1"],
      closing: "La ansiedad vive en el futuro. Tu respiración te trajo de vuelta al presente.",
    },
    {
      title: "Diario de lo que sí funcionó",
      purpose: "Entrenar la mente para notar recursos propios, no solo fallas.",
      durationMin: 5,
      steps: [
        "Piensa en un momento difícil de esta semana.",
        "Escribe qué hiciste que sí ayudó, aunque haya sido pequeño.",
        "Nombra una cualidad tuya que se activó en ese momento.",
        "Agradece esa cualidad en voz alta.",
        "Guarda esta frase para releerla en tu próximo momento difícil.",
      ],
      closing: "Ya tienes más recursos internos de los que crees. Hoy los hiciste visibles.",
    },
    {
      title: "Pausa de autocompasión",
      purpose: "Tratarte con la misma ternura que le darías a alguien que amas.",
      durationMin: 5,
      steps: [
        "Pon una mano en el corazón y otra en el vientre.",
        "Di: “Este es un momento difícil”.",
        "Di: “Las dificultades son parte de la vida, no estoy solo/a”.",
        "Di: “Que pueda ser amable conmigo en este momento”.",
        "Respira hondo y quédate así 1 minuto más.",
      ],
      closing: "La autocompasión no es excusa, es el suelo desde donde sí puedes cambiar.",
    },
  ],
  "Patrones familiares heredados": [
    {
      title: "Devolver lo que no es tuyo",
      purpose: "Identificar una carga, miedo o creencia que heredaste sin elegirla.",
      durationMin: 7,
      steps: [
        "Piensa en un miedo o creencia recurrente en tu familia (dinero, amor, cuerpo, fe).",
        "Pregúntate: “¿esto nació conmigo o lo aprendí observando?”",
        "Di en voz alta: “Esto no nació conmigo, lo devuelvo con respeto”.",
        "Imagina a esa persona de tu familia y agradece la intención detrás de la carga.",
        "Escribe una nueva frase que sí quieras heredar tú a los que vienen.",
      ],
      scriptures: ["“Las cosas viejas pasaron; he aquí todas son hechas nuevas.” — 2 Corintios 5:17"],
      closing: "Puedes honrar tu historia sin repetirla. Elegir distinto también es un acto de amor familiar.",
    },
    {
      title: "El árbol de las frases repetidas",
      purpose: "Reconocer frases familiares que se convirtieron en creencias limitantes.",
      durationMin: 8,
      steps: [
        "Escribe 3 frases que escuchabas repetir en casa (“el dinero no alcanza”, “los hombres no lloran”, etc.).",
        "Junto a cada una, escribe qué efecto tuvo en tu vida adulta.",
        "Elige una y reescríbela en una versión que sí quieras vivir.",
        "Repite la nueva frase en voz alta 5 veces.",
        "Anótala en un lugar visible esta semana.",
      ],
      closing: "Las palabras que heredaste pueden actualizarse. Hoy escribiste una nueva.",
    },
    {
      title: "Silla vacía del linaje",
      purpose: "Dialogar simbólicamente con una figura familiar que marcó un patrón.",
      durationMin: 9,
      steps: [
        "Pon una silla vacía frente a ti (real o imaginaria).",
        "Siéntate y dile a esa figura familiar lo que nunca le dijiste.",
        "Cambia de lugar y responde como si fueras esa persona, con lo que sabes de su historia.",
        "Vuelve a tu lugar y di: “Elijo un camino distinto para mí”.",
        "Cierra con una respiración profunda y agradecimiento.",
      ],
      closing: "Entender de dónde viene un patrón no lo justifica, pero te da poder para cambiarlo.",
    },
    {
      title: "Línea de tiempo generacional",
      purpose: "Ver con perspectiva qué se repite y qué ya empezaste a romper.",
      durationMin: 10,
      steps: [
        "Dibuja una línea con tres generaciones: abuelos, padres, tú.",
        "Anota un patrón (silencio, control, ausencia, perfeccionismo) en cada una.",
        "Marca con un color lo que tú ya estás transformando.",
        "Escribe una frase de reconocimiento a tu propio esfuerzo.",
        "Guarda esta línea de tiempo para revisarla en un mes.",
      ],
      scriptures: ["“Yo soy Jehová, que hago misericordia... hasta la milésima generación.” — Éxodo 20:6"],
      closing: "Estás en medio de una cadena, pero tienes la posibilidad real de cambiar el siguiente eslabón.",
    },
    {
      title: "El límite que tu familia no puso",
      purpose: "Poner en práctica un límite sano que rompe un patrón de complacencia.",
      durationMin: 6,
      steps: [
        "Identifica una situación donde sueles decir “sí” por costumbre familiar.",
        "Escribe la frase concreta de tu límite (“hoy no puedo, gracias por entender”).",
        "Practica decirla en voz alta 3 veces antes de usarla.",
        "Aplícala hoy, aunque sea con algo pequeño.",
        "Al final del día, anota cómo te sentiste al sostenerlo.",
      ],
      closing: "Cada límite sano que sostienes hoy es un regalo para las próximas generaciones.",
    },
    {
      title: "Gracias y hasta aquí",
      purpose: "Honrar lo bueno recibido de la familia sin cargar con lo que ya no sirve.",
      durationMin: 6,
      steps: [
        "Escribe 3 cosas buenas que tu familia sí te dio (esfuerzo, cuidado, valores).",
        "Agradécelas en voz alta, una por una.",
        "Escribe una carga que decides no seguir cargando.",
        "Di: “Gracias por lo recibido, y hasta aquí con esto”.",
        "Respira hondo y suelta los hombros.",
      ],
      closing: "Se puede agradecer el origen y, al mismo tiempo, elegir un camino propio.",
    },
  ],
  "Niño interior": [
    {
      title: "Abrazo al niño de 7 años",
      purpose: "Darle a tu niño interior lo que necesitaba escuchar entonces.",
      durationMin: 6,
      steps: [
        "Cierra los ojos e imagina cómo eras a los 7 años.",
        "Míralo/a a los ojos y pregúntale qué necesitaba en ese momento.",
        "Dile en voz alta lo que hoy sí puedes darle: seguridad, ternura, presencia.",
        "Imagina que lo/la abrazas por el tiempo que haga falta.",
        "Termina diciendo: “Ya no estás solo/a, yo te cuido ahora”.",
      ],
      scriptures: ["“Dejad a los niños venir a mí, y no se lo impidáis.” — Mateo 19:14"],
      closing: "El niño que fuiste sigue viviendo en ti. Cuidarlo hoy cambia cómo te tratas de adulto.",
    },
    {
      title: "Foto de infancia con ternura",
      purpose: "Mirar tu historia temprana sin juicio, con compasión genuina.",
      durationMin: 5,
      steps: [
        "Busca una foto tuya de la infancia (física o mental).",
        "Obsérvala 1 minuto sin corregir nada de lo que ves.",
        "Dile a esa versión de ti: “No sabías lo que hoy sé, hiciste lo que pudiste”.",
        "Escribe una cualidad hermosa que ya tenías desde entonces.",
        "Guarda esa cualidad como un recordatorio para hoy.",
      ],
      closing: "Reconciliarte con tu historia empieza por mirarla con los ojos que hoy tienes.",
    },
    {
      title: "Juego permitido",
      purpose: "Recuperar la capacidad de disfrutar sin culpa, como cuando eras niño.",
      durationMin: 8,
      steps: [
        "Elige una actividad que disfrutabas de niño (dibujar, cantar, saltar, bailar).",
        "Hazla por 5 minutos sin buscar un resultado perfecto.",
        "Nota si aparece la voz que dice “esto es una pérdida de tiempo”.",
        "Respóndele: “Merezco disfrutar sin justificarlo”.",
        "Termina agradeciendo ese momento de juego.",
      ],
      closing: "El disfrute no hay que ganárselo. Es parte de una vida sana.",
    },
    {
      title: "Carta desde el presente hacia el pasado",
      purpose: "Ofrecer consuelo directo a un recuerdo doloroso de la infancia.",
      durationMin: 9,
      steps: [
        "Piensa en un recuerdo de infancia que aún duele al recordarlo.",
        "Escribe una carta como adulto hacia ese niño o niña que fuiste.",
        "Incluye la frase: “Yo sí te creo, y esto no fue tu culpa”.",
        "Léela en voz alta despacio.",
        "Guárdala en un lugar seguro para volver a leerla cuando lo necesites.",
      ],
      scriptures: ["“Él sana a los quebrantados de corazón, y venda sus heridas.” — Salmo 147:3"],
      closing: "Consolar a tu niño interior de adulto es una de las formas más profundas de sanar.",
    },
    {
      title: "Permiso para necesitar",
      purpose: "Reconocer necesidades legítimas que de niño quizás no pudiste pedir.",
      durationMin: 6,
      steps: [
        "Completa: “De niño necesitaba ___ y no lo pedí porque ___”.",
        "Identifica si hoy sigues sin pedir eso mismo.",
        "Elige una necesidad concreta para hoy (descanso, compañía, silencio).",
        "Pídela en voz alta, aunque sea solo para ti.",
        "Date permiso de recibirla sin culpa.",
      ],
      closing: "Pedir lo que necesitas no te hace una carga. Te hace una persona honesta contigo misma.",
    },
    {
      title: "Reescribir la escena",
      purpose: "Dar un nuevo final imaginario a un recuerdo que quedó incompleto.",
      durationMin: 8,
      steps: [
        "Recuerda una escena de la infancia donde te hubiera gustado recibir más apoyo.",
        "Ciérrala como está en tu memoria, sin cambiar los hechos.",
        "Ahora imagina que un adulto de confianza (o tú mismo hoy) entra a esa escena.",
        "Escucha lo que esa figura le dice al niño o niña que fuiste.",
        "Respira y agradece poder darte eso hoy.",
      ],
      closing: "No puedes cambiar el pasado, pero sí puedes darle a tu historia un cierre más amable.",
    },
  ],
  Perdón: [
    {
      title: "Perdonar no es olvidar",
      purpose: "Distinguir perdón de justificación para soltar sin negar el daño.",
      durationMin: 7,
      steps: [
        "Piensa en alguien a quien te cuesta perdonar.",
        "Escribe: “Lo que hiciste no estuvo bien, y aun así elijo soltar el peso que cargo”.",
        "Nota que perdonar no significa que la relación siga igual.",
        "Respira y suelta los puños, la mandíbula, los hombros.",
        "Cierra diciendo: “Te suelto para poder estar en paz, no para darte la razón”.",
      ],
      scriptures: ["“Antes sed benignos unos con otros... perdonándoos unos a otros.” — Efesios 4:32"],
      closing: "Perdonar es un proceso, no un evento. Hoy diste un paso real hacia tu libertad.",
    },
    {
      title: "La lista de lo que aún duele",
      purpose: "Poner en palabras concretas qué falta perdonar exactamente.",
      durationMin: 8,
      steps: [
        "Escribe una lista de situaciones específicas, no generalidades.",
        "Junto a cada una, anota qué sentiste en ese momento.",
        "Elige la que más peso tiene hoy.",
        "Dí en voz alta: “Reconozco el dolor, y elijo empezar a soltarlo”.",
        "Guarda la lista para seguir trabajándola en los próximos días.",
      ],
      closing: "No se perdona todo de una vez. Nombrar con precisión ya es sanar.",
    },
    {
      title: "Perdonarte a ti mismo/a",
      purpose: "Trabajar la culpa por decisiones o errores propios del pasado.",
      durationMin: 7,
      steps: [
        "Piensa en algo que hiciste y aún te reprochas.",
        "Escribe qué necesitabas o no sabías en ese momento.",
        "Di en voz alta: “Hice lo que pude con lo que tenía entonces”.",
        "Escribe qué harías diferente hoy, con lo que ya sabes.",
        "Cierra con: “Me perdono y elijo aprender, no castigarme”.",
      ],
      scriptures: ["“Si confesamos nuestros pecados, él es fiel y justo para perdonarnos.” — 1 Juan 1:9"],
      closing: "La culpa que no se convierte en aprendizaje solo desgasta. Hoy la transformaste.",
    },
    {
      title: "Oración de entrega",
      purpose: "Soltar en oración lo que tu voluntad sola no ha podido perdonar.",
      durationMin: 6,
      steps: [
        "Busca un lugar tranquilo y respira profundo.",
        "Nombra ante Dios a la persona o situación que te cuesta soltar.",
        "Dile con tus propias palabras: “No puedo solo/a con esto, te lo entrego”.",
        "Quédate en silencio 2 minutos escuchando, sin llenar el espacio de palabras.",
        "Cierra con un “gracias” aunque el proceso no esté terminado.",
      ],
      closing: "No necesitas sentirte listo/a para orar por esto. La entrega abre el camino.",
    },
    {
      title: "El costo de no perdonar",
      purpose: "Ver con honestidad qué te está costando sostener el resentimiento.",
      durationMin: 6,
      steps: [
        "Escribe qué energía, sueño o paz te quita seguir con este resentimiento.",
        "Pregúntate: “¿esta persona sabe siquiera lo que me cuesta hoy?”",
        "Imagina cómo te sentirías con ese peso más liviano.",
        "Elige una acción pequeña de hoy que represente empezar a soltar.",
        "Realízala (una llamada, una carta, un silencio consciente).",
      ],
      closing: "El resentimiento cobra un precio invisible. Soltar es recuperar tu propia energía.",
    },
    {
      title: "Bendecir en lugar de maldecir",
      purpose: "Practicar una respuesta interna distinta ante quien te hirió.",
      durationMin: 5,
      steps: [
        "Piensa en la persona que más te cuesta perdonar hoy.",
        "En vez de desearle mal, elige desearle: “que encuentre sanidad también”.",
        "Repite esa frase 3 veces, notando la resistencia si aparece.",
        "Respira y observa si algo se afloja en tu pecho.",
        "Cierra agradeciendo tu propio esfuerzo por intentarlo.",
      ],
      scriptures: ["“Bendecid a los que os maldicen.” — Lucas 6:28"],
      closing: "Bendecir no absuelve el daño, pero libera tu corazón del rol de juez permanente.",
    },
  ],
  Identidad: [
    {
      title: "Espejo sin crítica",
      purpose: "Practicar mirarte sin la voz automática del juicio.",
      durationMin: 3,
      steps: [
        "Párate frente a un espejo.",
        "Mírate a los ojos por 60 segundos sin desviar la mirada.",
        "Repite: “Soy digno/a de amor sin condiciones”.",
        "Nota qué pensamientos críticos aparecen, sin pelear con ellos.",
        "Termina con una sonrisa pequeña, aunque se sienta incómodo.",
      ],
      closing: "Tu valor no se mide en el espejo. Practicar mirarte con respeto lo recuerda.",
    },
    {
      title: "Quién dices que soy",
      purpose: "Contrastar las etiquetas que te pusieron con lo que tú sabes de ti.",
      durationMin: 7,
      steps: [
        "Escribe 3 etiquetas que otros te pusieron (“el/la difícil”, “el/la fuerte”, etc.).",
        "Junto a cada una, escribe si realmente te representa hoy.",
        "Escribe 3 palabras que tú elegirías para describirte.",
        "Léelas en voz alta como una declaración.",
        "Guarda esta lista y repítela cuando dudes de quién eres.",
      ],
      scriptures: ["“Formidables, maravillosas son tus obras.” — Salmo 139:14"],
      closing: "No eres lo que dijeron de ti una vez. Eres lo que decides reconocer hoy.",
    },
    {
      title: "Postura de valor",
      purpose: "Usar el cuerpo para recordarle a la mente quién eres.",
      durationMin: 3,
      steps: [
        "Ponte de pie con los hombros atrás y el pecho abierto.",
        "Respira profundo 5 veces en esa postura.",
        "Repite mentalmente: “Tengo un lugar en este mundo”.",
        "Camina 10 pasos manteniendo esa postura.",
        "Nota cómo cambia tu estado de ánimo con el cuerpo erguido.",
      ],
      closing: "La postura no es solo física. Es una decisión de cómo te presentas al mundo.",
    },
    {
      title: "Sin justificar el no",
      purpose: "Practicar decir que no sin dar explicaciones excesivas.",
      durationMin: 4,
      steps: [
        "Identifica una petición de hoy a la que quieres decir que no.",
        "Practica la frase: “No puedo, gracias por entender”.",
        "Dila sin agregar excusas largas.",
        "Observa la incomodidad si aparece, sin retractarte.",
        "Anota cómo te sentiste al sostener tu decisión.",
      ],
      closing: "No debes justificar tus límites para que sean válidos.",
    },
    {
      title: "Diez de tu presente",
      purpose: "Reconocer con gratitud quién eres hoy, no solo quién quieres ser.",
      durationMin: 5,
      steps: [
        "Escribe 10 cosas que agradeces de tu vida actual, tal como es.",
        "Evita comparar con la vida que “deberías” tener.",
        "Lee la lista en voz alta.",
        "Elige una y profundiza: ¿por qué es valiosa?",
        "Cierra con: “Mi presente también tiene valor”.",
      ],
      closing: "La gratitud por el presente no te conforma: te da un lugar firme desde donde crecer.",
    },
    {
      title: "Mi nombre, mi historia",
      purpose: "Reconectar con el significado y la historia detrás de tu propio nombre.",
      durationMin: 6,
      steps: [
        "Investiga o recuerda por qué te pusieron tu nombre.",
        "Escribe qué sientes al conocer esa historia.",
        "Dí tu nombre completo en voz alta, despacio.",
        "Agrega: “Llevo este nombre con dignidad”.",
        "Nota si esto cambia algo en cómo te percibes hoy.",
      ],
      closing: "Tu nombre es parte de tu historia, y tú decides con qué dignidad lo llevas.",
    },
  ],
  "Relación con Dios": [
    {
      title: "Oración sin fórmulas",
      purpose: "Hablar con Dios como se habla con alguien de confianza, sin frases hechas.",
      durationMin: 6,
      steps: [
        "Busca un lugar tranquilo y respira profundo.",
        "Empieza a hablarle a Dios con tus propias palabras, sin fórmulas memorizadas.",
        "Cuéntale algo real que te pasó hoy.",
        "Pídele lo que de verdad necesitas, sin adornarlo.",
        "Termina en silencio, solo escuchando por un minuto.",
      ],
      scriptures: ["“Acercaos a Dios, y él se acercará a vosotros.” — Santiago 4:8"],
      closing: "ORIGEN no propone rituales vacíos, sino una relación real. Hoy diste un paso hacia ella.",
    },
    {
      title: "Silencio con mano al pecho",
      purpose: "Practicar la quietud como espacio de encuentro, no de ausencia.",
      durationMin: 4,
      steps: [
        "Siéntate cómodo/a y pon una mano sobre el pecho.",
        "Cierra los ojos y respira lento durante 3 minutos.",
        "No busques palabras, solo permanece presente.",
        "Si llega un pensamiento, déjalo pasar sin aferrarte.",
        "Termina diciendo: “Aquí estoy”.",
      ],
      closing: "No toda oración necesita palabras. A veces la presencia basta.",
    },
    {
      title: "Entrega escrita",
      purpose: "Poner por escrito lo que hoy no puedes controlar y soltarlo en confianza.",
      durationMin: 5,
      steps: [
        "Escribe una situación que te preocupa hoy.",
        "Debajo, escribe: “Esto lo entrego, no lo cargo solo/a”.",
        "Lee la frase en voz alta.",
        "Dobla o guarda el papel como símbolo de la entrega.",
        "Respira hondo antes de continuar tu día.",
      ],
      scriptures: ["“Echa tu carga sobre Jehová, y él te sustentará.” — Salmo 55:22"],
      closing: "Entregar no es dejar de actuar, es dejar de cargar solo/a lo que no depende de ti.",
    },
    {
      title: "Gratitud como oración",
      purpose: "Usar el agradecimiento consciente como una forma directa de conexión con Dios.",
      durationMin: 5,
      steps: [
        "Piensa en 3 cosas concretas de hoy por las que estás agradecido/a.",
        "Dilas en voz alta dirigidas a Dios, no solo al aire.",
        "Nota cómo se siente tu cuerpo al agradecer en vez de pedir.",
        "Agrega una gratitud por algo difícil que también te enseñó.",
        "Cierra con un “gracias” simple y sincero.",
      ],
      closing: "La gratitud dirigida transforma la queja en una conversación real.",
    },
    {
      title: "Leer para encontrarte, no para cumplir",
      purpose: "Acercarte a un texto espiritual sin la presión de una tarea religiosa.",
      durationMin: 8,
      steps: [
        "Elige un pasaje corto (un salmo, un evangelio breve).",
        "Léelo despacio, sin apuro por “terminar”.",
        "Subraya o anota una frase que te haya tocado.",
        "Pregúntate: “¿qué me dice esto de quién es Dios para mí hoy?”",
        "Escribe una línea de respuesta personal.",
      ],
      scriptures: ["“Lámpara es a mis pies tu palabra.” — Salmo 119:105"],
      closing: "No se trata de cumplir una lectura, sino de encontrarte con algo real en ella.",
    },
    {
      title: "Confianza en lo que no controlas",
      purpose: "Practicar soltar el control como acto de fe activa, no de resignación pasiva.",
      durationMin: 6,
      steps: [
        "Escribe una situación que te genera ansiedad por controlar.",
        "Nombra qué parte sí depende de ti y qué parte no.",
        "Comprométete a actuar solo en lo que sí depende de ti.",
        "Di en voz alta: “Confío en que no estoy solo/a en esto”.",
        "Respira y cierra el ejercicio dejando esa carga simbólicamente en tus manos abiertas hacia arriba.",
      ],
      closing: "La fe no elimina la incertidumbre, pero cambia con quién la enfrentas.",
    },
  ],
  "Integración y descanso": [
    {
      title: "Revisión semanal de sanación",
      purpose: "Detenerte a notar qué has trabajado y qué sigue en proceso.",
      durationMin: 8,
      steps: [
        "Revisa mentalmente los últimos días: ¿qué emociones aparecieron?",
        "Escribe un avance, por pequeño que sea, que notaste en ti.",
        "Escribe algo que aún duele y sigue en proceso, sin exigirte cerrarlo.",
        "Agradece el esfuerzo de seguir presentándote a este trabajo interior.",
        "Elige una intención simple para los próximos días.",
      ],
      closing: "Sanar no es lineal. Revisar el camino con honestidad también es parte del proceso.",
    },
    {
      title: "Permiso para descansar",
      purpose: "Practicar el descanso como parte del proceso de sanación, no como pausa culposa.",
      durationMin: 5,
      steps: [
        "Elige 5 minutos donde no harás nada productivo.",
        "Siéntate o recuéstate sin pantallas ni tareas pendientes.",
        "Si aparece culpa, dile: “el descanso también es parte del proceso”.",
        "Respira lento y deja que el cuerpo se afloje.",
        "Al terminar, anota cómo te sentiste.",
      ],
      scriptures: ["“Venid a mí... y yo os haré descansar.” — Mateo 11:28"],
      closing: "El descanso no es una interrupción de tu sanación, es parte de ella.",
    },
    {
      title: "Cuerpo agradecido",
      purpose: "Reconciliarte con tu cuerpo como aliado, no como enemigo.",
      durationMin: 6,
      steps: [
        "Recorre tu cuerpo con atención, de pies a cabeza.",
        "Agradece en voz alta una función de cada parte (“gracias, piernas, por sostenerme”).",
        "Nota si hay zonas con las que te cuesta ser amable.",
        "Ponles una mano encima y respira hondo.",
        "Cierra con: “Gracias, cuerpo, por acompañarme hoy”.",
      ],
      closing: "La sanación también pasa por hacer las paces con el cuerpo que te sostiene cada día.",
    },
    {
      title: "Celebrar lo pequeño",
      purpose: "Entrenar el hábito de celebrar avances mínimos, sin esperar grandes resultados.",
      durationMin: 4,
      steps: [
        "Piensa en algo pequeño que lograste esta semana.",
        "Descríbelo en detalle, sin minimizarlo.",
        "Celebra con un gesto físico (aplauso, sonrisa, respiración profunda).",
        "Dí: “Esto también cuenta”.",
        "Comparte este logro con alguien de confianza si es posible.",
      ],
      closing: "Los procesos de sanación se sostienen en la suma de pequeños pasos celebrados.",
    },
    {
      title: "Naturaleza como pausa",
      purpose: "Usar un entorno natural, aunque sea breve, para regular el sistema nervioso.",
      durationMin: 7,
      steps: [
        "Sal al aire libre o acércate a una ventana con vista al cielo o plantas.",
        "Observa 3 detalles que normalmente no notas (color, textura, movimiento).",
        "Respira el aire profundamente varias veces.",
        "Agradece en silencio ese momento de pausa.",
        "Vuelve a tu actividad con esa calma contigo.",
      ],
      closing: "No necesitas mucho tiempo para reconectar. Un momento consciente ya hace la diferencia.",
    },
    {
      title: "Cierre del día con sentido",
      purpose: "Terminar el día reconociendo el proceso, no solo la lista de pendientes.",
      durationMin: 5,
      steps: [
        "Antes de dormir, pregúntate: “¿qué aprendí hoy de mí mismo/a?”",
        "Escribe una frase breve con la respuesta.",
        "Agradece por algo concreto del día, aunque haya sido difícil.",
        "Suelta en oración o en silencio lo que quedó pendiente.",
        "Respira profundo y permite que el cuerpo se relaje para dormir.",
      ],
      closing: "Cerrar el día con intención convierte cada jornada en parte de tu sanación, no solo en rutina.",
    },
  ],
};

const TOTAL_DAYS = 365;

function seasonLabel(day: number): string {
  if (day <= 91) return "este primer tramo del año";
  if (day <= 182) return "esta segunda etapa del año";
  if (day <= 273) return "este tercer tramo del año";
  return "este cierre de año";
}

/** Devuelve el día del año (1..365) para una fecha dada. */
export function dayOfYear(date: Date = new Date()): number {
  const appDate = appDayStart(date);
  const start = new Date(appDate.getFullYear(), 0, 0);
  const diff =
    appDate.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - appDate.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return Math.min(Math.max(day, 1), TOTAL_DAYS);
}

/** Genera el ejercicio correspondiente a un día del año (1..365), determinista. */
export function getExerciseForDay(day: number): DailyExercise {
  const clamped = Math.min(Math.max(Math.round(day), 1), TOTAL_DAYS);
  const themeIndex = (clamped - 1) % THEMES.length;
  const theme = THEMES[themeIndex];
  const templates = BASE[theme];
  const round = Math.floor((clamped - 1) / THEMES.length); // vuelta del ciclo temático
  const template = templates[round % templates.length];
  const scriptureList = template.scriptures ?? [];
  const scripture = scriptureList.length
    ? scriptureList[round % scriptureList.length]
    : undefined;

  const weekNumber = Math.ceil(clamped / 7);
  const title = round === 0 ? template.title : `${template.title} · Día ${clamped}`;
  const purpose = `${template.purpose} (Semana ${weekNumber} de ${seasonLabel(clamped)}.)`;

  return {
    day: clamped,
    theme,
    title,
    purpose,
    durationMin: template.durationMin,
    steps: template.steps,
    scripture,
    closing: template.closing,
  };
}

/** Ejercicio de hoy, según la fecha del dispositivo. */
export function getTodayExercise(): DailyExercise {
  return getExerciseForDay(dayOfYear());
}

/**
 * Un día está desbloqueado si es hoy o un día anterior a hoy.
 * `startDay` por defecto es el día del año actual, así todos ven el mismo
 * calendario: pasado y hoy visibles, futuro bloqueado.
 */
export function isDayUnlocked(day: number, startDay: number = dayOfYear()): boolean {
  return day <= startDay;
}

/** Lista completa de los 365 ejercicios (para calendario/listado). */
export function getAllExercises(): DailyExercise[] {
  const list: DailyExercise[] = [];
  for (let d = 1; d <= TOTAL_DAYS; d++) list.push(getExerciseForDay(d));
  return list;
}

export { TOTAL_DAYS, THEMES };

// ---------------------------------------------------------------------------
// Contenido derivado por día: todo se calcula del propio DailyExercise, para
// que quiz, palabras del juego y ejercicio práctico nunca se sientan ajenos.
// ---------------------------------------------------------------------------

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

const OTHER_THEME_HINTS: Record<(typeof THEMES)[number], string> = {
  "Sanación emocional": "Dejar que una emoción pase sin juzgarla",
  "Patrones familiares heredados": "Reconocer una herencia emocional para no repetirla",
  "Niño interior": "Cuidar la parte de ti que sigue necesitando ternura",
  Perdón: "Soltar una deuda emocional aunque el otro no la pague",
  Identidad: "Recordar quién eres más allá de lo que haces",
  "Relación con Dios": "Acercarte a Dios desde la confianza, no desde el miedo",
  "Integración y descanso": "Detenerte a integrar lo vivido sin culpa",
};

function seeded(n: number, mod: number) {
  return ((n * 2654435761) >>> 0) % mod;
}

/** Extrae palabras significativas de una lista de frases (para juegos). */
function extractKeywords(sentences: string[], min = 4, max = 9): string[] {
  const stop = new Set([
    "para","como","este","esta","esto","pero","donde","hacia","desde","cuando",
    "sobre","entre","hasta","cada","algo","alguien","tienes","hoy","aunque",
    "sientas","siente","respira","escribe","cierra","empieza","ponte","dile",
]);
  const words = sentences
    .join(" ")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= min && w.length <= max)
    .filter((w) => !stop.has(w.toLowerCase()));
  return Array.from(new Set(words));
}

/** Palabras clave del día, derivadas del título y los pasos del ejercicio. */
export function getExerciseKeywords(ex: DailyExercise): string[] {
  const fromTitle = extractKeywords([ex.title], 3, 9);
  const fromSteps = extractKeywords(ex.steps, 4, 9);
  const words = Array.from(new Set([...fromTitle, ...fromSteps]));
  if (words.length >= 6) return words.slice(0, 8);
  // relleno determinista por tema si el texto no alcanza
  const fallback = extractKeywords([ex.purpose, ex.closing, ex.theme], 4, 10);
  return Array.from(new Set([...words, ...fallback])).slice(0, 8);
}

/** Quiz de 3 preguntas de opción múltiple, generado del ejercicio de hoy. */
export function getExerciseQuiz(ex: DailyExercise): QuizQuestion[] {
  const themeIdx = THEMES.indexOf(ex.theme as (typeof THEMES)[number]);
  const distractorThemes = THEMES.filter((t) => t !== ex.theme);

  const q1Options = [ex.purpose, ...distractorThemes.slice(0, 3).map((t) => OTHER_THEME_HINTS[t])];
  const q1Order = [0, 1, 2, 3].sort((a, b) => seeded(ex.day + a, 97) - seeded(ex.day + b, 97));

  const stepsLen = ex.steps.length;
  const q2Options = [stepsLen - 1, stepsLen, stepsLen + 1, stepsLen + 2].filter((n) => n > 0);
  while (q2Options.length < 4) q2Options.push(stepsLen + q2Options.length);

  const q3Options = [ex.theme, ...distractorThemes.slice(0, 3)];

  function shuffledWithCorrect<T>(options: T[], correctValue: T, seedBase: number) {
    const idx = options.findIndex((o) => o === correctValue);
    const order = options.map((_, i) => i).sort((a, b) => seeded(seedBase + a, 89) - seeded(seedBase + b, 89));
    const shuffled = order.map((i) => options[i]);
    return { options: shuffled, correctIndex: order.indexOf(idx) };
  }

  const s1 = shuffledWithCorrect(q1Options, ex.purpose, ex.day);
  const s2 = shuffledWithCorrect(
    q2Options.map(String),
    String(stepsLen),
    ex.day + 1,
  );
  const s3 = shuffledWithCorrect(q3Options, ex.theme, ex.day + 2);

  return [
    {
      question: `¿Cuál es el propósito del ejercicio de hoy, "${ex.title}"?`,
      options: s1.options,
      correctIndex: s1.correctIndex,
      explanation: ex.purpose,
    },
    {
      question: "¿Cuántos pasos tiene el ejercicio de hoy?",
      options: s2.options,
      correctIndex: s2.correctIndex,
      explanation: `El ejercicio de hoy tiene ${stepsLen} pasos concretos.`,
    },
    {
      question: "¿A qué tema pertenece la práctica de hoy?",
      options: s3.options,
      correctIndex: s3.correctIndex,
      explanation: `Hoy trabajas: ${ex.theme}.`,
    },
  ];
}

export type GameKind = "cofre" | "adivina" | "sopa" | "pimpon" | "pez" | "dardo";
const GAME_ORDER: GameKind[] = ["cofre", "adivina", "sopa", "pimpon", "pez", "dardo"];

/** Juego del día: rota entre los 6 tipos según el día, siempre determinista. */
export function getGameKindForDay(day: number): GameKind {
  return GAME_ORDER[(day - 1) % GAME_ORDER.length];
}

/** Palabra principal del ejercicio para juegos de adivinar (más larga y significativa del título). */
export function getMainWord(ex: DailyExercise): string {
  const words = extractKeywords([ex.title], 3, 12);
  if (words.length) return words.sort((a, b) => b.length - a.length)[0];
  return extractKeywords([ex.theme], 3, 14)[0] ?? "ORIGEN";
}
