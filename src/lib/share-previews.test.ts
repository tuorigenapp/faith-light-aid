import { describe, expect, it } from "vitest";
import { applySharePreview, sharePreviewFor } from "./share-previews";
import { methodTitleFor } from "./pdf-brand";

describe("share previews", () => {
  it("gives Comunidad its own image and title", () => {
    const p = sharePreviewFor("/comunidad");
    expect(p?.image).toBe("https://tuorigen.app/og/comunidad.jpg");
    expect(p?.title).toBe("Comunidad ORÍGEN");
  });
  it("replaces the generic title in the page", () => {
    const html = applySharePreview('<html><head><title>Genérico</title><meta property="og:title" content="Genérico"></head></html>', "/etapas");
    expect(html).not.toContain("Genérico");
    expect(html).toContain('content="https://tuorigen.app/og/etapas.jpg"');
  });
  it("leaves unknown pages alone", () => {
    expect(sharePreviewFor("/auth")).toBeNull();
  });
});

describe("PDF method line", () => {
  it("uses the Christ method inside Visualiza", () => {
    expect(methodTitleFor("/visualiza/cristo")).toBe("MÉTODO ORÍGEN BASADO EN EL MÉTODO DE CRISTO");
  });
  it("uses the book line everywhere else", () => {
    expect(methodTitleFor("/pareja")).toContain("RECONECTANDO EL ESPÍRITU CON DIOS");
  });
});
