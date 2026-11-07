/**
 * Oraciones y lecturas por momento del día (sin IA, sin créditos).
 * Selección determinista por día del año: todos ven la misma del día.
 */
import s0 from "@/assets/etapas-bg/primavera-dia.jpg";
import s2 from "@/assets/etapas-bg/verano-dia.jpg";
import s3 from "@/assets/etapas-bg/verano-tarde.jpg";
import s5 from "@/assets/etapas-bg/otono-tarde.jpg";
import s8 from "@/assets/etapas-bg/noche-1.jpg";
import s9 from "@/assets/etapas-bg/noche-2.jpg";
import s7 from "@/assets/etapas-bg/invierno-tarde.jpg";

export type MomentoId = "madrugada" | "manana" | "mediodia" | "tarde" | "noche" | "versiculo-noche" | "afirmacion";

export type Lectura = { title: string; reference: string; text: string; meditation: string };

export type Momento = {
  id: MomentoId;
  label: string;
  emoji: string;
  /** Hora local desde la que se abre (0-23). */
  fromHour: number;
  bg: string;
  pool: Lectura[];
};

const MADRUGADA: Lectura[] = [
  { title: "Oración de madrugada", reference: "Salmo 63:1", text: "Dios, tú eres mi Dios; de madrugada te buscaré. En el silencio de esta hora te entrego lo que me quita el sueño y las cargas que heredé sin pedirlas.", meditation: "La madrugada es tiempo de entrega. Lo que no puedes resolver de noche, Dios lo sostiene mientras descansas en Él." },
  { title: "Oración de madrugada", reference: "Lamentaciones 3:22-23", text: "Señor, tus misericordias son nuevas cada mañana. Antes de que salga el sol, rompe en mí todo ciclo de miedo que se repite en mi familia.", meditation: "Cada día Dios te ofrece un comienzo limpio. El patrón de ayer no tiene la última palabra sobre tu hoy." },
  { title: "Oración de madrugada", reference: "Isaías 26:3", text: "Padre, guarda mi mente en completa paz. Calma los pensamientos que vuelven una y otra vez y enséñame a confiar en ti.", meditation: "La paz no llega cuando todo se arregla, sino cuando tu mente descansa en quien todo lo sostiene." },
];

const MANANA: Lectura[] = [
  { title: "Oración de la mañana", reference: "Salmo 143:8", text: "Señor, hazme oír por la mañana tu misericordia. Hoy elijo no repetir lo que me lastimó; guía mis pasos y mis palabras.", meditation: "Empezar el día con Dios cambia la dirección de todo lo demás. Una decisión distinta hoy rompe un ciclo de años." },
  { title: "Oración de la mañana", reference: "Proverbios 3:5-6", text: "Padre, no me apoyo en mi propia prudencia. Te entrego mis decisiones, mis relaciones y mi historia familiar para que endereces mis veredas.", meditation: "Confiar no es entenderlo todo; es dejar que Dios ordene lo que tú solo no puedes ordenar." },
  { title: "Oración de la mañana", reference: "Salmo 118:24", text: "Este es el día que hizo el Señor. Me gozaré en él. Te doy gracias por mi vida y bendigo a quienes vinieron antes de mí.", meditation: "Bendecir tu raíz no es justificar el daño: es soltarlo para que no siga gobernando tu presente." },
];

const MEDIODIA: Lectura[] = [
  { title: "Oración del mediodía", reference: "Mateo 11:28", text: "Jesús, vengo a ti cansado. A la mitad del día te entrego el peso que cargo y recibo tu descanso.", meditation: "Detenerte un minuto a mitad del día también es obediencia. El alma necesita pausas para sanar." },
  { title: "Oración del mediodía", reference: "Filipenses 4:6-7", text: "Señor, no quiero afanarme. Te presento mis preocupaciones con gratitud y recibo tu paz que sobrepasa todo entendimiento.", meditation: "La ansiedad que se repite en tu familia puede detenerse en ti cuando eliges orar en lugar de controlar." },
  { title: "Oración del mediodía", reference: "Salmo 46:10", text: "Padre, me detengo y reconozco que tú eres Dios. Aquieta mi corazón y ordena mi tarde.", meditation: "Estar quieto delante de Dios no es perder tiempo; es recuperar la dirección." },
];

const TARDE: Lectura[] = [
  { title: "Oración de la tarde", reference: "Efesios 4:31-32", text: "Señor, quito de mí toda amargura. Ayúdame a perdonar como tú me perdonaste, empezando por mi propia familia.", meditation: "El perdón no borra la historia, pero corta la cadena que la hace repetirse." },
  { title: "Oración de la tarde", reference: "2 Corintios 5:17", text: "Padre, en Cristo soy nueva criatura. Lo viejo pasó. Hoy renuncio a las palabras de condena que me dijeron y recibo tu identidad.", meditation: "Lo que te dijeron de niño no define quién eres. Dios tiene la palabra final sobre tu identidad." },
  { title: "Oración de la tarde", reference: "Salmo 27:14", text: "Señor, espero en ti. Esfuerza mi corazón cuando quiero rendirme y dame paciencia para ver tu obra completa.", meditation: "Esperar en Dios no es pasividad: es seguir caminando sabiendo que Él va delante." },
];

