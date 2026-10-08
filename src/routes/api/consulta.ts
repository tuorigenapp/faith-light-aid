import { createFileRoute } from "@tanstack/react-router";
import { brainContext } from "@/lib/brain.server";
import { aiJson } from "@/lib/ai-content.server";
import { z } from "zod";

type Body = {
  slug?: string;
  name?: string;
  birthdate?: string;
  question?: string;
};

export const Route = createFileRoute("/api/consulta")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response(JSON.stringify({ error: "Servicio no disponible" }), { status: 500 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
        if (!token) return Response.json({ error: "Inicia sesión para ver tu respuesta." }, { status: 401 });
        const { data: auth } = await supabaseAdmin.auth.getUser(token);
        if (!auth.user) return Response.json({ error: "Tu sesión venció. Vuelve a entrar." }, { status: 401 });
        const parsedBody = z.object({ slug: z.string().min(1).max(100), name: z.string().trim().min(3).max(200), birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), question: z.string().trim().min(5).max(1000) }).safeParse(await request.json());
        if (!parsedBody.success) return Response.json({ error: "Revisa tu nombre, fecha y pregunta." }, { status: 400 });
        const body = parsedBody.data;
        if (!body.slug) return new Response(JSON.stringify({ error: "Falta la consulta" }), { status: 400 });

        const { data: consulta } = await supabaseAdmin
          .from("custom_consultas")
          .select("slug, title, system_prompt, sections, is_published")
          .eq("slug", body.slug)
          .maybeSingle();
        if (!consulta || !consulta.is_published) {
          return new Response(JSON.stringify({ error: "Esta sección ya no está disponible." }), { status: 404 });
        }

        const sections = (consulta.sections ?? []) as { key: string; label: string; hint?: string }[];
        const brain = await brainContext("consulta", consulta.slug);
        const shape = sections.map((s) => `  "${s.key}": "string — ${s.hint || s.label}"`).join(",\n");

        const sys = `${brain ? `${brain}\n\n` : ""}${consulta.system_prompt}

Reglas de ORÍGEN (obligatorias):
- Español latinoamericano, cálido, claro y profesional. Nunca uses las palabras "consultar" ni "canalizar".
- Nunca menciones libros, autores, documentos ni fuentes de información.
- Nunca des diagnósticos médicos ni promesas absolutas. Habla de posibles patrones y de pasos concretos.
- Responde SOLO con JSON válido, sin markdown, con este shape exacto:
{
${shape}
}`;

        const userMsg = `Nombre completo: ${body.name || "(no indicado)"}
Fecha de nacimiento: ${body.birthdate || "(no indicada)"}
Lo que quiere saber: ${body.question || "(sin pregunta)"}`;

        try {
          const parsed = await aiJson<Record<string, string>>(userMsg, sys);
          return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
        }
      },
    },
  },
});
