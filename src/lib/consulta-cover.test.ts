import { describe, expect, it } from "vitest";
import { consultaCoverPath } from "./consulta-cover";

describe("consultation covers", () => {
  it("resolves the original private object instead of reusing expired signed or inaccessible public URLs", () => {
    for (const mode of ["sign", "public", "authenticated"]) {
      expect(consultaCoverPath(`https://storage.example/storage/v1/object/${mode}/content-covers/consultas/arbol.jpg?token=expired`)).toBe("consultas/arbol.jpg");
    }
  });
  it("preserves local assets, private object paths and unrelated HTTPS covers", () => {
    expect(consultaCoverPath("consultas/arbol.jpg")).toBe("consultas/arbol.jpg");
    expect(consultaCoverPath("/assets/arbol.jpg")).toBe("/assets/arbol.jpg");
    expect(consultaCoverPath("https://images.example/arbol.jpg")).toBe("https://images.example/arbol.jpg");
    expect(consultaCoverPath(null)).toBeUndefined();
  });
});