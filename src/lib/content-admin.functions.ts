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

/** Nombre limpio y único para la dirección (sin códigos raros): tema, tema-2, tema-3… */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uniqueSlug(db: any, table: string, column: string, base: string) {
  const clean = base || "tema";
  const { data } = await db.from(table).select(column).like(column, `${clean}%`);
  const taken = new Set(((data ?? []) as Record<string, string>[]).map((r) => r[column]));
  if (!taken.has(clean)) return clean;
  let n = 2;
  while (taken.has(`${clean}-${n}`)) n += 1;
  return `${clean}-${n}`;
}

const COVER_STYLE =
  "Fotografía hiperrealista editorial profesional para ORÍGEN, aplicación cristiana. Personas con anatomía natural, vestimenta modesta, brazos y hombros cubiertos; sin joyas, collares ni crucifijos. Escena clara de oración, reflexión bíblica o familia según el tema, color vivo, composición profesional. Nunca simbolismo esotérico, chakras, cristales, rituales, sensualidad, auras ni fantasía espiritual. Sin texto, letras ni marcas de agua; el título se muestra en la interfaz.";


/* ───────── Diseño propio de cada tema (inspirado en la estructura, nunca copiado) ───────── */
export type TopicPage = {
  hero_title?: string; hero_text?: string; includes?: string[]; verse?: string; verse_ref?: string; cta?: string;
  step2_title?: string; step2_text?: string; step2_hint?: string; step2_note?: string;
  step3_text?: string; playlist_title?: string; playlist_text?: string;
  accent?: string; cover_step1?: string | null; cover_step2?: string | null; cover_step3?: string | null;
  cover_home?: string | null; cover_playlist?: string | null;
};

async function buildTopicPage(title: string, notes: string, design: "musica" | "audio" | "limpieza", slug: string): Promise<TopicPage> {
  const { aiJson, uploadCover } = await import("@/lib/ai-content.server");
  const { brainContext } = await import("@/lib/brain.server");
  notes = `${notes}\n${await brainContext("visualiza", slug)}`;
  const structure =
    design === "musica"
      ? "un programa en 3 pasos: Paso 1 Bienvenida (portada, título con gancho, texto breve, lista 'Este programa incluye' de 6 puntos, versículo y botón), Paso 2 Elige un área (pregunta, texto, pista de cómo elegir, nota amable) y Paso 3 Tu lección (texto corto de bienvenida a la lección)"
      : design === "audio"
        ? "una página principal de audios (título, texto, versículo, botón) y una sección de playlists (título y texto)"
        : "una página de recetas o prácticas guiadas con instrucciones paso a paso (título, texto, lista de 6 cosas que incluye, versículo y botón)";
  const page = await aiJson<TopicPage & { cover_prompts: string[] }>(
    `Vas a escribir TODO el contenido NUEVO de un tema de la app ORÍGEN llamado "${title}". Notas del editor: ${notes || "sin notas"}.
Solo se reutiliza la ESTRUCTURA visual de ${structure}. Está PROHIBIDO copiar textos, títulos o frases de otros temas (como "Manifestar con Música", "Sanar al niño interior" o "Limpieza espiritual"): todo debe hablar únicamente de "${title}".
Devuelve JSON con: hero_title (máx 50 caracteres), hero_text (máx 200), includes (array de 6 frases cortas, máx 45 caracteres cada una), verse (versículo bíblico real relacionado), verse_ref, cta (texto del botón, máx 28), step2_title (pregunta, máx 50), step2_text (máx 140), step2_hint (máx 80), step2_note (máx 120), step3_text (máx 120), playlist_title (máx 40), playlist_text (máx 120), accent (color hex suave que represente el tema, distinto de #7C5CFF) y cover_prompts (array de 3 descripciones visuales DIFERENTES en inglés, sin texto: 1) portada principal, 2) portada para elegir área o playlists, 3) portada de la lección).`,
  );
  const prompts = (page.cover_prompts ?? []).slice(0, 3);
  const covers: (string | null)[] = [];
  for (const [i, cp] of prompts.entries()) covers.push(await uploadCover(`${cp}. ${COVER_STYLE}`, `${slug}-paso-${i + 1}`));
  const { cover_prompts: _c, ...rest } = page;
  return design === "audio"
    ? { ...rest, cover_home: covers[0] ?? null, cover_playlist: covers[1] ?? null, cover_step3: covers[2] ?? null }
    : { ...rest, cover_step1: covers[0] ?? null, cover_step2: covers[1] ?? null, cover_step3: covers[2] ?? null };
}

