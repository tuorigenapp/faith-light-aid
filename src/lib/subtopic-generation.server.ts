import { z } from "zod";
import { aiJson } from "./ai-content.server";
import { SUBTOPIC_CONTENT_RULE } from "./visualiza-content";

const distinct = (values: string[]) => new Set(values.map(v => v.trim().toLowerCase())).size === values.length;
export const subtopicSchema = z.object({
  affirmation: z.string().min(10).max(600), lesson: z.string().min(100).max(6000), exercise: z.string().min(50).max(6000),
  recipe_steps: z.array(z.string().min(5)).min(3).max(8),
  tasks: z.array(z.string().min(5)).length(3).refine(distinct, "Las tareas deben ser distintas"),
  search_words: z.array(z.string().regex(/^[A-Z]{4,12}$/)).min(6).max(8).refine(distinct, "Las palabras deben ser distintas"),
  quiz: z.array(z.object({ question: z.string().min(10), options: z.array(z.string().min(2)).length(3).refine(distinct), correctIndex: z.number().int().min(0).max(2), explanation: z.string().min(10) })).length(3),
  materials: z.array(z.string()).optional(),
});

export async function generateSubtopicContent(input: { category: string; description: string; title: string; day: number; notes: string; recipe?: boolean; previous?: unknown[] }) {
  const prompt = `${SUBTOPIC_CONTENT_RULE}\nTema principal: ${input.category}. Descripción: ${input.description}. Subtema: ${input.title}. Día: ${input.day}. Notas: ${input.notes}.\nNo copies este contenido ya usado en otros subtemas: ${JSON.stringify(input.previous ?? []).slice(0, 14000)}\nDevuelve JSON: affirmation (frase cristiana específica), lesson (110-170 palabras), exercise (80-130 palabras), recipe_steps (3-8 pasos concretos), tasks (exactamente 3 tareas distintas), search_words (6-8 palabras distintas MAYÚSCULAS de 4-12 letras sin tildes), quiz (exactamente 3 objetos question, options de 3 opciones distintas, correctIndex 0-2, explanation). ${input.recipe ? "Incluye materials seguros y pasos de práctica cristiana, sin rituales ni sustancias peligrosas." : "Pasos aplicables a la vida cotidiana."}`;
  const content = subtopicSchema.parse(await aiJson<unknown>(prompt, undefined, "subtema-especifico"));
  const prior = input.previous as { affirmation?: string; lesson?: string; exercise?: string; quiz?: { tasks?: string[] } }[] | undefined;
  if (prior?.some(p => p.affirmation === content.affirmation || p.lesson === content.lesson || p.exercise === content.exercise || p.quiz?.tasks?.some(task => content.tasks.includes(task)))) throw new Error("La IA repitió contenido de otra práctica. No se guardó; vuelve a intentar con notas específicas del subtema.");
  return content;
}