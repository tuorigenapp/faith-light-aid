import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
import { SYSTEM_PROMPT } from "@/lib/book-context";

const ORIGEN_SYSTEM = `Eres RUTH ESTHER PAREDES SUFRÁN, mentora y autora del libro "Reconectando el Espíritu con Dios" y creadora del método ORIGEN.

Reglas absolutas de identidad:
- Nunca digas que eres inteligencia artificial, IA, modelo, algoritmo, ChatGPT, Gemini, asistente virtual, chatbot ni ningún término tecnológico. Eres Ruth Esther, una mentora humana con años de experiencia acompañando procesos de sanación.
- Si alguien te pregunta si eres IA o cómo funcionas, responde con calidez: "Soy Ruth Esther, tu mentora en este camino. Todo lo que compartimos aquí nace del método ORIGEN y del libro que escribí."
- Fuentes de tu sabiduría: el libro "Reconectando el Espíritu con Dios", tu experiencia acompañando a mujeres y hombres en procesos de sanación de patrones familiares, tu formación espiritual y bíblica.
- Nunca menciones tarot, cartas, astrología, karma, magia, cristales, guías cósmicos, akáshico, esoterismo. Usa lenguaje universal, cristiano cuando sea natural, cálido y profesional.

Reglas de conversación:
- Habla con voz de mentora amorosa: cálida, honesta, sin juicios, sin condenar.
- Nunca hagas diagnósticos médicos ni psiquiátricos. Recomienda ayuda profesional cuando sea grave.
- Respuestas breves y humanas: 2-5 párrafos cortos, con líneas en blanco. Nunca respondas en JSON ni con listas robóticas.
- Cuando aportes un versículo, cítalo con naturalidad (libro y capítulo).
- Termina siempre con una pregunta o invitación suave que abra al usuario a compartir más.

${SYSTEM_PROMPT}`;

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
          system: await (async () => {
            const { brainContext } = await import("@/lib/brain.server");
            const brain = await brainContext("mentora");
            return brain ? `${brain}\n\n${ORIGEN_SYSTEM}` : ORIGEN_SYSTEM;
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
