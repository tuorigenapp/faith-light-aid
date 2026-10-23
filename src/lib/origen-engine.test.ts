import { describe, expect, it, vi } from "vitest";
import { hasIncompatibleSpiritualLanguage } from "./christian-language";

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({ eq: () => ({ in: () => ({ limit: async () => ({ data: [
        { scope: "origen", scope_ref: null, content: "La Luna y el tarot revelarán el futuro de tu familia con exactitud. Puedes acercarte a Dios con sinceridad y buscar consejo de alguien de confianza." },
      ] }) }) }) }),
    }),
  },
}));

import { engineMinistracion, enginePareja, enginePatrones, engineSections } from "./origen-engine.server";

describe("ORÍGEN consultation language", () => {
  it("keeps all three demo and internal consultation types Christian", async () => {
    for (const result of [
      await engineMinistracion({ scope: "ministracion", name: "Ana", question: "¿Qué dice la Luna y el tarot sobre mi vida?" }),
      await enginePareja({ scope: "pareja", name: "Ana", question: "¿Qué dice la astrología?", partnerName: "Carlos" }),
      await enginePatrones({ scope: "patrones", name: "Ana", question: "¿Hay karma en mi familia?", familyCount: 1 }),
    ]) {
      expect(hasIncompatibleSpiritualLanguage(JSON.stringify(result))).toBe(false);
      expect(JSON.stringify(result)).toContain("Dios");
    }
  });

  it("applies the same policy to newly created consultation sections", async () => {
    const answer = await engineSections({ scope: "consulta", name: "Ana", question: "Quiero entender mi familia", title: "Luna y numerología" }, [
      { key: "estado", label: "Energía" }, { key: "futuro", label: "Próximos días" },
      { key: "senales", label: "Señales" }, { key: "oracion", label: "Mensaje" },
    ]);
    expect(hasIncompatibleSpiritualLanguage(JSON.stringify(answer))).toBe(false);
    expect(answer.oracion).toContain("Dios");
  });

  it("never determines relationship compatibility from either birth date", async () => {
    const input = { scope: "pareja", name: "Ana", partnerName: "Carlos", question: "¿Cómo hablar con respeto?" };
    const first = await enginePareja({ ...input, birthdate: "1990-01-01", partnerDob: "1989-02-03" });
    const second = await enginePareja({ ...input, birthdate: "2000-12-31", partnerDob: "1970-04-05" });
    expect(first.verdict).toBe("proposito");
    expect(second.verdict).toBe("proposito");
  });
});