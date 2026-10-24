import { describe, expect, it } from "vitest";
import { assertOriginalSubtopic, assertOriginalRenewal, subtopicSchema, renewalPracticeSchema } from "./subtopic-validation";
import { thematicPractice } from "./visualiza-content";

const content = { ...thematicPractice("Relaciones", "Escuchar a mi pareja"), recipe_steps: ["Escribe una necesidad concreta", "Busca un momento tranquilo", "Escucha sin interrumpir"] };
describe("original subcategory generation", () => {
  it("rejects sibling questions even when the rest of the content is different", () => {
    expect(() => assertOriginalSubtopic(content, [{ quiz: { questions: [{ question: `  ${content.quiz[0].question.toUpperCase()}  ` }] } }])).toThrow("preguntas");
  });
  it("rejects reused sibling tasks", () => {
    expect(() => assertOriginalSubtopic(content, [{ quiz: { tasks: [content.tasks[0]] } }])).toThrow("tareas");
  });
  it("rejects a reused word game regardless of word order", () => {
    expect(() => assertOriginalSubtopic(content, [{ word_game: { words: [...content.search_words].reverse() } }])).toThrow("juego");
  });
  it("requires six to eight distinct words with four to nine letters for the game", () => {
    expect(subtopicSchema.safeParse(content).success).toBe(true);
    expect(subtopicSchema.safeParse({ ...content, search_words: ["PRESUPUESTO", "DIALOGO", "ESCUCHA", "RESPETO", "VINCULO", "EMPATIA"] }).success).toBe(false);
  });
  it("rejects reused steps in new and improved renewal subcategories", () => {
    const renewal = renewalPracticeSchema.parse({ duration: "10 min", objective: "Leer un pasaje bíblico en contexto", info: ["Busca un lugar tranquilo", "Lee con atención", "Respeta tu propio ritmo"], materials: ["Biblia"], steps: ["Lee un pasaje bíblico completo", "Escribe su idea principal", "Elige una aplicación concreta"], scripture: "Lámpara es a mis pies tu palabra", scripture_ref: "Salmo 119:105" });
    expect(() => assertOriginalRenewal(renewal, [{ steps: ["  LEE UN PASAJE BÍBLICO COMPLETO  "] }])).toThrow("pasos");
  });
});