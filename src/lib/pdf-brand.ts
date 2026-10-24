import logoUrl from "@/assets/logo-origen.png";
import bookUrl from "@/assets/libro-oficial-mockup.png";

/** Brand + promo blocks shared by every downloadable PDF (HTML print and jsPDF). */
export const APP_URL = "https://faith-light-aid.lovable.app";
export const BOOK_TITLE = "Reconectando el Espíritu con Dios";
export const BOOK_AUTHOR = "Ruth Esther Paredes Sufran";
/** Official product link supplied by the author. */
export const BOOK_AMAZON_URL = "https://a.co/d/07RJbIzg";
export const METHOD_TITLE = "MÉTODO ORÍGEN basado en el Método de Cristo";

const PLAN_KEY = "origen-plan";
export function rememberPlan(tier: "explorador" | "camino") {
  try { localStorage.setItem(PLAN_KEY, tier); } catch { /* ignore */ }
}
export function isPremiumPlan(): boolean {
  try { return localStorage.getItem(PLAN_KEY) === "camino"; } catch { return false; }
}

const abs = (u: string) => (typeof window !== "undefined" ? new URL(u, window.location.origin).href : u);

export const brandCss = `
  .ob-head{display:flex;align-items:center;gap:12px;border-bottom:2px solid #F1ECE4;padding-bottom:16px;margin-bottom:22px}
  .ob-head img{width:48px;height:48px;border-radius:12px;object-fit:contain}
  .ob-name{font-weight:800;letter-spacing:2px;font-size:15px}.ob-tag{font-size:10.5px;color:#8a7f72;letter-spacing:1.4px;text-transform:uppercase}
  .ob-promo{margin-top:26px;border:2px solid #E7DCCB;border-radius:18px;padding:18px;display:grid;grid-template-columns:120px 1fr;gap:18px;align-items:center;page-break-inside:avoid}
  .ob-promo img{width:120px;height:auto}
  .ob-promo h3{margin:0 0 6px;font-size:16px}.ob-promo p{margin:0 0 10px;font-size:13px;line-height:1.55;color:#4b4339}
  .ob-btn{display:inline-block;margin:4px 6px 0 0;background:#7C5CFF;color:#fff;font-weight:700;font-size:12px;padding:9px 16px;border-radius:10px;text-decoration:none}
  .ob-btn.alt{background:#F5EFE6;color:#5b4a36}
`;

export function brandHeaderHtml(tagline = METHOD_TITLE) {
  return `<div class="ob-head"><img src="${abs(logoUrl)}" alt="ORÍGEN"/><div><div class="ob-name">ORÍGEN</div><div class="ob-tag">${tagline}</div></div></div>`;
}

export function promoHtml(premium = isPremiumPlan()) {
  const book = `<div class="ob-promo"><img src="${abs(bookUrl)}" alt="Libro ${BOOK_TITLE}"/><div>
    <h3>${BOOK_TITLE}</h3><p>El libro de ${BOOK_AUTHOR}, autora y fundadora de ORÍGEN, donde nace este método. Tenlo en físico y subráyalo a tu ritmo.</p>
    <a class="ob-btn" href="${BOOK_AMAZON_URL}" target="_blank" rel="noopener">Comprar el libro en Amazon</a></div></div>`;
  const cta = premium
    ? `<div class="ob-promo" style="grid-template-columns:1fr"><div><h3>Lo que sanó en ti puede sanar a alguien más</h3><p>Comparte ORÍGEN con quien amas. Cada persona que se une con tu enlace recibe acompañamiento y tú ganas recompensas de afiliado.</p>
      <a class="ob-btn" href="${APP_URL}/invita" target="_blank" rel="noopener">Compartir mi enlace de afiliado</a></div></div>`
    : `<div class="ob-promo" style="grid-template-columns:1fr"><div><h3>Sigue tu proceso completo con Camino Origen</h3><p>Desbloquea todas las etapas, audios y consultas. Además recibes gratis el ebook «${BOOK_TITLE}».</p>
      <a class="ob-btn" href="${APP_URL}/membresia" target="_blank" rel="noopener">Anual US$5.99/mes</a><a class="ob-btn alt" href="${APP_URL}/membresia" target="_blank" rel="noopener">Mensual US$14.99</a></div></div>`;
  return book + cta;
}