const NOCHE: Lectura[] = [
  { title: "Oración de la noche", reference: "Salmo 4:8", text: "En paz me acostaré y asimismo dormiré, porque solo tú, Señor, me haces vivir confiado. Te entrego este día con lo bueno y lo que no salió bien.", meditation: "Cerrar el día con Dios evita que el corazón acumule lo que no le corresponde cargar." },
  { title: "Oración de la noche", reference: "1 Pedro 5:7", text: "Padre, echo sobre ti toda mi ansiedad porque tú tienes cuidado de mí. Sana esta noche las heridas que todavía duelen.", meditation: "Dios no se cansa de tus cargas. Entregarlas cada noche es parte de tu proceso de sanación." },
  { title: "Oración de la noche", reference: "Romanos 8:28", text: "Señor, confío en que todas las cosas obran para bien. Aun lo que heredé lo puedes transformar en propósito.", meditation: "Tu historia familiar no es un error en el plan de Dios; puede ser el lugar donde Él muestre su redención." },
];

const VERSICULO: Lectura[] = [
  { title: "Versículo de la noche", reference: "1 Corintios 6:19-20", text: "¿O ignoráis que vuestro cuerpo es templo del Espíritu Santo, el cual está en vosotros, el cual tenéis de Dios, y que no sois vuestros? Porque habéis sido comprados por precio.", meditation: "Tu cuerpo y tu vida pertenecen a Cristo. Esa verdad te da valor y te invita a honrar a Dios con todo lo que eres." },
  { title: "Versículo de la noche", reference: "Ezequiel 18:20", text: "El alma que pecare, esa morirá; el hijo no llevará el pecado del padre, ni el padre llevará el pecado del hijo.", meditation: "Dios no te condena por la historia de tus padres. En Él puedes caminar libre de lo que no elegiste." },
  { title: "Versículo de la noche", reference: "Jeremías 29:11", text: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice el Señor, pensamientos de paz y no de mal, para daros el fin que esperáis.", meditation: "Antes de dormir, recuerda: el plan de Dios para ti es de paz. Lo que hoy duele no es el final." },
  { title: "Versículo de la noche", reference: "Salmo 147:3", text: "Él sana a los quebrantados de corazón, y venda sus heridas.", meditation: "No necesitas fingir que estás bien. Dios trabaja precisamente en las heridas que le entregas." },
];

const AFIRMACION: Lectura[] = [
  { title: "Palabra para tu corazón", reference: "Gálatas 5:1", text: "Cristo me hizo libre. Hoy no vuelvo a someterme al yugo de los patrones que se repitieron en mi familia.", meditation: "La libertad se recibe y se elige cada día. Hoy es un buen día para elegirla." },
  { title: "Palabra para tu corazón", reference: "1 Juan 4:18", text: "En el amor no hay temor. Soy amado por Dios y no tengo que mendigar amor para sentirme valioso.", meditation: "Cuando sabes que Dios te ama, dejas de aceptar relaciones que te hieren para no estar solo." },
  { title: "Palabra para tu corazón", reference: "Génesis 50:20", text: "Lo que otros pensaron para mal, Dios lo encamina a bien. La traición no define mi futuro.", meditation: "José fue traicionado por sus hermanos y Dios usó esa historia para salvar a muchos. Tu dolor también puede tener propósito." },
  { title: "Palabra para tu corazón", reference: "Hebreos 11:1", text: "La fe es la certeza de lo que se espera. Creo que lo que Dios empezó en mí lo va a terminar.", meditation: "La fe no ignora la realidad: mira más allá de ella hacia quien tiene el poder de cambiarla." },
];

export const MOMENTOS: Momento[] = [
  { id: "madrugada", label: "Oración de madrugada", emoji: "🌌", fromHour: 0, bg: s9, pool: MADRUGADA },
  { id: "manana", label: "Oración de la mañana", emoji: "🌅", fromHour: 5, bg: s0, pool: MANANA },
  { id: "mediodia", label: "Oración del mediodía", emoji: "☀️", fromHour: 12, bg: s2, pool: MEDIODIA },
  { id: "tarde", label: "Oración de la tarde", emoji: "🌇", fromHour: 15, bg: s3, pool: TARDE },
  { id: "noche", label: "Oración de la noche", emoji: "🌙", fromHour: 19, bg: s8, pool: NOCHE },
  { id: "versiculo-noche", label: "Versículo de la noche", emoji: "📖", fromHour: 20, bg: s7, pool: VERSICULO },
  { id: "afirmacion", label: "Palabra para tu corazón", emoji: "💜", fromHour: 0, bg: s5, pool: AFIRMACION },
];

export function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const now = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((now - start) / 86400000);
}

export function getMomento(id: string): Momento | undefined {
  return MOMENTOS.find((m) => m.id === id);
}

export function lecturaFor(m: Momento, d: Date): Lectura {
  return m.pool[dayOfYear(d) % m.pool.length]!;
}

/** Abierto si ya llegó su hora hoy. La madrugada y la afirmación siempre están abiertas. */
export function isOpen(m: Momento, d: Date): boolean {
  return d.getHours() >= m.fromHour;
}

const KEY = (d: Date) => `origen_oraciones_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export function readDone(d: Date): MomentoId[] {
  try { return JSON.parse(localStorage.getItem(KEY(d)) || "[]"); } catch { return []; }
}

export function markDone(id: MomentoId, d: Date) {
  const cur = new Set(readDone(d));
  cur.add(id);
  try { localStorage.setItem(KEY(d), JSON.stringify([...cur])); } catch { /* noop */ }
}

/** Lee en voz alta con la voz del dispositivo (gratis, sin IA). */
export function speak(text: string, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-419";
  u.rate = 0.95;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("es"));
  if (voice) u.voice = voice;
  u.onend = () => onEnd?.();
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
