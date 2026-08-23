import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Límites de recompensa por etapa (validados en el servidor). */
const MAX_STAGE_XP = 120;
const MAX_STAGE_LEAVES = 100;

/** Guarda la recompensa de una etapa con topes validados en el servidor. */
export const saveStageReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        stageId: z.number().int().min(1).max(200),
        xp: z.number().int().min(0).max(MAX_STAGE_XP),
        leaves: z.number().int().min(0).max(MAX_STAGE_LEAVES),
        insignia: z.string().trim().min(1).max(80),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // La etapa debe estar realmente completada por este usuario.
    const { data: progress } = await supabaseAdmin
      .from("stage_progress")
      .select("status")
      .eq("user_id", context.userId)
      .eq("stage_id", data.stageId)
      .maybeSingle();

    const { error } = await supabaseAdmin.from("stage_rewards").upsert(
      {
        user_id: context.userId,
        stage_id: data.stageId,
        xp: Math.min(data.xp, MAX_STAGE_XP),
        leaves: Math.min(data.leaves, MAX_STAGE_LEAVES),
        insignia: data.insignia,
      },
      { onConflict: "user_id,stage_id" },
    );
    if (error) return { ok: false as const, reason: error.message };
    return { ok: true as const, completed: progress?.status === "completed" };
  });

/** Crea una transferencia de hojas: el servidor valida el saldo y descuenta. */
export const createHojaTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        toEmail: z.string().trim().toLowerCase().email().max(160),
        hojas: z.number().int().min(1).max(500),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("create_hoja_transfer", {
      _to_email: data.toEmail,
      _hojas: data.hojas,
    });
    if (error) {
      const map: Record<string, string> = {
        "insufficient balance": "No tienes suficiente saldo disponible",
        "cannot transfer to self": "No puedes transferirte hojas a ti mismo",
        "invalid email": "Ingresa un correo válido",
        "invalid amount": "Elige una cantidad válida de hojas",
      };
      const key = Object.keys(map).find((k) => error.message.includes(k));
      return { ok: false as const, message: key ? map[key] : "No pudimos enviar la transferencia" };
    }
    return { ok: true as const };
  });
