import { createFileRoute } from "@tanstack/react-router";
import { brainContext } from "@/lib/brain.server";

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
        const body = (await request.json()) as Body;
        if (!body.slug) return new Response(JSON.stringify({ error: "Falta la consulta" }), { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
              response_format: { type: "json_object" },
            }),
          });
          if (!r.ok) {
            return new Response(
              JSON.stringify({
                error:
                  r.status === 402
                    ? "Servicio temporalmente ocupado. Intenta más tarde."
                    : r.status === 429
                      ? "Muchas personas están pidiendo respuesta ahora. Intenta en un momento."
                      : "No pudimos preparar tu respuesta ahora.",
              }),
              { status: r.status },
            );
          }
          const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
          const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
          return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
        }
      },
    },
  },
});
