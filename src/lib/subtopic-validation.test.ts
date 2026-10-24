import { describe, expect, it } from "vitest";
import { assertOriginalSubtopic, subtopicSchema } from "./subtopic-validation";
import { thematicPractice } from "./visualiza-content";

const content = { ...thematicPractice("Relaciones", "Escuchar a mi pareja"), recipe_steps: ["Escribe una necesidad concreta", "Busca un momento tranquilo", "Escucha sin interrumpir"] };
describe("original subcategory generation", () => {
  it("rejects sibling questions even when the rest of the content is different", () => {
    expect(() => assertOriginalSubtopic(content, [{ quiz: { questions: [{ question: `  ${content.quiz[0].question.toUpperCase()}  ` }] } }])).toThrow("preguntas");
  });
  it("rejects reused sibling tasks", () => {
    expect(() => assertOriginalSubtopic(content, [{ quiz: { tasks: [content.tasks[0]] } }])).toThrow("tareas");
  });
  it("requires six to eight distinct words with four to nine letters for the game", () => {
    expect(subtopicSchema.safeParse(content).success).toBe(true);
    expect(subtopicSchema.safeParse({ ...content, search_words: ["PRESUPUESTO", "DIALOGO", "ESCUCHA", "RESPETO", "VINCULO", "EMPATIA"] }).success).toBe(false);
  });
});