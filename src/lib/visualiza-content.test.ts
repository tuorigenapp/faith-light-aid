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
  it("differentiates baths, guided visualization, future planning, writing and journaling", () => {
    const pairs = [["Baño con Sal", "Baño con Hierbas"], ["Future Self (Visualización)", "Visualización Guiada"], ["Scripting (Escritura)", "Diario de Transformación"]];
    for (const [first, second] of pairs) {
      const a = thematicPractice("Visualízalo", first);
      const b = thematicPractice("Visualízalo", second);
      expect(a.tasks[1]).not.toEqual(b.tasks[1]);
      expect(a.search_words).not.toEqual(b.search_words);
    }
    expect(thematicPractice("Limpieza", "Baño con Hierbas").tasks[1]).toContain("sin ingerir plantas");
  });
  it("handles legacy rows without ids and word games repeated in reverse order", () => {
    const first = { title: "Mi dinero", day_index: 1, exercise: "Tarea repetida", word_game: { words: ["AMOR", "CALMA"] } };
    const second = { title: "Mi pareja", day_index: 2, exercise: first.exercise, word_game: { words: ["CALMA", "AMOR"] } };
    const result = resolvePractice("Música", first, [first, second]);
    expect(result.exercise).not.toBe(first.exercise);
    expect(result.search_words).toContain("AHORRO");
  });
  it.each([
    ["369 Abundancia Financiera", "AHORRO"], ["369 Amor y Relaciones", "DIALOGO"],
    ["369 Salud y Bienestar", "SALUD"], ["369 Propósito de Vida", "TALENTO"],
    ["369 Paz Interior", "CALMA"], ["369 Éxito y Prosperidad", "PROVISION"],
    ["369 Sanación Emocional", "EMOCION"], ["369 Gratitud y Plenitud", "GRATITUD"],
    ["369 Fe y Confianza", "PACIENCIA"], ["Baño con Sal", "HIGIENE"],
    ["Baño con Hierbas", "PLANTAS"], ["Meditación Bíblica", "CONTEXTO"],
    ["Ayuno Espiritual", "PRUDENCIA"], ["Reprogramación de Creencias", "EVIDENCIA"],
    ["Construcción de Hábitos", "HORARIO"], ["Acción Valiente", "VALENTIA"],
    ["Mapa de Visión", "RECURSOS"],
  ])("keeps %s vocabulary relevant and its word game within 4–9 letters", (title, word) => {
    const practice = thematicPractice("Visualízalo", title);
    expect(practice.search_words).toContain(word);
    expect(practice.search_words.length).toBeGreaterThanOrEqual(6);
    expect(practice.search_words.every(value => /^[A-Z]{4,9}$/.test(value))).toBe(true);
  });
});
import { dailyAffirmations } from "./visualiza-content";
describe("dailyAffirmations", () => {
  it("returns at least 12 distinct affirmations per subtopic", () => {
    const a = dailyAffirmations("Sanación", "Ansiedad", 1);
    expect(new Set(a).size).toBeGreaterThanOrEqual(12);
  });
  it("changes from one day to the next", () => {
    expect(dailyAffirmations("Sanación", "Ansiedad", 1)).not.toEqual(dailyAffirmations("Sanación", "Ansiedad", 2));
  });
});
