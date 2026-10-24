import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

/** Crea una consulta nueva: la IA arma el texto, las secciones y el estilo de respuesta. */
export const adminCreateConsulta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        title: z.string().trim().min(3).max(120),
        notes: z.string().trim().max(1500).default(""),
        costHojas: z.number().int().min(0).max(20).default(1),
        withCover: z.boolean().default(true),
        existingId: z.string().uuid().optional(),
        design: z.enum(["patrones", "ministracion"]).default("patrones"),
        questionRequired: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson, uploadCover } = await import("@/lib/ai-content.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const generated = await aiJson<{
      subtitle: string;
      intro: string;
      sections: { key: string; label: string; hint: string }[];
      system_prompt: string;
      cover_prompt: string;
    }>(
      `Diseña una sección de respuestas personalizadas para la plataforma ORÍGEN (sanación emocional, patrones familiares y fe, español latinoamericano).
Título: "${data.title}". Notas de la dueña del producto: ${data.notes || "sin notas"}.
Inspírate SOLO en la estructura visual de ${data.design === "patrones" ? "Patrones generacionales: observación, patrones, reflexión y recomendaciones" : "Dios te dice hoy: palabra, reflexión, señales y pasos de cierre"}. La página tiene inicio, presentación con formulario y resultados con PDF e impresión. Todos los textos son originales sobre este título; no copies contenido de otras secciones.

La persona SIEMPRE entrega: nombre completo, fecha de nacimiento y lo que quiere saber.
Prohibido usar las palabras "consultar" o "canalizar" en cualquier texto visible; se dice "ver respuesta", "lo que dice tu historia", etc.

Devuelve JSON con:
- subtitle: máximo 70 caracteres.
- intro: 2 o 3 frases cálidas que expliquen qué va a recibir.
- sections: entre 4 y 6 bloques de la respuesta; cada uno con key (en inglés, minúsculas, sin espacios), label (título visible en español) y hint (qué debe contener, en español, 1 frase).
- system_prompt: instrucciones completas en español para la IA que redacta la respuesta, con el tono de ORÍGEN, sin misticismo, sin diagnósticos médicos y sin promesas absolutas.
- cover_prompt: descripción visual en inglés de un banner horizontal 21:9 estilo app cristiana premium: fondo degradado cálido crema-rosa, a la izquierda una etiqueta pequeña en mayúsculas color coral, el TÍTULO de la sección en español grande y legible en oscuro, un subtítulo gris de una línea y un botón píldora coral con texto blanco "Abrir consulta →"; a la derecha una foto hiperrealista, cristiana y decorosa (vestimenta modesta, luz dorada, sin símbolos esotéricos) relacionada con el tema.`,
    );

    let coverUrl: string | null = null;
    if (data.withCover && generated.cover_prompt) {
      try {
        coverUrl = await uploadCover(generated.cover_prompt, `consulta-${slugify(data.title)}`);
      } catch {
        coverUrl = null;
      }
    }

    const baseSlug = slugify(data.title) || "consulta";
    const { data: takenRows } = await supabaseAdmin.from("custom_consultas").select("slug").like("slug", `${baseSlug}%`);
    const taken = new Set((takenRows ?? []).map((r) => r.slug));
    let slug = baseSlug;
    for (let n = 2; taken.has(slug); n += 1) slug = `${baseSlug}-${n}`;
    const sections = (generated.sections ?? [])
      .filter((s) => s?.key && s?.label)
      .slice(0, 6)
      .map((s) => ({ key: slugify(s.key).replace(/-/g, "_") || "bloque", label: s.label, hint: s.hint ?? s.label }));

    const payload = {
        slug,
        title: data.title,
        subtitle: generated.subtitle ?? null,
        notes: data.notes || null,
        cover_url: coverUrl,
        intro: generated.intro ?? null,
        sections,
        system_prompt: generated.system_prompt ?? "",
        cost_hojas: data.costHojas,
        is_published: true,
      };
    const qr = { question_required: data.questionRequired } as Record<string, unknown>;
    const query = data.existingId
      ? supabaseAdmin.from("custom_consultas").update({ subtitle: payload.subtitle, notes: payload.notes, cover_url: payload.cover_url, intro: payload.intro, sections: payload.sections, system_prompt: payload.system_prompt, ...qr }).eq("id", data.existingId)
      : supabaseAdmin.from("custom_consultas").insert({ ...payload, ...qr });
    const { data: row, error } = await query.select("id, slug, title").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminToggleConsulta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), isPublished: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("custom_consultas")
      .update({ is_published: data.isPublished })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteConsulta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("custom_consultas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
