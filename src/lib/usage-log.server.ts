/** Registro de uso de IA y correo para el panel (solo servidor, nunca bloquea la acción). */
export async function logUsage(row: { kind: "ai" | "email"; feature: string; ok: boolean; status?: number | null; durationMs?: number; error?: string | null }) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("usage_log").insert({
      kind: row.kind, feature: row.feature, ok: row.ok, status: row.status ?? null,
      duration_ms: row.durationMs ?? null, error: row.error ? row.error.slice(0, 300) : null,
    });
  } catch {
    /* el registro nunca debe romper la creación */
  }
}
