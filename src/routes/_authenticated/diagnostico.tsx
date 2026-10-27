import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/diagnostico")({
  head: () => ({ meta: [
    { title: "Mi diagnóstico inicial — ORÍGEN" },
    { name: "description", content: "Tu punto de partida para un proceso personal de reflexión y crecimiento espiritual en ORÍGEN." },
    { property: "og:image", content: "https://tuorigen.app/og/inicio.jpg" }, { name: "twitter:image", content: "https://tuorigen.app/og/inicio.jpg" }, { property: "og:title", content: "Mi diagnóstico inicial — ORÍGEN" },
    { property: "og:description", content: "Conoce tu punto de partida y el siguiente paso de tu camino." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/onboarding", replace: true });
  },
  component: () => null,
});
