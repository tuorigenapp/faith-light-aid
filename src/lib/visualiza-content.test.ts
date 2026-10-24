import { describe, expect, it } from "vitest";
import { resolvePractice, subtopicVisual, thematicPractice } from "./visualiza-content";
describe("subcategory-specific content", () => {
  it("gives money and couple topics distinct words, lessons, affirmations, tasks and games", () => {
    const money = thematicPractice("Oración con música", "Organizar mi dinero", 1);
    const couple = thematicPractice("Oración con música", "Escuchar a mi pareja", 1);
    for (const key of ["lesson", "exercise", "affirmation", "tasks", "search_words", "quiz"] as const) expect(money[key]).not.toEqual(couple[key]);
    expect(money.search_words).toContain("AHORRO");
    expect(couple.search_words).toContain("DIALOGO");
  });
  it("uses emojis instead of subcategory image addresses", () => {
    expect(subtopicVisual("Organizar mi dinero").emoji).toBe("🌱");
    expect(subtopicVisual("Escuchar a mi pareja").emoji).toBe("🤝");
  });
  it("preserves original editor content but replaces repeated sibling exercises", () => {
    const first = { id: "a", title: "Organizar mi dinero", day_index: 1, exercise: "La misma tarea", lesson: "Una lección original de presupuesto" };
    const second = { id: "b", title: "Escuchar a mi pareja", day_index: 2, exercise: "La misma tarea" };
    expect(resolvePractice("Oración con música", first, [first, second]).exercise).toContain("Organizar mi dinero");
    expect(resolvePractice("Oración con música", first, [first, second]).lesson).toBe("Una lección original de presupuesto");
  });
});