import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/caminos/$caminoId")({
  head: () => ({ meta: [
    { title: "Mi camino de sanación — ORÍGEN" },
    { name: "description", content: "Avanza por las prácticas y lecciones de tu camino de sanación cristiana en ORÍGEN." },
    { property: "og:title", content: "Mi camino de sanación — ORÍGEN" },
    { property: "og:description", content: "Un camino de reflexión, oración y práctica diaria." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <Outlet />,
});
