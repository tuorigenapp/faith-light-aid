import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Public sample reading for the sales funnel. Uses the local ORÍGEN engine (no AI credits, no private data).
const Input = z.object({
  kind: z.enum(["dios", "patron", "pareja"]),
  name: z.string().trim().min(1).max(60),
  question: z.string().trim().max(500).optional().default(""),
  partner: z.string().trim().max(60).optional().default(""),
});

export const Route = createFileRoute("/api/public/demo-consulta")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let d: z.infer<typeof Input>;
        try { d = Input.parse(await request.json()); } catch { return Response.json({ error: "Escribe tu nombre para recibir tu respuesta." }, { status: 400 }); }
        const eng = await import("@/lib/origen-engine.server");
        let headline = ""; let sections: { title: string; body: string }[] = [];
        if (d.kind === "dios") {
          const r = await eng.engineMinistracion({ scope: "ministracion", name: d.name, question: d.question, title: "Dios te dice hoy" });
          headline = r.headline;
          sections = [{ title: "Lo que se percibe en ti hoy", body: r.dictamen }, { title: "Lo que viene en los próximos días", body: r.linea_tiempo }, { title: "Tu palabra para hoy", body: `${r.ministracion}\n\n${r.versiculo}` }];
        } else if (d.kind === "patron") {
          const r = await eng.enginePatrones({ scope: "patrones", name: d.name, question: d.question, familyCount: 1 });
          headline = "Lo que se repite en tu familia puede terminar contigo";
          sections = [{ title: "La raíz de lo que se repite", body: r.observation }, { title: "Patrones que se observan", body: r.patterns.map((p) => `• ${p}`).join("\n") }, { title: "Tu paso concreto", body: r.recommendations.slice(0, 2).join("\n") }];
        } else {
          const r = await eng.enginePareja({ scope: "pareja", name: d.name, question: d.question, partnerName: d.partner });
          headline = r.verdict_title;
          sections = [{ title: "Lo que hay entre ustedes", body: r.summary }, { title: "La dinámica que se repite", body: r.pattern }, { title: "Lo que te toca hacer", body: r.advice }];
        }
        await eng.logAssistant(`demo-${d.kind}`, null, d.question, null, "Prueba del embudo");
        return Response.json({ headline, sections });
      },
    },
  },
});
