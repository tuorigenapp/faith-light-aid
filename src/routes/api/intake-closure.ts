import { createFileRoute } from "@tanstack/react-router";

type Body = { genealogy: Record<string, string>; childhood: Record<string, string> };

export const Route = createFileRoute("/api/intake-closure")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response(JSON.stringify({ error: "AI no disponible" }), { status: 500 });
        const body = (await request.json()) as Body;

        const sys = `Eres un consejero cristiano especializado en sanidad emocional, restauración y cierre de ciclos. Analizas respuestas del usuario sobre su árbol genealógico y su infancia para identificar UN patrón principal repetido en su linaje y ofrecer un cierre energético cristiano (pedir perdón, soltar, avanzar). Nunca inventes ni supongas: si las respuestas son insuficientes o ambiguas, indícalo en "needs_more" y explica qué falta. Responde SIEMPRE en JSON estricto con este shape exacto:
{
  "summary": "string — 2-4 párrafos resumen del patrón identificado en su linaje/infancia",
  "primary_focus": "restauración familiar" | "sanidad emocional" | "identidad" | "reconexión" | "propósito" | "disciplina espiritual",
  "recommended_categories": ["dinero"|"pareja"|"casa"|"negocio"|"trabajo"|"proposito"|"abundancia"|"libre"],
  "closure_prayer": "string — oración de cierre personalizada, 4-6 líneas, tono cristiano evangélico, incluye pedir perdón, soltar y avanzar",
  "welcome_message": "string — 1 párrafo de bienvenida al programa personalizado",
  "needs_more": false | "string con lo que falta"
}`;

        const userMsg = `ÁRBOL GENEALÓGICO:\n${Object.entries(body.genealogy).map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\nINFANCIA:\n${Object.entries(body.childhood).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`;

        try {
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
              response_format: { type: "json_object" },
            }),
          });
          if (!r.ok) {
            const t = await r.text();
            return new Response(JSON.stringify({ error: r.status === 402 ? "Créditos IA agotados. Contacta al administrador." : r.status === 429 ? "Demasiadas solicitudes, intenta en un momento." : "Error de IA: " + t.slice(0, 200) }), { status: r.status });
          }
          const j = await r.json();
          const content = j.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(content);
          return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
        }
      },
    },
  },
});
