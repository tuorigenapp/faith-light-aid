import { createFileRoute } from "@tanstack/react-router";
import { engineSections, logAssistant } from "@/lib/origen-engine.server";
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
        const parsed = await engineSections({ scope: "consulta", scopeRef: consulta.slug, name: body.name, birthdate: body.birthdate, question: body.question, title: consulta.title }, sections);
        await logAssistant("consulta", auth.user.id, body.question, consulta.slug, consulta.title);
        return Response.json(parsed);
      },
    },
  },
});
