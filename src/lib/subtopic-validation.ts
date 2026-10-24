import { z } from "zod";

const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
const distinct = (values: string[]) => new Set(values.map(normalized)).size === values.length;
export const subtopicSchema = z.object({
  affirmation: z.string().min(10).max(600), lesson: z.string().min(100).max(4000), exercise: z.string().min(50).max(2000),
  recipe_steps: z.array(z.string().min(5)).min(3).max(8),
  tasks: z.array(z.string().min(5)).length(3).refine(distinct, "Las tareas deben ser distintas"),
  search_words: z.array(z.string().regex(/^[A-Z]{4,9}$/)).min(6).max(8).refine(distinct, "Las palabras deben ser distintas"),
  quiz: z.array(z.object({ question: z.string().min(10), options: z.array(z.string().min(2)).length(3).refine(distinct), correctIndex: z.number().int().min(0).max(2), explanation: z.string().min(10) })).length(3).refine(items => distinct(items.map(q => q.question)), "Las preguntas deben ser distintas"),
  materials: z.array(z.string()).optional(),
});
type Previous = { affirmation?: string | null; lesson?: string | null; exercise?: string | null; quiz?: unknown; word_game?: unknown };
export function assertOriginalSubtopic(content: z.infer<typeof subtopicSchema>, previous: Previous[]) {
  for (const p of previous) {
    for (const key of ["affirmation", "lesson", "exercise"] as const) {
      if (p[key] && normalized(p[key]) === normalized(content[key])) throw new Error("La IA repitió contenido de otra práctica. No se guardó; agrega notas específicas del subtema y vuelve a intentar.");
    }
    const quiz = p.quiz && typeof p.quiz === "object" && !Array.isArray(p.quiz) ? p.quiz as { tasks?: string[]; questions?: { question: string }[] } : {};
    if (quiz.tasks?.some(t => content.tasks.some(v => normalized(t) === normalized(v))) || quiz.questions?.some(q => content.quiz.some(v => normalized(q.question) === normalized(v.question)))) throw new Error("La IA repitió tareas o preguntas de otra práctica. No se guardó; agrega notas específicas del subtema y vuelve a intentar.");
    const game = p.word_game && typeof p.word_game === "object" ? p.word_game as { words?: string[] } : {};
    if (game.words?.length === content.search_words.length && [...game.words].map(normalized).sort().join("|") === [...content.search_words].map(normalized).sort().join("|")) throw new Error("La IA repitió el juego de palabras de otra práctica. No se guardó; agrega notas específicas del subtema y vuelve a intentar.");
  }
}