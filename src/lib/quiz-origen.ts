/** Quiz bíblico ORÍGEN: 5 preguntas rápidas por nivel, elegidas por fecha (sin costo de IA). */
export type QuizQuestion = { id: string; q: string; options: string[]; answer: number };

const BANK: QuizQuestion[] = [
  { id: "adan", q: "¿Cuál era el nombre del primer hombre?", options: ["Eva", "Set", "Caín", "Adán"], answer: 3 },
  { id: "noe", q: "¿Qué dijo Dios que haría porque la gente no escuchó a Noé?", options: ["Hacer un terremoto", "Iniciar un incendio", "Detener toda la lluvia", "Enviar una inundación"], answer: 3 },
  { id: "jose", q: "¿Qué hizo José con los hermanos que lo vendieron?", options: ["Los castigó", "Los perdonó", "Los ignoró", "Huyó de ellos"], answer: 1 },
  { id: "david", q: "¿Con qué venció David a Goliat?", options: ["Una espada", "Una lanza", "Una honda y una piedra", "Un arco"], answer: 2 },
  { id: "moises", q: "¿Dónde recibió Moisés los Diez Mandamientos?", options: ["Monte Sinaí", "Monte Carmelo", "Monte de los Olivos", "Monte Sion"], answer: 0 },
  { id: "prodigo", q: "En la parábola del hijo pródigo, ¿qué hizo el padre al verlo volver?", options: ["Lo regañó", "Corrió a abrazarlo", "Le cerró la puerta", "Lo envió a trabajar"], answer: 1 },
  { id: "rut", q: "¿Qué le dijo Rut a Noemí?", options: ["Vuelve a tu tierra", "Tu pueblo será mi pueblo", "No puedo seguirte", "Busca otra nuera"], answer: 1 },
  { id: "jonas", q: "¿Qué tragó a Jonás?", options: ["Un león", "Un gran pez", "Una serpiente", "Un oso"], answer: 1 },
  { id: "exodo20", q: "¿Hasta qué generación habla Éxodo 20 de las consecuencias de los padres?", options: ["Segunda", "Tercera y cuarta", "Décima", "Primera"], answer: 1 },
  { id: "salmo23", q: "Completa: «El Señor es mi pastor, …»", options: ["nada me faltará", "siempre lucharé", "todo lo puedo", "no temeré"], answer: 0 },
  { id: "panes", q: "¿Cuántos panes multiplicó Jesús para alimentar a cinco mil?", options: ["Siete", "Doce", "Cinco", "Tres"], answer: 2 },
  { id: "amor", q: "Según 1 Corintios 13, el amor es…", options: ["Orgulloso", "Paciente y bondadoso", "Celoso", "Rápido"], answer: 1 },
  { id: "abraham", q: "¿A quién pidió Dios dejar su tierra para formar un gran pueblo?", options: ["Abraham", "Isaac", "Jacob", "Lot"], answer: 0 },
  { id: "pedro", q: "¿Cuántas veces negó Pedro a Jesús?", options: ["Una", "Dos", "Tres", "Siete"], answer: 2 },
  { id: "perdon", q: "¿Cuántas veces dijo Jesús que hay que perdonar?", options: ["Siete", "Setenta veces siete", "Tres", "Diez"], answer: 1 },
  { id: "ester", q: "¿Qué reina arriesgó su vida para salvar a su pueblo?", options: ["Jezabel", "Ester", "La reina de Sabá", "Mical"], answer: 1 },
  { id: "creacion", q: "¿Qué día descansó Dios de la creación?", options: ["El primero", "El quinto", "El séptimo", "El tercero"], answer: 2 },
  { id: "samaritano", q: "¿Quién ayudó al hombre herido en la parábola?", options: ["Un sacerdote", "Un levita", "Un samaritano", "Un soldado"], answer: 2 },
  { id: "renovar", q: "Romanos 12:2 invita a transformarnos por medio de…", options: ["La fuerza", "La renovación del entendimiento", "El dinero", "La suerte"], answer: 1 },
  { id: "lazaro", q: "¿A quién resucitó Jesús después de cuatro días?", options: ["Lázaro", "Jairo", "Bartimeo", "Zaqueo"], answer: 0 },
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Cinco preguntas distintas para la fecha y el nivel (siempre las mismas para ese día y nivel). */
export function quizRound(dateIso: string, level: number): QuizQuestion[] {
  const seed = hash(`${dateIso}:${level}`);
  const order = BANK.map((q, i) => ({ q, k: hash(`${seed}:${i}`) })).sort((a, b) => a.k - b.k);
  return order.slice(0, 5).map((x) => x.q);
}

/** Pregunta corta del aviso tipo notificación (2 opciones). */
export function nudgeQuestion(dateIso: string): { q: QuizQuestion; options: [string, string]; correctIndex: 0 | 1 } {
  const q = quizRound(dateIso, 0)[0]!;
  const wrong = q.options.find((_, i) => i !== q.answer)!;
  const right = q.options[q.answer]!;
  const flip = hash(dateIso) % 2 === 0;
  return { q, options: flip ? [right, wrong] : [wrong, right], correctIndex: flip ? 0 : 1 };
}

export const QUIZ_BANK_SIZE = BANK.length;
