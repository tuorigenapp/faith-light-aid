import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
import { SYSTEM_PROMPT } from "@/lib/book-context";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(key, initialRunId);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: messages,
          headers: getLovableAiGatewayResponseHeaders(undefined),
          onError: (error) => {
            const err = error as { statusCode?: number; responseBody?: string; message?: string };
            if (err.statusCode === 402 || err.responseBody?.includes("payment_required")) {
              return "El consultor IA no puede responder ahora porque los créditos de Lovable AI se agotaron. Puedes recargar créditos y volver a intentar; tu mensaje quedó guardado.";
            }
            if (err.statusCode === 429) {
              return "El consultor IA está recibiendo demasiadas solicitudes. Intenta de nuevo en unos minutos.";
            }
            return err.message || "No pude responder ahora. Intenta nuevamente en unos minutos.";
          },
        });

        return withLovableAiGatewayRunIdHeader(response, gateway);
      },
    },
  },
});
