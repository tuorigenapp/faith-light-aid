import { createFileRoute } from "@tanstack/react-router";
import { enginePatrones, logAssistant, userFrom } from "@/lib/origen-engine.server";

/** Patrones generacionales — asistente ORÍGEN sin créditos. */
export const Route = createFileRoute("/api/patrones")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const b = (await request.json().catch(() => ({}))) as { name?: string; birthdate?: string; question?: string; family?: unknown[] };
        const q = (b.question ?? "").slice(0, 1000);
        const out = await enginePatrones({ scope: "patrones", name: b.name, birthdate: b.birthdate, question: q, familyCount: (b.family ?? []).length });
        await logAssistant("patrones", await userFrom(request), q, null, "Patrones generacionales");
        return Response.json(out);
      },
    },
  },
});
