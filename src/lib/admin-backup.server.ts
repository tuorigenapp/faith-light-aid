import { createHash, randomInt } from "crypto";

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

/** Genera y envía por correo un código de 6 dígitos para confirmar la copia. */
export async function requestBackupCode(userId: string, email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const code = String(randomInt(100000, 999999));
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await supabaseAdmin.from("admin_backup_codes").insert({
    email,
    code_hash: hashCode(code),
    requested_by: userId,
    expires_at: expires.toISOString(),
  });

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { sent: false, unconfigured: true as const };

  const { sendLovableEmail } = await import("@lovable.dev/email-js");
  const html = `
    <div style="font-family:sans-serif;max-width:440px;margin:auto;text-align:center">
      <h2 style="margin:0 0 8px">Tu código de copia de seguridad</h2>
      <p style="color:#555;margin:0 0 16px">Escríbelo en el panel para generar la copia. Vence en 15 minutos.</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0">${code}</p>
      <p style="color:#888;font-size:12px;margin-top:20px">ORÍGEN — tuorigen.app</p>
    </div>`;

  try {
    await sendLovableEmail(
      {
        to: email,
        from: "ORÍGEN <noreply@notify.tuorigen.app>",
        sender_domain: "notify.tuorigen.app",
        subject: "Código para tu copia de seguridad",
        html,
        text: `Tu código de copia de seguridad es ${code}. Vence en 15 minutos.`,
        purpose: "transactional",
      },
      { apiKey },
    );
    return { sent: true, unconfigured: false as const };
  } catch {
    return { sent: false, unconfigured: false as const };
  }
}

/** Verifica el código y arma la copia del contenido (sin datos personales). */
export async function confirmBackupCode(userId: string, code: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: row } = await supabaseAdmin
    .from("admin_backup_codes")
    .select("id, code_hash, expires_at, consumed_at, attempts, email")
    .eq("requested_by", userId)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) throw new Error("No hay ninguna copia pendiente. Pídela de nuevo.");
  if (new Date(row.expires_at) < new Date()) throw new Error("El código venció. Pide uno nuevo.");
  if ((row.attempts ?? 0) >= 5) throw new Error("Demasiados intentos. Pide un código nuevo.");

  if (row.code_hash !== hashCode(code)) {
    await supabaseAdmin
      .from("admin_backup_codes")
      .update({ attempts: (row.attempts ?? 0) + 1 })
      .eq("id", row.id);
    throw new Error("El código no coincide. Revísalo e intenta otra vez.");
  }

  const [books, cats, audios, stages, exercises, devos, quizzes, profiles, subs] = await Promise.all([
    supabaseAdmin.from("library_items").select("*"),
    supabaseAdmin.from("manifest_categories").select("*"),
    supabaseAdmin.from("manifest_audios").select("*"),
    supabaseAdmin.from("stages").select("*"),
    supabaseAdmin.from("exercises").select("*"),
    supabaseAdmin.from("daily_devotionals").select("*"),
    supabaseAdmin.from("daily_quizzes").select("*"),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }),
  ]);

  const backup = {
    generated_at: new Date().toISOString(),
    app: "ORÍGEN",
    resumen: {
      usuarios: profiles.count ?? 0,
      suscripciones: subs.count ?? 0,
    },
    contenido: {
      library_items: books.data ?? [],
      manifest_categories: cats.data ?? [],
      manifest_audios: audios.data ?? [],
      stages: stages.data ?? [],
      exercises: exercises.data ?? [],
      daily_devotionals: devos.data ?? [],
      daily_quizzes: quizzes.data ?? [],
    },
  };

  const json = JSON.stringify(backup);
  await supabaseAdmin.from("admin_backup_codes").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);
  await supabaseAdmin.from("admin_backups").insert({
    requested_by: userId,
    email: row.email,
    size_bytes: json.length,
    status: "success",
  });

  return { json, sizeBytes: json.length };
}
