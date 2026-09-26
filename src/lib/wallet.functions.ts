import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const HOJA_POINTS = 100;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

async function notify(
  userId: string,
  kind: "compra" | "transferencia" | "sistema",
  title: string,
  body: string,
  link?: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("origen_notifications")
    .insert({ user_id: userId, kind, title, body, link: link ?? null });
}

/* ───────── Persona: pedir una compra con comprobante ───────── */

export const createPurchaseRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        packId: z.string().trim().min(1).max(30),
        hojas: z.number().int().min(1).max(20000),
        usd: z.number().min(0).max(100000),
        method: z.string().trim().min(2).max(40).default("transferencia"),
        receiptPath: z.string().trim().min(3).max(400),
        userMessage: z.string().trim().max(600).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("purchase_requests")
      .insert({
        user_id: context.userId,
        pack_id: data.packId,
        hojas: data.hojas,
        usd: data.usd,
        method: data.method,
        receipt_path: data.receiptPath,
        user_message: data.userMessage || null,
        status: "pendiente",
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    await notify(
      context.userId,
      "compra",
      "Recibimos tu comprobante",
      `Estamos revisando tu compra de ${data.hojas} hojas. Te avisamos aquí en cuanto quede lista.`,
      "/comprarmonedas",
    );
    return { id: row?.id ?? null };
  });

/** La persona pide revisión de una compra o transferencia rechazada. */
export const sendAppeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        kind: z.enum(["compra", "transferencia"]),
        id: z.string().uuid(),
        message: z.string().trim().min(5).max(800),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const table = data.kind === "compra" ? "purchase_requests" : "hoja_transfers";
    const { error } = await context.supabase
      .from(table)
      .update({ appeal_message: data.message })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ───────── Panel: revisar compras ───────── */

export const adminListWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [purchases, transfers] = await Promise.all([
      supabaseAdmin
        .from("purchase_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("hoja_transfers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    const ids = Array.from(
      new Set([
        ...(purchases.data ?? []).map((p) => p.user_id),
        ...(transfers.data ?? []).map((t) => t.user_id),
      ]),
    );
    const { data: people } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, email").in("id", ids)
      : { data: [] as { id: string; full_name: string | null; email: string | null }[] };

    const receipts: Record<string, string> = {};
    for (const p of purchases.data ?? []) {
      if (!p.receipt_path) continue;
      const signed = await supabaseAdmin.storage
        .from("payment-receipts")
        .createSignedUrl(p.receipt_path, 60 * 60);
      if (signed.data?.signedUrl) receipts[p.id] = signed.data.signedUrl;
    }

    return {
      purchases: purchases.data ?? [],
      transfers: transfers.data ?? [],
      people: people ?? [],
      receipts,
    };
  });

export const adminReviewPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["aprobada", "rechazada", "revision"]),
        message: z.string().trim().max(600).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("purchase_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Esa compra ya no existe.");
    if (row.status === "aprobada") throw new Error("Esa compra ya fue aprobada.");

    if (data.action === "aprobada") {
      const points = row.hojas * HOJA_POINTS;
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("gems")
        .eq("id", row.user_id)
        .maybeSingle();
      await supabaseAdmin
        .from("profiles")
        .update({ gems: (profile?.gems ?? 0) + points })
        .eq("id", row.user_id);
      await supabaseAdmin.from("gem_transactions").insert({
        user_id: row.user_id,
        amount: points,
        reason: `compra:${row.pack_id}`,
        meta: { kind: "compra", status: "aprobada", hojas: row.hojas, usd: row.usd, method: row.method },
      });
    }

    const { error } = await supabaseAdmin
      .from("purchase_requests")
      .update({
        status: data.action,
        admin_note: data.message || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const titles = {
      aprobada: "Tu compra fue aprobada",
      rechazada: "Tu compra no fue aprobada",
      revision: "Necesitamos revisar tu compra",
    } as const;
    const bodies = {
      aprobada: `Ya sumamos ${row.hojas} hojas a tu cuenta. ¡Disfrútalas!`,
      rechazada: data.message || "No pudimos confirmar tu pago. Puedes pedir una revisión.",
      revision: data.message || "Estamos revisando tu comprobante con más detalle.",
    } as const;
    await notify(row.user_id, "compra", titles[data.action], bodies[data.action], "/comprarmonedas");
    return { ok: true };
  });

export const adminReviewTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["aprobada", "rechazada", "revision"]),
        message: z.string().trim().max(600).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("hoja_transfers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Esa transferencia ya no existe.");
    if (row.status === "aprobada" || row.status === "rechazada")
      throw new Error("Esa transferencia ya fue resuelta.");

    const hojas = Math.round(row.points / HOJA_POINTS);

    if (data.action === "aprobada") {
      const { data: target } = await supabaseAdmin
        .from("profiles")
        .select("id, gems")
        .ilike("email", row.to_email)
        .maybeSingle();
      if (!target) throw new Error("Nadie en ORÍGEN usa ese correo todavía.");
      await supabaseAdmin
        .from("profiles")
        .update({ gems: (target.gems ?? 0) + row.points })
        .eq("id", target.id);
      await supabaseAdmin.from("gem_transactions").insert({
        user_id: target.id,
        amount: row.points,
        reason: `transfer-in:${row.id}`,
        meta: { kind: "transferencia", status: "aprobada", hojas },
      });
      await notify(
        target.id,
        "transferencia",
        "Recibiste hojas",
        `Alguien te envió ${hojas} hojas. Ya están en tu saldo.`,
        "/comprarmonedas",
      );
    }

    if (data.action === "rechazada") {
      const { data: sender } = await supabaseAdmin
        .from("profiles")
        .select("gems")
        .eq("id", row.user_id)
        .maybeSingle();
      await supabaseAdmin
        .from("profiles")
        .update({ gems: (sender?.gems ?? 0) + row.points })
        .eq("id", row.user_id);
      await supabaseAdmin.from("gem_transactions").insert({
        user_id: row.user_id,
        amount: row.points,
        reason: `transfer-refund:${row.id}`,
        meta: { kind: "transferencia", status: "rechazada", hojas },
      });
    }

    const { error } = await supabaseAdmin
      .from("hoja_transfers")
      .update({
        status: data.action,
        admin_note: data.message || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const titles = {
      aprobada: "Tu transferencia se completó",
      rechazada: "Devolvimos tus hojas",
      revision: "Estamos revisando tu transferencia",
    } as const;
    const bodies = {
      aprobada: `Enviamos ${hojas} hojas a ${row.to_email}.`,
      rechazada: data.message || `No pudimos completar el envío, así que te devolvimos las ${hojas} hojas.`,
      revision: data.message || "Necesitamos revisar este envío con más detalle.",
    } as const;
    await notify(row.user_id, "transferencia", titles[data.action], bodies[data.action], "/comprarmonedas");
    return { ok: true };
  });
