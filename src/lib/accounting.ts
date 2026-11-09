/** Contabilidad ORÍGEN: funciones puras para agrupar y exportar. */
import { levelFromPlan, type Cadence } from "@/lib/plans-catalog";

export type Period = "day" | "week" | "month" | "year";

export function cadenceFromPlan(plan: string | null | undefined): Cadence {
  const p = (plan ?? "").toLowerCase();
  if (p.includes("seman") || p.includes("week")) return "weekly";
  if (p.includes("anual") || p.includes("annual") || p.includes("year")) return "annual";
  return "monthly";
}

export const CADENCE_LABEL: Record<Cadence, string> = { weekly: "Semanal", monthly: "Mensual", annual: "Anual" };

export function planPrice(plan: string | null | undefined): { name: string; cadence: string; usd: number } | null {
  const l = levelFromPlan(plan);
  if (!l) return null;
  const c = cadenceFromPlan(plan);
  return { name: l.name, cadence: CADENCE_LABEL[c], usd: l.usd[c] };
}

export function bucketKey(iso: string, period: Period): string {
  const d = new Date(iso);
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  if (period === "year") return `${y}`;
  if (period === "month") return `${y}-${m}`;
  if (period === "day") return `${y}-${m}-${day}`;
  const t = new Date(Date.UTC(y, d.getMonth(), d.getDate()));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dow);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-S${String(wk).padStart(2, "0")}`;
}

export function countBy(rows: { created_at: string }[], period: Period): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) { const k = bucketKey(r.created_at, period); m.set(k, (m.get(k) ?? 0) + 1); }
  return m;
}

const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Libro de Excel (SpreadsheetML) con una hoja por tabla; abre directo en Excel. */
export function excelWorkbook(sheets: { name: string; header: string[]; rows: (string | number)[][] }[]): string {
  const cell = (v: string | number) => typeof v === "number"
    ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>`
    : `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
  const ws = sheets.map((s) => `<Worksheet ss:Name="${esc(s.name).slice(0, 31)}"><Table>` +
    `<Row>${s.header.map((h) => `<Cell ss:StyleID="h"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join("")}</Row>` +
    s.rows.map((r) => `<Row>${r.map(cell).join("")}</Row>`).join("") + `</Table></Worksheet>`).join("");
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#E9E3F7" ss:Pattern="Solid"/></Style></Styles>${ws}</Workbook>`;
}
