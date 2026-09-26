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

const COVER_STYLE =
  "Ilustración espiritual cálida y luminosa, estilo pintura digital suave, tonos lavanda, durazno y dorado, sin texto, sin letras, sin marcas de agua, composición centrada, atmósfera de paz y esperanza.";

/* ───────── 1 · Tema principal de Visualízate ───────── */

export const adminCreateVisualizaCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        title: z.string().trim().min(3).max(120),
        groupKey: z.string().trim().min(2).max(60).default("abundancia"),
        programGroup: z.string().trim().min(2).max(60).default("visualiza"),
        requiredPlan: z.enum(["free", "camino"]).default("camino"),
        notes: z.string().trim().max(1200).default(""),
        withCover: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson, uploadCover } = await import("@/lib/ai-content.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const generated = await aiJson<{
      subtitle: string;
      description: string;
      affirmation_ya_tengo: string;
      identity_yo_soy: string;
      gratitude_gracias: string;
      petition: string;
      cover_prompt: string;
    }>(
      `Crea un tema principal de visualización y manifestación llamado "${data.title}". Notas del editor: ${data.notes || "sin notas"}.
Devuelve JSON con: subtitle (máx 70 caracteres), description (2 a 3 frases, máx 320 caracteres), affirmation_ya_tengo (frase en presente que empieza con "Ya tengo"), identity_yo_soy (frase que empieza con "Yo soy"), gratitude_gracias (frase que empieza con "Gracias"), petition (una oración breve de petición) y cover_prompt (descripción visual en inglés de una ilustración, sin texto).`,
    );

    const slug = slugify(data.title) || `tema-${Date.now()}`;
    const id = `${slug}-${Date.now().toString(36)}`;

    const cover = data.withCover
      ? await uploadCover(`${generated.cover_prompt}. ${COVER_STYLE}`, slug)
      : null;

    const { data: last } = await supabaseAdmin
      .from("manifest_categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabaseAdmin.from("manifest_categories").insert({
      id,
      title: data.title,
      subtitle: generated.subtitle,
      description: generated.description,
      affirmation_ya_tengo: generated.affirmation_ya_tengo,
      identity_yo_soy: generated.identity_yo_soy,
      gratitude_gracias: generated.gratitude_gracias,
      petition: generated.petition,
      group_key: data.groupKey,
      program_group: data.programGroup,
      required_plan: data.requiredPlan,
      cover_url: cover,
      sort_order: (last?.sort_order ?? 0) + 1,
      is_published: false,
    });
    if (error) throw new Error(error.message);
    return { id, cover: Boolean(cover) };
  });

/* ───────── 2 · Subtema dentro de un tema principal ───────── */

export const adminCreateVisualizaSubtopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        categoryId: z.string().min(1),
        title: z.string().trim().min(3).max(140),
        notes: z.string().trim().max(1200).default(""),
        withCover: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson, uploadCover } = await import("@/lib/ai-content.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: category } = await supabaseAdmin
      .from("manifest_categories")
      .select("id, title, description")
      .eq("id", data.categoryId)
      .maybeSingle();
    if (!category) throw new Error("Ese tema principal ya no existe.");

    const { data: days } = await supabaseAdmin
      .from("manifest_audios")
      .select("day_index")
      .eq("category_id", data.categoryId)
      .order("day_index", { ascending: false })
      .limit(1);
    const dayIndex = (days?.[0]?.day_index ?? 0) + 1;

    const generated = await aiJson<{
      affirmation: string;
      lesson: string;
      exercise: string;
      recipe_steps: string[];
      tasks: string[];
      search_words: string[];
      quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[];
      cover_prompt: string;
    }>(
      `Tema principal: "${category.title}" (${category.description ?? "sin descripción"}). Crea el subtema número ${dayIndex} titulado "${data.title}". Notas del editor: ${data.notes || "sin notas"}.
Devuelve JSON con: affirmation (una frase poderosa en presente, máx 160 caracteres), lesson (lección práctica de 110 a 170 palabras), exercise (práctica concreta de 80 a 130 palabras), recipe_steps (array de 5 a 8 pasos cortos y seguros), tasks (array de 3 tareas del día, cada una máx 90 caracteres), search_words (array de 8 palabras en MAYÚSCULAS de 4 a 9 letras sin tildes ni espacios, relacionadas con el tema), quiz (array de 3 objetos con question, options de 3 opciones, correctIndex 0-2 y explanation breve) y cover_prompt (descripción visual en inglés, sin texto).`,
    );

    const cover = data.withCover
      ? await uploadCover(
          `${generated.cover_prompt}. ${COVER_STYLE}`,
          `${slugify(data.title) || "subtema"}-${dayIndex}`,
        )
      : null;

    const { data: inserted, error } = await supabaseAdmin
      .from("manifest_audios")
      .insert({
        category_id: data.categoryId,
        day_index: dayIndex,
        title: data.title,
        affirmation: generated.affirmation,
        lesson: generated.lesson,
        exercise: `${generated.exercise}\n\nPasos:\n${(generated.recipe_steps ?? [])
          .map((s, i) => `${i + 1}. ${s}`)
          .join("\n")}`,
        cover_url: cover,
        quiz: {
          tasks: generated.tasks ?? [],
          questions: generated.quiz ?? [],
        } as never,
        word_game: { words: generated.search_words ?? [] } as never,
        is_published: false,
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { id: inserted?.id ?? null, dayIndex, cover: Boolean(cover) };
  });

/** Guarda el audio y los detalles que sube el editor en un subtema. */
export const adminUpdateSubtopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        audioUrl: z.string().trim().max(600).optional(),
        pdfUrl: z.string().trim().max(600).optional(),
        lesson: z.string().trim().max(6000).optional(),
        exercise: z.string().trim().max(6000).optional(),
        affirmation: z.string().trim().max(400).optional(),
        isPublished: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.audioUrl !== undefined) patch["audio_url"] = data.audioUrl || null;
    if (data.pdfUrl !== undefined) patch["pdf_url"] = data.pdfUrl || null;
    if (data.lesson !== undefined) patch["lesson"] = data.lesson;
    if (data.exercise !== undefined) patch["exercise"] = data.exercise;
    if (data.affirmation !== undefined) patch["affirmation"] = data.affirmation;
    if (data.isPublished !== undefined) patch["is_published"] = data.isPublished;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabaseAdmin.from("manifest_audios").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ───────── 3 · Limpieza espiritual ───────── */

export const adminListLimpieza = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("limpieza_practices")
      .select("id, slug, title, duration, level, cover_url, is_published, sort_order")
      .order("sort_order");
    return data ?? [];
  });

export const adminCreateLimpieza = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        title: z.string().trim().min(3).max(120),
        level: z.number().int().min(1).max(3).default(1),
        notes: z.string().trim().max(1200).default(""),
        withCover: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson, uploadCover } = await import("@/lib/ai-content.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const generated = await aiJson<{
      duration: string;
      objective: string;
      info: string[];
      materials: string[];
      steps: string[];
      scripture: string;
      scripture_ref: string;
      cover_prompt: string;
    }>(
      `Crea una práctica de limpieza espiritual cristiana llamada "${data.title}", nivel ${data.level} de 3. Notas del editor: ${data.notes || "sin notas"}.
Devuelve JSON con: duration (por ejemplo "20 min"), objective (1 o 2 frases), info (array de 4 avisos útiles y seguros), materials (array de 4 a 7 materiales sencillos y sin riesgo, usa vela LED en vez de fuego), steps (array de 6 a 8 pasos claros en orden), scripture (un versículo bíblico real y textual), scripture_ref (su referencia exacta) y cover_prompt (descripción visual en inglés, sin texto ni personas reconocibles).
No incluyas rituales peligrosos, sustancias, ni promesas de curación física.`,
    );

    const slug = `${slugify(data.title) || "practica"}-${Date.now().toString(36)}`;
    const cover = data.withCover
      ? await uploadCover(`${generated.cover_prompt}. ${COVER_STYLE}`, slug)
      : null;

    const { data: last } = await supabaseAdmin
      .from("limpieza_practices")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabaseAdmin.from("limpieza_practices").insert({
      slug,
      title: data.title,
      duration: generated.duration || "20 min",
      level: data.level,
      objective: generated.objective ?? "",
      info: (generated.info ?? []) as never,
      materials: (generated.materials ?? []) as never,
      steps: (generated.steps ?? []) as never,
      scripture: generated.scripture ?? null,
      scripture_ref: generated.scripture_ref ?? null,
      cover_url: cover,
      sort_order: (last?.sort_order ?? 0) + 1,
      is_published: true,
    });
    if (error) throw new Error(error.message);
    return { slug, cover: Boolean(cover) };
  });

export const adminToggleLimpieza = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), isPublished: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("limpieza_practices")
      .update({ is_published: data.isPublished })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
