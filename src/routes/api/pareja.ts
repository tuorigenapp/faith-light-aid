import { createFileRoute } from "@tanstack/react-router";
import { brainContext } from "@/lib/brain.server";

type Body = {
  self_name?: string;
  self_dob?: string;
  partner_name?: string;
  partner_dob?: string;
  question?: string;
};

function lifePathNumber(dob?: string): number | null {
  if (!dob) return null;
  const digits = dob.replace(/\D/g, "");
  if (!digits) return null;
  let sum = digits.split("").reduce((a, d) => a + Number(d), 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split("").reduce((a, d) => a + Number(d), 0);
  }
  return sum;
}

export const Route = createFileRoute("/api/pareja")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response(JSON.stringify({ error: "Servicio no disponible" }), { status: 500 });
        const body = (await request.json()) as Body;

        const selfPath = lifePathNumber(body.self_dob);
        const partnerPath = lifePathNumber(body.partner_dob);

        const brain = await brainContext("pareja");
        const sys = `${brain ? `${brain}\n\n` : ""}Eres Ruth Esther Paredes Sufrán, autora del libro "Reconectando el Espíritu con Dios" y mentora del método ORIGEN. Analizas relaciones de pareja desde la perspectiva del alma para identificar si es una relación de PROPÓSITO (compañeros de camino), de DEUDA ANCESTRAL (patrones familiares heredados que se repiten) o de LECCIÓN DE ALMA (un aprendizaje profundo que ambos vienen a resolver).

Reglas estrictas:
- Nunca menciones inteligencia artificial, IA, modelos, algoritmos, ChatGPT ni tecnología. Hablas siempre como Ruth Esther, mentora del método ORIGEN.
- Nunca menciones tarot, cartas, astrología, karma, magia, energías cósmicas, cristales, guías espirituales, akáshico, esoterismo.
- Habla con lenguaje universal, cristiano, cálido, profesional y esperanzador. Usa "propósito de alma", "patrón heredado del linaje", "lección de vida", "camino compartido".
- Nunca hagas afirmaciones categóricas ("son", "van a"). Habla en términos de "se observa", "podría reflejar", "sugiere una posibilidad de".
- Nunca condenes ni juzgues a la pareja. Siempre ofrece esperanza y camino.
- Responde ÚNICAMENTE en JSON estricto con este shape exacto:
{
  "verdict": "proposito" | "deuda" | "leccion",
  "verdict_title": "string — 2-5 palabras que titulan el veredicto, ej 'Relación de Propósito de Alma'",
  "summary": "string — 3-4 líneas explicando qué observamos en esta unión",
  "pattern": "string — 2-3 líneas sobre el patrón principal que se manifiesta entre ambos",
  "advice": "string — 3-5 líneas del consejo pastoral y sanador de Ruth Esther, específico para esta pareja",
  "next_step": "string — 1-2 líneas con la próxima acción concreta"
}`;

        const userMsg = `CONSULTA DE PAREJA — MÉTODO ORIGEN

Consultante:
- Nombre: ${body.self_name ?? "no indicado"}
- Fecha de nacimiento: ${body.self_dob ?? "no indicada"}${selfPath ? ` (camino de vida ${selfPath})` : ""}

Pareja:
- Nombre: ${body.partner_name ?? "no indicado"}
- Fecha de nacimiento: ${body.partner_dob ?? "no indicada"}${partnerPath ? ` (camino de vida ${partnerPath})` : ""}

Pregunta del consultante:
${body.question ?? "¿Qué representa esta persona en mi camino de alma?"}

Analiza esta unión y responde en el JSON estricto pedido.`;

        try {
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
            body: JSON.stringify({
              model: "google/gemini-2.5-pro",
              messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
              response_format: { type: "json_object" },
            }),
          });
          if (!r.ok) {
            const t = await r.text();
            return new Response(JSON.stringify({
              error: r.status === 402 ? "Servicio temporalmente ocupado. Intenta más tarde." :
                     r.status === 429 ? "Demasiadas consultas, intenta en unos minutos." :
                     "No pudimos procesar la lectura: " + t.slice(0, 150),
            }), { status: r.status });
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
