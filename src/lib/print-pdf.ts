import { christianText } from "./christian-language";
import { brandCss, brandHeaderHtml, methodTitleFor, promoHtml } from "./pdf-brand";

// Opens a printable view in a new window with app-branded styles so the user
// can "Save as PDF" from the native browser dialog. Zero external deps.

type Section = { emoji: string; title: string; body: string };

export function printMinistracion(opts: {
  title: string;
  subtitle?: string;
  meta?: string;
  sections: Section[];
}) {
  const w = window.open("", "_blank", "width=800,height=1000");
  if (!w) return;
  const style = `
    * { box-sizing: border-box; }
    body { font-family: 'Poppins', -apple-system, system-ui, sans-serif; color: #1B1930; margin: 0; padding: 40px 48px; background: #fff; }
    .wrap { max-width: 720px; margin: 0 auto; }
    .brand { display:flex; align-items:center; gap:10px; margin-bottom: 24px; }
    .brand-dot { width:34px; height:34px; border-radius:50%; background: linear-gradient(135deg,#7C5CFF,#F58BCB); }
    .brand-name { font-weight: 800; letter-spacing: 2px; font-size: 14px; }
    h1 { font-size: 26px; margin: 0 0 6px; line-height: 1.15; }
    .subtitle { color:#6B6A85; font-size: 13px; margin-bottom: 4px; }
    .meta { color:#8b89a3; font-size: 11px; margin-bottom: 28px; }
    .section { border: 2px solid #eadfff; border-radius: 18px; padding: 18px 20px; margin-bottom: 14px; page-break-inside: avoid; }
    .section h2 { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color:#7C5CFF; margin: 0 0 8px; display:flex; align-items:center; gap:8px; }
    .emoji { font-size: 22px; }
    .section p { margin:0; font-size: 14px; line-height: 1.6; white-space: pre-line; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ecebf4; font-size: 11px; color:#8b89a3; text-align:center; }
    .plans { margin-top: 22px; border: 2px solid #7C5CFF; border-radius: 18px; padding: 18px; page-break-inside: avoid; }
    .plans h3 { margin: 0 0 12px; font-size: 16px; color:#1B1930; }
    .plan { margin-bottom: 12px; font-size: 13px; }
    .pbtn { display:inline-block; margin: 6px 6px 0 0; background:#7C5CFF; color:#fff; font-weight:700; font-size: 12px; padding: 8px 14px; border-radius: 10px; text-decoration:none; }
    @media print { body { padding: 20px; } .section { break-inside: avoid; } }
  `;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(opts.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>${style}${brandCss}</style></head><body><div class="wrap">
  ${brandHeaderHtml()}
  <h1>${escape(opts.title)}</h1>
  ${opts.subtitle ? `<div class="subtitle">${escape(opts.subtitle)}</div>` : ""}
  ${opts.meta ? `<div class="meta">${escape(opts.meta)}</div>` : ""}
  ${opts.sections.map(s => `
    <div class="section">
      <h2><span class="emoji">${s.emoji}</span> ${escape(christianText(s.title))}</h2>
      <p>${escape(christianText(s.body))}</p>
    </div>`).join("")}
  ${promoHtml()}
  <div class="footer">Documento personal generado en ORÍGEN · ${methodTitleFor()}</div>
  </div>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 400); });</script>
  </body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escape(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// ============= Consulta PDF (professional, branded) =============

export type ConsultaPDFSection = { icon?: string; title: string; body: string };

export type ConsultaPDFOptions = {
  kind: string; // e.g. "Consulta de Pareja"
  title: string;
  subtitle?: string;
  userName?: string;
  userEmail?: string;
  plan?: string; // "Explorador" | "Camino Origen"
  date?: string;
  sections: ConsultaPDFSection[];
  /** Optional subscription buttons shown at the end (kept when printing so they stay clickable in the PDF). */
  links?: { group: string; items: { label: string; url: string }[] }[];
};

/**
 * Genera un PDF imprimible, elegante y de marca, para cualquier tipo de consulta
 * (pareja, patrones, ministración). Usa la técnica de ventana + window.print().
 */
export function printConsulta(opts: ConsultaPDFOptions) {
  // Hidden iframe: works inside the app preview and on phones where popups are blocked.
  document.getElementById("origen-print-frame")?.remove();
  const frame = document.createElement("iframe");
  frame.id = "origen-print-frame";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;";
  document.body.appendChild(frame);
  const w = frame.contentWindow;
  if (!w) return;
  const planLabel = opts.plan ?? "Explorador";
  const dateStr = opts.date ?? new Date().toLocaleDateString("es", { dateStyle: "long" });
  const style = `
    * { box-sizing: border-box; }
    body { font-family: 'Poppins', -apple-system, system-ui, sans-serif; color: #1B1930; margin: 0; padding: 40px 48px; background: #fff; }
    .wrap { max-width: 720px; margin: 0 auto; }
    .header { display:flex; align-items:center; justify-content:space-between; border-bottom: 2px solid #ECEEF5; padding-bottom: 18px; margin-bottom: 24px; }
    .brand { display:flex; align-items:center; gap:10px; }
    .brand-dot { width:36px; height:36px; border-radius:11px; background: linear-gradient(135deg,#7C5CFF,#61A8FF,#F58BCB); }
    .brand-name { font-weight: 800; letter-spacing: 2px; font-size: 15px; }
    .brand-tag { font-size: 10px; color:#8b89a3; letter-spacing: 1.5px; text-transform: uppercase; margin-top:1px; }
    .kind { font-size: 11px; font-weight:700; letter-spacing: 1.5px; text-transform: uppercase; color:#7C5CFF; background:#F5F0FF; padding:5px 12px; border-radius:999px; }
    h1 { font-size: 26px; margin: 0 0 6px; line-height: 1.2; }
    .subtitle { color:#6B6A85; font-size: 13px; margin-bottom: 18px; }
    .userbox { display:flex; flex-wrap:wrap; gap: 10px 26px; background:#FAFAFD; border:1px solid #ECEEF5; border-radius: 14px; padding: 14px 18px; margin-bottom: 26px; font-size: 12px; color:#4B4A63; }
    .userbox b { color:#1B1930; }
    .section { border: 2px solid #eadfff; border-radius: 18px; padding: 18px 20px; margin-bottom: 14px; page-break-inside: avoid; }
    .section h2 { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color:#7C5CFF; margin: 0 0 8px; display:flex; align-items:center; gap:8px; }
    .icon { font-size: 20px; }
    .section p { margin:0; font-size: 14px; line-height: 1.7; white-space: pre-line; }
    .footer { margin-top: 32px; padding-top: 18px; border-top: 1px solid #ecebf4; font-size: 11.5px; color:#6B6A85; text-align:center; line-height: 1.7; }
    .footer a { color:#7C5CFF; font-weight: 600; text-decoration: none; }
    .cta { margin-top: 10px; display:inline-block; background: linear-gradient(135deg,#7C5CFF,#F58BCB); color:#fff; font-weight:700; font-size: 12px; padding: 10px 22px; border-radius: 999px; text-decoration:none; }
    .plans { margin-top: 22px; border: 2px solid #7C5CFF; border-radius: 18px; padding: 18px; page-break-inside: avoid; }
    .plans h3 { margin: 0 0 12px; font-size: 16px; color:#1B1930; }
    .plan { margin-bottom: 12px; font-size: 13px; }
    .pbtn { display:inline-block; margin: 6px 6px 0 0; background:#7C5CFF; color:#fff; font-weight:700; font-size: 12px; padding: 8px 14px; border-radius: 10px; text-decoration:none; }
    @media print { body { padding: 20px; } .section { break-inside: avoid; } .cta { display:none; } }
  `;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(opts.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>${style}${brandCss}</style></head><body><div class="wrap">
  <div class="header">
    ${brandHeaderHtml().replace('class="ob-head"', 'class="ob-head" style="border:0;padding:0;margin:0"')}
    <div class="kind">${escape(opts.kind)}</div>
  </div>

  <h1>${escape(opts.title)}</h1>
  ${opts.subtitle ? `<div class="subtitle">${escape(opts.subtitle)}</div>` : ""}

  <div class="userbox">
    ${opts.userName ? `<div><b>${escape(opts.userName)}</b></div>` : ""}
    ${opts.userEmail ? `<div>${escape(opts.userEmail)}</div>` : ""}
    <div>Membresía: <b>${escape(planLabel)}</b></div>
    <div>Fecha: <b>${escape(dateStr)}</b></div>
  </div>

  ${opts.sections.map(s => `
    <div class="section">
      <h2>${s.icon ? `<span class="icon">${s.icon}</span>` : ""} ${escape(christianText(s.title))}</h2>
      <p>${escape(christianText(s.body))}</p>
    </div>`).join("")}

  ${opts.links?.length ? `<div class="plans"><h3>Continúa tu proceso con el Método ORÍGEN</h3>${opts.links.map(g => `<div class="plan"><b>${escape(g.group)}</b><div>${g.items.map(i => `<a class="pbtn" href="${escape(i.url)}" target="_blank" rel="noopener">${escape(i.label)}</a>`).join("")}</div></div>`).join("")}</div>` : ""}

  ${promoHtml()}
  <div class="footer">
    Documento personal generado en <b>ORIGEN</b>, tu espacio de sanación y propósito.<br/>
    Sigue tu camino de transformación cada día.<br/>
    <a class="cta" href="https://tuorigen.app" target="_blank" rel="noopener">Continuar en ORIGEN →</a>
  </div>
  </div>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 400); });</script>
  </body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}


