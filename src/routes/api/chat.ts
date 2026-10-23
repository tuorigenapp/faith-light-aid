import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage, type TextStreamPart, type ToolSet } from "ai";
import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
import { SYSTEM_PROMPT } from "@/lib/book-context";
import { CHRISTIAN_LANGUAGE_RULE, christianText } from "@/lib/christian-language";

const ORIGEN_SYSTEM = `Eres RUTH ESTHER PAREDES SUFRÁN, mentora y autora del libro "Reconectando el Espíritu con Dios" y creadora del método ORIGEN.

Reglas absolutas de identidad:
- Eres la mentora virtual de ORÍGEN, basada en el método de Ruth Esther. No te presentes como la autora ni como una persona humana.
- Si alguien te pregunta si eres IA o cómo funcionas, responde con honestidad: "Soy la mentora virtual de ORÍGEN y te acompaño con el método de Ruth Esther."
- Fuentes de tu sabiduría: el libro "Reconectando el Espíritu con Dios", tu experiencia acompañando a mujeres y hombres en procesos de sanación de patrones familiares, tu formación espiritual y bíblica.
- Usa siempre lenguaje espiritual cristiano, cálido y profesional, sin referencias esotéricas.

Reglas de conversación:
- Habla con voz de mentora amorosa: cálida, honesta, sin juicios, sin condenar.
- Nunca hagas diagnósticos médicos ni psiquiátricos. Recomienda ayuda profesional cuando sea grave.
- Respuestas breves y humanas: 2-5 párrafos cortos, con líneas en blanco. Nunca respondas en JSON ni con listas robóticas.
- Cuando aportes un versículo, cítalo con naturalidad (libro y capítulo).
- Termina siempre con una pregunta o invitación suave que abra al usuario a compartir más.

${SYSTEM_PROMPT}`;

/** Buffer authored text until its end so forbidden prose never appears as a streamed fragment. */
function christianResponseTransform() {
  const pending = new Map<string, string>();
  return new TransformStream<TextStreamPart<ToolSet>, TextStreamPart<ToolSet>>({
    transform(chunk, controller) {
      if (chunk.type === "text-delta") {
        pending.set(chunk.id, (pending.get(chunk.id) ?? "") + chunk.text);
        return;
      }
      if (chunk.type === "text-end") {
        const text = pending.get(chunk.id);
        if (text) controller.enqueue({ type: "text-delta", id: chunk.id, text: christianText(text) });
        pending.delete(chunk.id);
      }
      controller.enqueue(chunk);
    },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("Messages are required", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(key, initialRunId);
        const result = streamText({
          model: gateway("google/gemini-2.5-pro"),
          experimental_transform: christianResponseTransform,
          system: await (async () => {
            const { brainContext } = await import("@/lib/brain.server");
            const brain = await brainContext("mentora");
            return `${brain}\n\n${ORIGEN_SYSTEM}\n\n${CHRISTIAN_LANGUAGE_RULE}`;
          })(),
          messages: await convertToModelMessages(messages),
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: messages,
          headers: getLovableAiGatewayResponseHeaders(undefined),
          onError: (error) => {
            const err = error as { statusCode?: number; responseBody?: string; message?: string };
            if (err.statusCode === 402 || err.responseBody?.includes("payment_required")) {
              return "Perdona, en este momento no puedo responderte. Vuelve a intentarlo en unos minutos, ¿te parece? Tu mensaje quedó guardado.";
            }
            if (err.statusCode === 429) {
              return "Muchas personas están hablando conmigo ahora. Dame unos minutos y volvemos a conversar.";
            }
            return "No pude responderte ahora. Intenta nuevamente en unos minutos.";
          },
        });

        return withLovableAiGatewayRunIdHeader(response, gateway);
      },
    },
  },
});
