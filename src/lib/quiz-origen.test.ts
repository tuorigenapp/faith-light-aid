import { describe, expect, it } from "vitest";
import { nudgeQuestion, quizRound } from "./quiz-origen";

describe("quiz ORÍGEN", () => {
  it("cada ronda tiene 5 preguntas distintas", () => {
    const r = quizRound("2026-11-02", 1);
    expect(r).toHaveLength(5);
    expect(new Set(r.map((q) => q.id)).size).toBe(5);
  });
  it("la misma fecha y nivel repiten la misma ronda", () => {
    expect(quizRound("2026-11-02", 2).map((q) => q.id)).toEqual(quizRound("2026-11-02", 2).map((q) => q.id));
  });
  it("el aviso tiene 2 opciones y una es la correcta", () => {
    const n = nudgeQuestion("2026-11-02");
    expect(n.options).toHaveLength(2);
    expect(n.options[n.correctIndex]).toBe(n.q.options[n.q.answer]);
  });
});
