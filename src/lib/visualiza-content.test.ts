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
  it("matches Cristo financial and health lessons to their actual subjects", () => {
    const money = thematicPractice("Método de Cristo 3·6·9", "369 Abundancia Financiera");
    const health = thematicPractice("Método de Cristo 3·6·9", "369 Salud y Bienestar");
    expect(money.tasks[1]).toContain("presupuesto");
    expect(health.tasks[1]).toContain("profesional de salud");
    expect(money.search_words).toContain("AHORRO");
    expect(health.search_words).toContain("SALUD");
  });
  it("gives Bible reading and fasting distinct, safe practices without images", () => {
    const reading = thematicPractice("Limpieza Espiritual", "Meditación Bíblica");
    const fasting = thematicPractice("Limpieza Espiritual", "Ayuno Espiritual");
    expect(reading.tasks[1]).toContain("pasaje bíblico");
    expect(fasting.tasks[1]).toContain("sin restringir comida ni medicación");
    expect(reading.quiz).not.toEqual(fasting.quiz);
    expect(subtopicVisual("Meditación Bíblica").emoji).toBe("📖");
  });
  it("distinguishes habit construction from journaling in identity lessons", () => {
    expect(thematicPractice("Salto de Identidad", "Construcción de Hábitos").tasks[1]).toContain("hábito de dos minutos");
    expect(thematicPractice("Salto de Identidad", "Diario de Transformación").tasks[1]).toContain("hechos de suposiciones");
  });
  it("preserves original editor content but replaces repeated sibling exercises", () => {
    const first = { id: "a", title: "Organizar mi dinero", day_index: 1, exercise: "La misma tarea", lesson: "Una lección original de presupuesto" };
    const second = { id: "b", title: "Escuchar a mi pareja", day_index: 2, exercise: "La misma tarea" };
    expect(resolvePractice("Oración con música", first, [first, second]).exercise).toContain("Organizar mi dinero");
    expect(resolvePractice("Oración con música", first, [first, second]).lesson).toBe("Una lección original de presupuesto");
  });
});