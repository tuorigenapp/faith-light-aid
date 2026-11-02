import { describe, expect, it } from "vitest";
import { applyCoupon, buildTemplates, pickCoupon, renderEmailHtml, splitDiscount, type HotmartCoupon } from "./marketing-render";

const c = (o: Partial<HotmartCoupon>): HotmartCoupon => ({ id: "1", text: "50% OFF anual", code: "ORIGEN50", url: "https://pay.hotmart.com/X?off=abc", plan: "all", active: true, ...o });

describe("bandeja de cupones", () => {
  it("ignora cupones pausados o con enlace inválido", () => {
    expect(pickCoupon([c({ active: false }), c({ id: "2", url: "pay.hotmart.com" })])).toBeNull();
  });
  it("sin cupón activo la plantilla no promete descuento y lleva a planes", () => {
    const r = applyCoupon({ discount_label: "60% OFF", button_url: "/x" }, null);
    expect(r.discount_label).toBeNull();
    expect(r.button_url).toBe("/membresia");
  });
  it("con cupón usa su texto, código y enlace exactos", () => {
    const r = applyCoupon({ discount_label: "60% OFF", button_url: "/x" }, c({}));
    expect(splitDiscount(r.discount_label)).toEqual({ text: "50% OFF anual", code: "ORIGEN50" });
    expect(r.button_url).toBe("https://pay.hotmart.com/X?off=abc");
    expect(renderEmailHtml({ subject: "s", content: "c", ...r, button_text: "Usar" }, { name: "Ana" })).toContain("ORIGEN50");
  });
});

describe("plantillas", () => {
  it("siguen siendo 100 e incluyen Reyes, Trabajador y Día del Niño", () => {
    const all = buildTemplates();
    expect(all).toHaveLength(100);
    const titles = all.map((t) => t.headline).join("|");
    for (const f of ["Día de Reyes", "Día del Trabajador", "Día del Niño"]) expect(titles).toContain(f);
  });
  it("solo usan colores de la paleta ORÍGEN", () => {
    const palette = ["#6d4aff", "#4b2fb8", "#7a3fa0", "#16a34a", "#a77b2c"];
    for (const t of buildTemplates()) expect(palette).toContain(t.accent);
  });
});
