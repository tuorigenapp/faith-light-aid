import { createFileRoute } from "@tanstack/react-router";
import { engineMinistracion, logAssistant, userFrom } from "@/lib/origen-engine.server";

/** Dios te dice hoy — asistente ORÍGEN sin créditos. */
export const Route = createFileRoute("/api/ministracion")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { name?: string; dob?: string; question?: string };
        const q = (body.question ?? "").slice(0, 1000);
        const out = await engineMinistracion({ scope: "ministracion", name: body.name, birthdate: body.dob, question: q });
        await logAssistant("ministracion", await userFrom(request), q, null, "Dios te dice hoy");
        return Response.json(out);
      },
    },
  },
});
