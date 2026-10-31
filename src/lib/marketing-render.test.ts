import { describe, expect, it } from "vitest";
import { buildPush, buildTemplates, personalize, renderEmailHtml, renderPushText } from "./marketing-render";

describe("marketing render", () => {
  it("pone el nombre real en asunto y cuerpo", () => {
    expect(personalize("[usuario], tu regalo", "Ruth")).toBe("Ruth, tu regalo");
  });
  it("sin nombre usa un saludo cálido", () => {
    expect(personalize("Hola [usuario]", "")).toBe("Hola amiga");
  });
  it("las etiquetas de sección se vuelven botón en el correo", () => {
    const html = renderEmailHtml({ subject: "x", content: "Mira [etapas]" }, { name: "Ruth" });
    expect(html).toContain("https://tuorigen.app/etapas");
    expect(html).toContain("Ir a Camino ORÍGEN");
    expect(html).not.toContain("[etapas]");
  });
  it("todo correo lleva soporte y opción de dejar de recibir", () => {
    const html = renderEmailHtml({ subject: "x", content: "hola" }, { name: "" });
    expect(html).toContain("supportorigenapp@gmail.com");
    expect(html).toContain("Dejar de recibir estos mensajes");
  });
  it("en push la etiqueta define a dónde lleva", () => {
    expect(renderPushText("Entra a [palabra]", "Ruth")).toEqual({ text: "Entra a Palabra de hoy", url: "/palabra" });
  });
  it("push con banner incluye la imagen absoluta", () => {
    const p = buildPush({ subject: "Hola", content: "x", button_url: null, image_url: "/email/banner-metodo.jpg", push_style: "banner" }, "Ruth");
    expect(p.image).toBe("https://tuorigen.app/email/banner-metodo.jpg");
  });
  it("la biblioteca tiene exactamente 100 plantillas, con remarketing", () => {
    const t = buildTemplates();
    expect(t).toHaveLength(100);
    expect(t.filter((x) => x.category === "remarketing")).toHaveLength(10);
  });
});
