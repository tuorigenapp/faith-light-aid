import { createFileRoute } from "@tanstack/react-router";
import { enginePareja, logAssistant, userFrom } from "@/lib/origen-engine.server";

/** ¿Mi pareja es de destino? — asistente ORÍGEN sin créditos. */
export const Route = createFileRoute("/api/pareja")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const b = (await request.json().catch(() => ({}))) as { self_name?: string; self_dob?: string; partner_name?: string; partner_dob?: string; question?: string };
        const q = (b.question ?? "").slice(0, 1000);
        const out = await enginePareja({ scope: "pareja", name: b.self_name, birthdate: b.self_dob, partnerName: b.partner_name, partnerDob: b.partner_dob, question: q });
        await logAssistant("pareja", await userFrom(request), q, null, "¿Mi pareja es de destino?");
        return Response.json(out);
      },
    },
  },
});
