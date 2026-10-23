import { describe, expect, it } from "vitest";
import { christianStudyText, christianText, hasIncompatibleSpiritualLanguage } from "./christian-language";

describe("Christian spiritual content policy", () => {
  it("blocks Luna and esoteric references, regardless of case or accents", () => {
    for (const term of ["Luna", "LUNAR", "tarot", "astrología", "zodiaco", "numerología", "clarividencia", "canalización", "vidas pasadas", "energías cósmicas", "Universo", "11:11"]) {
      expect(hasIncompatibleSpiritualLanguage(`Una guía sobre ${term}.`), term).toBe(true);
    }
  });

  it("excludes incompatible PDF excerpts while retaining Christian study material", () => {
    const result = christianStudyText("La Luna determina tu destino. Confía en Dios y busca apoyo. El tarot revelará el futuro.");
    expect(hasIncompatibleSpiritualLanguage(result)).toBe(false);
    expect(result).toContain("Confía en Dios");
    expect(christianStudyText("La numerología determina tu pareja.")).toBe("");
  });

  it("provides Christian support when all proposed text is incompatible", () => {
    const result = christianText("Al cambiar la Luna llegará una revelación.");
    expect(result).toContain("Dios");
    expect(hasIncompatibleSpiritualLanguage(result)).toBe(false);
  });
});