/** Rehace el diseño propio de un tema ya creado (textos y portadas nuevas). */
export const adminRebuildTopicDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().min(1), design: z.enum(["musica", "audio", "limpieza"]).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cat } = await supabaseAdmin.from("manifest_categories").select("id, title, description, design").eq("id", data.id).maybeSingle();
    if (!cat) throw new Error("Ese tema ya no existe.");
    const design = (data.design ?? (cat as { design?: string }).design ?? "musica") as "musica" | "audio" | "limpieza";
    const page = await buildTopicPage(cat.title, cat.description ?? "", design, slugify(cat.title) || "tema");
    const { error } = await supabaseAdmin.from("manifest_categories").update({ page, design, audio_only: design === "audio", cover_url: page.cover_step1 ?? page.cover_home ?? undefined } as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

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
        audioOnly: z.boolean().default(false),
        design: z.enum(["musica", "audio", "limpieza"]).optional(),
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

    const slug = slugify(data.title) || "tema";
    const id = await uniqueSlug(supabaseAdmin, "manifest_categories", "id", slug);

    const cover = data.withCover
      ? await uploadCover(`${generated.cover_prompt}. ${COVER_STYLE}`, slug)
      : null;

    const { data: last } = await supabaseAdmin
      .from("manifest_categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const design = data.design ?? (data.audioOnly ? "audio" : "musica");
    const page = await buildTopicPage(data.title, data.notes, design, slug);
    const { error } = await supabaseAdmin.from("manifest_categories").insert({
      id,
      page,
      title: data.title,
      subtitle: generated.subtitle,
      description: generated.description,
      affirmation_ya_tengo: generated.affirmation_ya_tengo || `Ya tengo espacio para trabajar ${data.title.toLowerCase()}.`,
      identity_yo_soy: generated.identity_yo_soy || "Yo soy una persona capaz de avanzar con calma.",
      gratitude_gracias: generated.gratitude_gracias || "Gracias por cada paso de mi proceso.",
      petition: generated.petition || "Guíame para avanzar con paz y claridad.",
      group_key: data.groupKey,
      program_group: data.programGroup,
      required_plan: data.requiredPlan,
      cover_url: page.cover_step1 ?? page.cover_home ?? cover,
      sort_order: (last?.sort_order ?? 0) + 1,
      is_published: false,
      is_custom: true,
      audio_only: data.design ? data.design === "audio" : data.audioOnly,
      design,
    } as never);
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
        audioOnly: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson, uploadCover } = await import("@/lib/ai-content.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: category } = await supabaseAdmin
      .from("manifest_categories")
      .select("id, title, description, audio_only, design")
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

    const isRecipe = (category as { design?: string }).design === "limpieza";
    const generated = await aiJson<{
      materials?: string[];
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
Devuelve JSON con: affirmation (una frase poderosa en presente, máx 160 caracteres), lesson (lección práctica de 110 a 170 palabras), exercise (práctica concreta de 80 a 130 palabras), recipe_steps (array de 5 a 8 pasos cortos y seguros), tasks (array de 3 tareas del día, cada una máx 90 caracteres), search_words (array de 8 palabras en MAYÚSCULAS de 4 a 9 letras sin tildes ni espacios, relacionadas con el tema), quiz (array de 3 objetos con question, options de 3 opciones, correctIndex 0-2 y explanation breve) y cover_prompt (descripción visual en inglés, sin texto).${isRecipe ? " Es una receta o práctica con instrucciones: agrega también materials (array de 4 a 8 materiales o ingredientes sencillos y seguros) y haz que recipe_steps sean instrucciones claras en orden." : ""}`,
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
          materials: isRecipe ? generated.materials ?? [] : undefined,
          steps: isRecipe ? generated.recipe_steps ?? [] : undefined,
        } as never,
        word_game: { words: generated.search_words ?? [] } as never,
        is_published: true,
        audio_only: data.audioOnly ?? Boolean((category as { audio_only?: boolean }).audio_only),
      } as never)
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
        audioUrl: z.string().trim().max(8000).optional(),
        pdfUrl: z.string().trim().max(2000).optional(),
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

    const slug = await uniqueSlug(supabaseAdmin, "limpieza_practices", "slug", slugify(data.title) || "practica");
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

/* ───────── Gestión: editar, ocultar, copiar diseño, borrar ───────── */

const idSchema = z.object({ id: z.string().min(1) });

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [cats, subs] = await Promise.all([
      supabaseAdmin
        .from("manifest_categories")
        .select("id, title, subtitle, group_key, required_plan, cover_url, is_published, sort_order")
        .order("sort_order"),
      supabaseAdmin.from("manifest_audios").select("category_id"),
    ]);
    const count = new Map<string, number>();
    for (const s of subs.data ?? []) count.set(s.category_id, (count.get(s.category_id) ?? 0) + 1);
    return (cats.data ?? []).map((c) => ({ ...c, subtopics: count.get(c.id) ?? 0 }));
  });

export const adminUpdateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().min(1),
        title: z.string().trim().min(3).max(120).optional(),
        coverUrl: z.string().trim().max(1000).optional(),
        isPublished: z.boolean().optional(),
        regenerateCover: z.boolean().optional(),
        copyFromId: z.string().optional(),
        notes: z.string().trim().max(1200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.title) patch["title"] = data.title;
    if (data.coverUrl !== undefined) patch["cover_url"] = data.coverUrl || null;
    if (data.isPublished !== undefined) patch["is_published"] = data.isPublished;
    if (data.copyFromId) {
      const { data: src } = await supabaseAdmin
        .from("manifest_categories")
        .select("cover_url, group_key, program_group, required_plan")
        .eq("id", data.copyFromId)
        .maybeSingle();
      if (src) Object.assign(patch, src);
    }
    if (data.regenerateCover) {
      const { uploadCover } = await import("@/lib/ai-content.server");
      const { data: cur } = await supabaseAdmin
        .from("manifest_categories").select("title").eq("id", data.id).maybeSingle();
      const url = await uploadCover(
        `Professional Christian editorial photograph for "${data.title ?? cur?.title ?? ""}". ${data.notes ?? ""}. ${COVER_STYLE}`,
        slugify(data.title ?? cur?.title ?? "tema"),
      );
      if (!url) throw new Error("No pudimos generar la portada. Intenta de nuevo.");
      patch["cover_url"] = url;
    }
    if (typeof patch["cover_url"] === "string" && patch["cover_url"]) {
      const { data: current, error: pageError } = await supabaseAdmin.from("manifest_categories").select("page").eq("id", data.id).maybeSingle();
      if (pageError) throw new Error("No pudimos leer el diseño de la categoría. La portada no se cambió.");
      const page = current?.page && typeof current.page === "object" && !Array.isArray(current.page) ? current.page : {};
      patch["page"] = { ...page, cover_home: patch["cover_url"], cover_step1: patch["cover_url"], cover_step2: patch["cover_url"], cover_step3: patch["cover_url"], cover_playlist: patch["cover_url"] };
    }
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabaseAdmin.from("manifest_categories").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => idSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("manifest_audios").delete().eq("category_id", data.id);
    const { error } = await supabaseAdmin.from("manifest_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListSubtopics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ categoryId: z.string().min(1) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("manifest_audios")
      .select("id, day_index, title, audio_url, pdf_url, cover_url, is_published")
      .eq("category_id", data.categoryId)
      .order("day_index");
    return rows ?? [];
  });

export const adminDeleteSubtopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("manifest_audios").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** La IA vuelve a escribir todo el subtema (lección, pasos, juegos, afirmación). */
export const adminRegenerateSubtopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ id: z.string().uuid(), notes: z.string().trim().max(1200).default(""), cover: z.boolean().default(false) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson, uploadCover } = await import("@/lib/ai-content.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("manifest_audios").select("id, title, category_id, day_index").eq("id", data.id).maybeSingle();
    if (!sub) throw new Error("Ese subtema ya no existe.");
    const { data: cat } = await supabaseAdmin
      .from("manifest_categories").select("title, description").eq("id", sub.category_id).maybeSingle();
    const g = await aiJson<{
      affirmation: string; lesson: string; exercise: string; recipe_steps: string[]; tasks: string[];
      search_words: string[]; quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[];
      cover_prompt: string;
    }>(
      `Tema principal: "${cat?.title ?? ""}" (${cat?.description ?? ""}). Reescribe completo el subtema "${sub.title}". Notas del editor: ${data.notes || "sin notas"}.
Devuelve JSON con: affirmation (máx 160 caracteres), lesson (110-170 palabras), exercise (80-130 palabras), recipe_steps (5-8 pasos), tasks (3 tareas máx 90 caracteres), search_words (8 palabras MAYÚSCULAS 4-9 letras sin tildes), quiz (3 objetos question, options de 3, correctIndex 0-2, explanation) y cover_prompt (inglés, sin texto).`,
    );
    const patch: Record<string, unknown> = {
      affirmation: g.affirmation,
      lesson: g.lesson,
      exercise: `${g.exercise}\n\nPasos:\n${(g.recipe_steps ?? []).map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
      quiz: { tasks: g.tasks ?? [], questions: g.quiz ?? [] },
      word_game: { words: g.search_words ?? [] },
    };
    if (data.cover) {
      const url = await uploadCover(`${g.cover_prompt}. ${COVER_STYLE}`, `${slugify(sub.title)}-${sub.day_index}`);
      if (url) patch["cover_url"] = url;
    }
    const { error } = await supabaseAdmin.from("manifest_audios").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateLimpieza = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().trim().min(3).max(120).optional(),
      coverUrl: z.string().trim().max(1000).optional(),
      regenerateCover: z.boolean().optional(),
      improve: z.boolean().optional(),
      notes: z.string().trim().max(1200).default(""),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { aiJson, uploadCover } = await import("@/lib/ai-content.server");
    const { data: cur } = await supabaseAdmin
      .from("limpieza_practices").select("title, level, slug").eq("id", data.id).maybeSingle();
    if (!cur) throw new Error("Esa práctica ya no existe.");
    const title = data.title ?? cur.title;
    const patch: Record<string, unknown> = {};
    if (data.title) patch["title"] = data.title;
    if (data.coverUrl !== undefined) patch["cover_url"] = data.coverUrl || null;
    if (data.improve) {
      const g = await aiJson<{ duration: string; objective: string; info: string[]; materials: string[]; steps: string[]; scripture: string; scripture_ref: string }>(
        `Mejora y reescribe la práctica de limpieza espiritual cristiana "${title}", nivel ${cur.level}. Notas: ${data.notes || "sin notas"}.
JSON: duration, objective, info (4 avisos), materials (4-7 seguros, vela LED), steps (6-8), scripture (versículo real textual), scripture_ref. Sin rituales peligrosos ni promesas médicas.`,
      );
      Object.assign(patch, {
        duration: g.duration, objective: g.objective, info: g.info, materials: g.materials,
        steps: g.steps, scripture: g.scripture, scripture_ref: g.scripture_ref,
      });
    }
    if (data.regenerateCover) {
      const url = await uploadCover(`Serene spiritual cleansing scene for "${title}". ${data.notes}. ${COVER_STYLE}`, cur.slug);
      if (!url) throw new Error("No pudimos generar la portada. Intenta de nuevo.");
      patch["cover_url"] = url;
    }
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabaseAdmin.from("limpieza_practices").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteLimpieza = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("limpieza_practices").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ───────── Portadas por URL y visibilidad de caminos, categorías y juegos ───────── */

export const adminSetOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      key: z.string().min(1).max(120),
      scope: z.enum(["camino", "categoria", "juego", "explorar"]),
      title: z.string().trim().max(120).optional(),
      coverUrl: z.string().trim().max(1000).optional(),
      isHidden: z.boolean().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cur } = await supabaseAdmin.from("content_overrides").select("*").eq("key", data.key).maybeSingle();
    const row = {
      key: data.key,
      scope: data.scope,
      title: data.title !== undefined ? data.title || null : cur?.title ?? null,
      cover_url: data.coverUrl !== undefined ? data.coverUrl || null : cur?.cover_url ?? null,
      is_hidden: data.isHidden ?? cur?.is_hidden ?? false,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from("content_overrides").upsert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ───────── Caminos nuevos creados con IA ───────── */

export const adminListCaminos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("custom_caminos").select("id, slug, title, subtitle, cover_url, is_published, content, created_at").order("sort_order");
    return data ?? [];
  });

export const adminCreateCamino = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      title: z.string().trim().min(3).max(120),
      notes: z.string().trim().max(1500).default(""),
      coverUrl: z.string().trim().max(1000).default(""),
      existingId: z.string().uuid().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson, uploadCover } = await import("@/lib/ai-content.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Mismo formato que CAMINO ORÍGEN: 8 etapas diarias; cada día se vive en 20 pasos
    // (lección, soluciones, tareas, juegos y recompensa) que la app arma al abrirlo.
    const g = await aiJson<{
      subtitle: string; short: string; claim: string; cover_prompt: string;
      scripture: { text: string; ref: string };
      etapas: { title: string; focus: string; insignia: string }[];
    }>(
      `Diseña un camino de sanación emocional con fe llamado "${data.title}" con el mismo formato de CAMINO ORÍGEN. Notas del editor: ${data.notes || "sin notas"}.
JSON: subtitle (máx 80 caracteres), short (máx 32, frase corta del tema), claim (1 frase de máx 110 caracteres que nombre la transformación), scripture { text (versículo bíblico real y textual, máx 90 caracteres), ref (referencia exacta) }, etapas: EXACTAMENTE 8 objetos en orden progresivo { title (máx 38 caracteres), focus (2 a 3 palabras del enfoque emocional del día), insignia (2 a 3 palabras de logro) }, cover_prompt (descripción visual en inglés de una portada SIN texto, sin letras, sin personas reconocibles).
Todo debe ser original y hablar solo de "${data.title}".`,
    );
    const etapas = (g.etapas ?? []).slice(0, 8).filter((e) => e?.title);
    if (etapas.length !== 8) throw new Error("La IA no devolvió las 8 etapas del camino. No se guardó nada; intenta otra vez.");
    const content = {
      short: g.short, claim: g.claim, scripture: g.scripture,
      etapas: etapas.map((e, i) => ({ day: i + 1, title: e.title, focus: e.focus || data.title, insignia: e.insignia || `Etapa ${i + 1}` })),
    };
    const slug = data.existingId
      ? undefined
      : await uniqueSlug(supabaseAdmin, "custom_caminos", "slug", slugify(data.title) || "camino");
    const cover = data.coverUrl || (await uploadCover(`${g.cover_prompt}. ${COVER_STYLE}`, slug ?? (slugify(data.title) || "camino")));
    const { error } = data.existingId
      ? await supabaseAdmin.from("custom_caminos").update({ title: data.title, subtitle: g.subtitle, notes: data.notes, cover_url: cover, content: content as never }).eq("id", data.existingId)
      : await supabaseAdmin.from("custom_caminos").insert({ slug: slug!, title: data.title, subtitle: g.subtitle, notes: data.notes, cover_url: cover, content: content as never, is_published: false });
    if (error) throw new Error(error.message);
    return { slug };
  });