async function toDataUrl(src: string): Promise<{ data: string; w: number; h: number }> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const context = c.getContext("2d");
  if (!context) throw new Error("No pudimos preparar la imagen del libro.");
  context.drawImage(img, 0, 0);
  return { data: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight };
}

type JsPdfLike = {
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
  addImage(d: string, f: string, x: number, y: number, w: number, h: number): unknown;
  addPage(): unknown;
  setFont(f: string, s: string): unknown; setFontSize(n: number): unknown; setTextColor(...c: number[]): unknown;
  setFillColor(...c: number[]): unknown; roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, s?: string): unknown;
  text(t: string | string[], x: number, y: number, o?: { align?: string }): unknown;
  splitTextToSize(t: string, w: number): string[];
  link(x: number, y: number, w: number, h: number, o: { url: string }): unknown;
};

/** Draws the ORÍGEN logo at the top of the current jsPDF page. */
export async function jsPdfLogo(doc: JsPdfLike, y = 8) {
  try {
    const { data } = await toDataUrl(logoUrl);
    const w = doc.internal.pageSize.getWidth();
    doc.addImage(data, "PNG", w / 2 - 7, y, 14, 14);
  } catch { /* optional */ }
}

/** Adds a closing page with the book and the subscription/affiliate call to action. */
export async function jsPdfPromoPage(doc: JsPdfLike, premium = isPremiumPlan()) {
  doc.addPage();
  await jsPdfLogo(doc, 12);
  const w = doc.internal.pageSize.getWidth();
  doc.setFont("times", "bold"); doc.setFontSize(18); doc.setTextColor(30, 25, 20);
  doc.text("Lleva este camino contigo", w / 2, 40, { align: "center" });
  try {
    const b = await toDataUrl(bookUrl);
    const bw = 60, bh = (b.h / b.w) * bw;
    doc.addImage(b.data, "PNG", w / 2 - bw / 2, 48, bw, bh);
    let y = 48 + bh + 10;
    doc.setFontSize(14); doc.text(BOOK_TITLE, w / 2, y, { align: "center" }); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90, 80, 70);
    doc.text(`por ${BOOK_AUTHOR}, autora y fundadora de ORÍGEN`, w / 2, y, { align: "center" }); y += 10;
    const btn = (label: string, url: string, yy: number) => {
      doc.setFillColor(124, 92, 255); doc.roundedRect(w / 2 - 50, yy - 6, 100, 11, 4, 4, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      doc.text(label, w / 2, yy + 1, { align: "center" });
      doc.link(w / 2 - 50, yy - 6, 100, 11, { url });
    };
    btn("Comprar el libro en Amazon", BOOK_AMAZON_URL, y); y += 22;
    doc.setTextColor(30, 25, 20); doc.setFont("times", "bold"); doc.setFontSize(13);
    doc.text(premium ? "Comparte ORÍGEN con quien amas" : "Sigue tu proceso con Camino Origen", w / 2, y, { align: "center" }); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90, 80, 70);
    const msg = premium
      ? "Lo que sanó en ti puede sanar a alguien más. Comparte tu enlace de afiliado y gana recompensas."
      : `Desbloquea todas las etapas y recibe gratis el ebook «${BOOK_TITLE}». Anual US$5.99/mes · Mensual US$14.99.`;
    doc.text(doc.splitTextToSize(msg, w - 50), w / 2, y, { align: "center" }); y += 16;
    btn(premium ? "Compartir mi enlace" : "Ver planes", premium ? `${APP_URL}/invita` : `${APP_URL}/membresia`, y);
  } catch { /* optional */ }
}
