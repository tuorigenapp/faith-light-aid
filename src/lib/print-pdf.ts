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
    @media print { body { padding: 20px; } .section { break-inside: avoid; } }
  `;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${opts.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>${style}</style></head><body><div class="wrap">
  <div class="brand"><div class="brand-dot"></div><div class="brand-name">ORIGEN</div></div>
  <h1>${escape(opts.title)}</h1>
  ${opts.subtitle ? `<div class="subtitle">${escape(opts.subtitle)}</div>` : ""}
  ${opts.meta ? `<div class="meta">${escape(opts.meta)}</div>` : ""}
  ${opts.sections.map(s => `
    <div class="section">
      <h2><span class="emoji">${s.emoji}</span> ${escape(s.title)}</h2>
      <p>${escape(s.body)}</p>
    </div>`).join("")}
  <div class="footer">Documento personal generado en ORIGEN · Método Ruth Esther</div>
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
};

/**
 * Genera un PDF imprimible, elegante y de marca, para cualquier tipo de consulta
 * (pareja, patrones, ministración). Usa la técnica de ventana + window.print().
 */
export function printConsulta(opts: ConsultaPDFOptions) {
  const w = window.open("", "_blank", "width=800,height=1000");
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
    @media print { body { padding: 20px; } .section { break-inside: avoid; } .cta { display:none; } }
  `;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(opts.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>${style}</style></head><body><div class="wrap">
  <div class="header">
    <div class="brand">
      <div class="brand-dot"></div>
      <div>
        <div class="brand-name">ORIGEN</div>
        <div class="brand-tag">Método Ruth Esther</div>
      </div>
    </div>
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
      <h2>${s.icon ? `<span class="icon">${s.icon}</span>` : ""} ${escape(s.title)}</h2>
      <p>${escape(s.body)}</p>
    </div>`).join("")}

  <div class="footer">
    Documento personal generado en <b>ORIGEN</b>, tu espacio de sanación y propósito.<br/>
    Sigue tu camino de transformación cada día.<br/>
    <a class="cta" href="https://faith-light-aid.lovable.app" target="_blank" rel="noopener">Continuar en ORIGEN →</a>
  </div>
  </div>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 400); });</script>
  </body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