export const adminUpdateCamino = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().trim().min(3).max(120).optional(),
      coverUrl: z.string().trim().max(1000).optional(),
      isPublished: z.boolean().optional(),
      remove: z.boolean().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.remove) {
      const { error } = await supabaseAdmin.from("custom_caminos").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title) patch["title"] = data.title;
    if (data.coverUrl !== undefined) patch["cover_url"] = data.coverUrl || null;
    if (data.isPublished !== undefined) patch["is_published"] = data.isPublished;
    const { error } = await supabaseAdmin.from("custom_caminos").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ───────── Usuarios: sumar/quitar hojas y borrar en lote ───────── */

export const adminAdjustHojas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ userIds: z.array(z.string().uuid()).min(1).max(500), hojas: z.number().int().min(-100000).max(100000) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const points = data.hojas * 100;
    const { data: rows } = await supabaseAdmin.from("profiles").select("id, gems").in("id", data.userIds);
    for (const r of rows ?? []) {
      const next = Math.max(0, (r.gems ?? 0) + points);
      await supabaseAdmin.from("profiles").update({ gems: next }).eq("id", r.id);
      await supabaseAdmin.from("gem_transactions").insert({
        user_id: r.id, amount: next - (r.gems ?? 0), reason: "ajuste:admin", meta: { hojas: data.hojas } as never,
      });
      await supabaseAdmin.from("origen_notifications").insert({
        user_id: r.id, kind: "sistema",
        title: data.hojas >= 0 ? `Recibiste ${data.hojas} hojas de sanación` : `Se ajustó tu saldo de hojas`,
        body: data.hojas >= 0 ? "El equipo de ORÍGEN sumó hojas a tu saldo." : `Se descontaron ${Math.abs(data.hojas)} hojas de tu saldo.`,
        link: "/arbol",
      });
    }
    return { updated: rows?.length ?? 0 };
  });

export const adminDeleteUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ userIds: z.array(z.string().uuid()).min(1).max(500) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let deleted = 0;
    for (const id of data.userIds) {
      if (id === context.userId) continue;
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (!error) deleted += 1;
    }
    return { deleted };
  });
