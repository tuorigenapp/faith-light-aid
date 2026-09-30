import { createFileRoute } from "@tanstack/react-router";
import { brainContext } from "@/lib/brain.server";

type Body = {
  name?: string;
  birthdate?: string;
  question?: string;
  profile?: { display_name?: string; primary_focus?: string } | null;
  intake?: { genealogy?: unknown; childhood?: unknown; ai_plan?: unknown } | null;
  family?: Array<{ full_name: string; relationship: string; lineage: string }>;
};

export const Route = createFileRoute("/api/patrones")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response(JSON.stringify({ error: "Servicio no disponible" }), { status: 500 });
        const body = (await request.json()) as Body;

        const sys = `Eres un consultor profesional de bienestar emocional, crecimiento personal y patrones familiares. Analizas ÚNICAMENTE la información que el usuario ha registrado en la aplicación (perfil, árbol genealógico, respuestas del onboarding y programa personalizado) para responder su consulta.

Reglas estrictas:
- Nunca inventes datos que no están en la información entregada.
- Nunca menciones tarot, cartas, energías, karma, esoterismo, magia, cristales, guías, registros akáshicos, ni ningún término místico.
- Usa lenguaje universal, cálido y profesional: en lugar de "energía" di "frecuencia interior" o "estado emocional"; en lugar de "karma" di "ley de siembra y cosecha" o "justicia natural"; en lugar de "karmico" di "patrón familiar heredado" o "relación generacional".
- No hagas afirmaciones categóricas ni diagnósticos absolutos. Habla en términos de "posible patrón", "podría observarse", "sugiere".
- Si la información del usuario es insuficiente para responder con seriedad, indícalo con amabilidad y sugiere completar más partes del programa.
- Responde ÚNICAMENTE en JSON estricto con este shape exacto:
{
  "observation": "string — 2-3 frases resumiendo qué observamos en la información del usuario relacionado a su pregunta",
  "patterns": ["array de 3-5 patrones posibles identificados, cada uno corto (3-6 palabras)"],
  "reflection": "string — 3-5 líneas de reflexión personalizada y profesional que responde directamente la pregunta",
  "recommendations": ["array de 3-5 recomendaciones concretas: ejercicios, reflexiones, actividades, devocionales, lecciones del programa"],
  "needs_more": false
}`;

        const family = (body.family ?? []).map(
          (f) => `- ${f.full_name} (${f.relationship}, linaje ${f.lineage})`,
        ).join("\n") || "(sin familiares registrados)";

        const userMsg = `INFORMACIÓN REGISTRADA DEL USUARIO:

Nombre: ${body.name ?? body.profile?.display_name ?? "usuario"}
Fecha de nacimiento: ${body.birthdate ?? "no indicada"}
Foco principal del programa: ${body.profile?.primary_focus ?? "no definido aún"}

ÁRBOL GENEALÓGICO:
${family}

RESPUESTAS DEL PROGRAMA:
${JSON.stringify({ genealogy: body.intake?.genealogy, childhood: body.intake?.childhood, ai_plan: body.intake?.ai_plan }, null, 2).slice(0, 3500)}

PREGUNTA DEL USUARIO:
${body.question ?? "(sin pregunta)"}`;

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
            return new Response(
              JSON.stringify({
                error:
                  r.status === 402
                    ? "Servicio temporalmente ocupado. Intenta más tarde."
                    : r.status === 429
                      ? "Demasiadas consultas, intenta en un momento."
                      : "No pudimos procesar tu consulta ahora: " + t.slice(0, 150),
              }),
              { status: r.status },
            );
          }
          const j = await r.json();
          const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
          return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
        }
      },
    },
  },
});
