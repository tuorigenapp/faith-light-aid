import { createFileRoute } from "@tanstack/react-router";
import { CHRISTIAN_LANGUAGE_RULE, christianContent } from "@/lib/christian-language";

type Body = {
  name?: string;
  genealogy: Record<string, string>;
  childhood: Record<string, string>;
};

export const Route = createFileRoute("/api/intake-closure")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response(JSON.stringify({ error: "Servicio no disponible" }), { status: 500 });
        const body = (await request.json()) as Body;

        const sys = `Eres un guía de bienestar emocional y crecimiento personal desde la fe cristiana, sin imponer creencias. Analizas respuestas del usuario sobre patrones familiares y recuerdos de infancia para identificar UN patrón emocional principal y ofrecer un cierre reflexivo (comprender, soltar, avanzar). Nunca inventes ni supongas: si las respuestas son insuficientes o ambiguas, indícalo en "needs_more". Responde SIEMPRE en JSON estricto con este shape exacto:
{
  "pattern_name": "string corto (2-4 palabras). Ejemplos: 'Herida de abandono', 'Miedo a fallar', 'Necesidad de aprobación', 'Autoexigencia crónica', 'Miedo a la escasez'",
  "pattern_summary": "string — 1 frase (máx 25 palabras) que resume qué aprendió el usuario a hacer por causa del patrón. Ejemplo: 'Has aprendido a protegerte porque durante mucho tiempo sentiste que debías hacerlo solo.'",
  "impact": {
    "relaciones": "string — 1 frase corta de cómo afecta hoy sus relaciones",
    "prosperidad": "string — 1 frase corta de cómo afecta hoy sus decisiones/oportunidades",
    "emociones": "string — 1 frase corta de cómo afecta hoy sus emociones"
  },
  "strengths": {
    "adaptarte": "string — 1 frase de cómo esta experiencia lo hizo adaptable",
    "resistir": "string — 1 frase de cómo desarrolló resistencia",
    "ayudar": "string — 1 frase de cómo puede ayudar a otros con esta experiencia"
  },
  "primary_focus": "relaciones" | "prosperidad" | "emociones" | "identidad" | "propósito",
  "recommended_categories": ["array de 2-4 categorías breves"],
  "closure_reflection": "string — reflexión de cierre suave, 3-4 líneas, tono cálido y humano desde la fe cristiana, incluye comprender, soltar y avanzar",
  "welcome_message": "string — 1-2 frases dando la bienvenida al programa personalizado",
  "needs_more": false
}`;

        const userMsg = `NOMBRE: ${body.name ?? "usuario"}

PATRONES FAMILIARES / LINAJE:
${Object.entries(body.genealogy).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

RECUERDOS / INFANCIA:
${Object.entries(body.childhood).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`;

        try {
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "system", content: `${sys}\n${CHRISTIAN_LANGUAGE_RULE}` }, { role: "user", content: userMsg }],
              response_format: { type: "json_object" },
            }),
          });
          if (!r.ok) {
            const t = await r.text();
            return new Response(JSON.stringify({
              error: r.status === 402
                ? "Créditos agotados. Contacta al administrador."
                : r.status === 429
                ? "Demasiadas solicitudes, intenta en un momento."
                : "Error: " + t.slice(0, 200),
            }), { status: r.status });
          }
          const j = await r.json();
          const content = j.choices?.[0]?.message?.content ?? "{}";
          const parsed = christianContent(JSON.parse(content));
          return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
        }
      },
    },
  },
});
