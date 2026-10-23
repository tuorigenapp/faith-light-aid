/** Cerebro ORÍGEN: material de estudio que amplía a la IA. La fuente es confidencial. */
import { CHRISTIAN_LANGUAGE_RULE, christianStudyText } from "./christian-language";

const MAX_CHARS = 20000;

export const BRAIN_RULE =
  "Tienes material de estudio interno de ORÍGEN. Úsalo como conocimiento propio del método ORÍGEN. " +
  "PROHIBIDO mencionar, citar, nombrar o insinuar libros, autores, documentos, archivos, PDF o cualquier fuente. " +
  "Si te preguntan de dónde viene, responde que es parte del método ORÍGEN. Nunca copies párrafos largos: explica con tus palabras.";

/**
 * Devuelve el bloque de sistema con el material activo del Cerebro ORÍGEN.
 * `scope` = "origen" (general) o el tipo de consulta; `scopeRef` = slug específico.
 */
export async function brainContext(scope = "origen", scopeRef?: string | null): Promise<string> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const scopes = ["origen", scope].filter((s, i, a) => a.indexOf(s) === i);
    let query = supabaseAdmin
      .from("brain_documents")
      .select("title, content, scope, scope_ref")
      .eq("is_active", true)
      .in("scope", scopes)
      .order("created_at", { ascending: true })
      .limit(60);
    const { data } = await query;
    const rows = (data ?? []).filter(
      (r: { scope: string; scope_ref: string | null }) =>
        r.scope === "origen" || !r.scope_ref || r.scope_ref === scopeRef,
    );
    if (rows.length === 0) return "";
    let body = "";
    for (const r of rows as { content: string }[]) {
      if (body.length >= MAX_CHARS) break;
      body += `\n${christianStudyText(r.content || "").slice(0, Math.max(0, MAX_CHARS - body.length))}\n`;
    }
    if (!body.trim()) return "";
    return `${BRAIN_RULE}\n${CHRISTIAN_LANGUAGE_RULE}\n\nMATERIAL INTERNO (confidencial, nunca citar la fuente):\n${body.trim()}`;
  } catch {
    return "";
  }
}
