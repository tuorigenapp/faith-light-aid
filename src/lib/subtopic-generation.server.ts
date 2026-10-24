import { aiJson } from "./ai-content.server";
import { SUBTOPIC_CONTENT_RULE } from "./visualiza-content";
import { assertOriginalSubtopic, subtopicSchema } from "./subtopic-validation";

export async function generateSubtopicContent(input: { category: string; description: string; title: string; day: number; notes: string; recipe?: boolean; previous?: unknown[] }) {
  const prompt = `${SUBTOPIC_CONTENT_RULE}\nTema principal: ${input.category}. Descripción: ${input.description}. Subtema: ${input.title}. Día: ${input.day}. Notas: ${input.notes}.\nNo copies este contenido ya usado en otros subtemas: ${JSON.stringify(input.previous ?? []).slice(0, 14000)}\nDevuelve JSON: affirmation (frase cristiana específica), lesson (110-170 palabras), exercise (80-130 palabras), recipe_steps (3-8 pasos concretos), tasks (exactamente 3 tareas distintas), search_words (6-8 palabras distintas MAYÚSCULAS de 4-9 letras sin tildes), quiz (exactamente 3 preguntas distintas con question, options de 3 opciones distintas, correctIndex 0-2, explanation). ${input.recipe ? "Incluye materials seguros y pasos de práctica cristiana, sin rituales ni sustancias peligrosas." : "Pasos aplicables a la vida cotidiana."}`;
  const content = subtopicSchema.parse(await aiJson<unknown>(prompt, undefined, "subtema-especifico"));
  assertOriginalSubtopic(content, (input.previous ?? []) as Parameters<typeof assertOriginalSubtopic>[1]);
  return content;
}