// ============= Árbol Genealógico PDF =============

export type FamilyTreePDFMember = {
  full_name: string;
  relationship: string;
  lineage: string;
  photo_url?: string | null;
};

export function printFamilyTree(opts: {
  userName: string;
  members: FamilyTreePDFMember[];
  logoUrl?: string;
}) {
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  const dateStr = new Date().toLocaleDateString("es", { dateStyle: "long" });
  const materno = opts.members.filter((m) => m.lineage === "materno");
  const paterno = opts.members.filter((m) => m.lineage === "paterno");
  const logo = brandHeaderHtml("Árbol genealógico espiritual").match(/<img[^>]+>/)?.[0]?.replace("<img", '<img class="logo-img"') ?? `<div class="logo-dot">O</div>`;
  const memberHtml = (m: FamilyTreePDFMember) => `
    <div class="member">
      <div class="avatar">${m.photo_url ? `<img src="${escape(m.photo_url)}" alt="${escape(m.full_name)}"/>` : escape(m.full_name.slice(0,1).toUpperCase())}</div>
      <div><b>${escape(m.full_name)}</b><span>${escape(m.relationship)} · ${escape(m.lineage)}</span></div>
    </div>`;
  const style = `
    *{box-sizing:border-box} body{font-family:Poppins,-apple-system,system-ui,sans-serif;margin:0;padding:34px;background:#fbf8ff;color:#1B1930}
    .wrap{max-width:820px;margin:0 auto;background:#fff;border:1px solid #ece7f6;border-radius:24px;padding:28px;box-shadow:0 8px 30px rgba(30,25,20,.08)}
    .brand{display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid #ece7f6;padding-bottom:18px;margin-bottom:22px}.brand-left{display:flex;align-items:center;gap:12px}.logo-dot,.logo-img{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#7C5CFF,#F58BCB);color:#fff;font-weight:900;object-fit:cover}.brand-name{font-weight:900;letter-spacing:2px}.brand-url{font-size:12px;color:#7C5CFF;font-weight:800}
    h1{font-size:28px;line-height:1.15;margin:0}.meta{margin-top:6px;color:#6B6A85;font-size:13px}.tree{margin:26px 0;text-align:center}.you{display:inline-flex;align-items:center;gap:10px;padding:10px 16px;border-radius:18px;background:#F2ECFF;color:#7C5CFF;font-weight:900}.branch{height:34px;width:2px;background:#7C5CFF;margin:0 auto}.cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}.col{border:2px solid #efe7ff;border-radius:20px;padding:16px}.col h2{font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#7C5CFF;margin:0 0 12px}.member{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center;border:1px solid #f0edf7;border-radius:16px;padding:10px;margin-bottom:10px;break-inside:avoid}.avatar{width:42px;height:42px;border-radius:50%;background:#F2ECFF;color:#7C5CFF;display:grid;place-items:center;font-weight:900;overflow:hidden}.avatar img{width:100%;height:100%;object-fit:cover}.member b{display:block;font-size:13px}.member span{display:block;color:#6B6A85;font-size:11px;margin-top:2px}.empty{color:#8b89a3;font-size:13px}.footer{margin-top:22px;text-align:center;color:#6B6A85;font-size:12px;border-top:1px solid #ece7f6;padding-top:16px}.footer b{color:#7C5CFF}@media print{body{padding:0;background:#fff}.wrap{box-shadow:none;border:0}.member{break-inside:avoid}}
  `;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Árbol genealógico ORIGEN</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap" rel="stylesheet"><style>${style}${brandCss}</style></head><body><div class="wrap">
    <div class="brand"><div class="brand-left">${logo}<div><div class="brand-name">ORIGEN</div><div class="meta">Árbol genealógico espiritual</div></div></div><div class="brand-url">tuorigen.app</div></div>
    <h1>Árbol genealógico de ${escape(opts.userName)}</h1><div class="meta">Generado el ${escape(dateStr)} · ${opts.members.length} familiares registrados</div>
    <div class="tree"><div class="you">Yo · ${escape(opts.userName)}</div><div class="branch"></div></div>
    <div class="cols"><section class="col"><h2>Linaje materno</h2>${materno.length ? materno.map(memberHtml).join("") : `<p class="empty">Aún no hay familiares maternos.</p>`}</section><section class="col"><h2>Linaje paterno</h2>${paterno.length ? paterno.map(memberHtml).join("") : `<p class="empty">Aún no hay familiares paternos.</p>`}</section></div>
    ${promoHtml()}
    <div class="footer">Documento generado por <b>ORIGEN</b> · tuorigen.app<br/>Tu historia se honra, se ordena y se sana un paso a la vez.</div>
  </div><script>window.addEventListener('load',function(){setTimeout(function(){window.print()},500)})</script></body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
