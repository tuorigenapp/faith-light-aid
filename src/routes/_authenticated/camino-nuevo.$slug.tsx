import { createFileRoute, Navigate } from "@tanstack/react-router";

/** Enlaces antiguos: los caminos creados en el panel ahora viven con el mismo diseño de CAMINO ORÍGEN. */
export const Route = createFileRoute("/_authenticated/camino-nuevo/$slug")({
  head: () => ({
    meta: [
      { title: "Camino ORÍGEN — Transformación diaria" },
      { name: "description", content: "Ocho etapas diarias de sanación con lección, juegos y recompensas." },
      { property: "og:title", content: "Camino ORÍGEN — Transformación diaria" },
      { property: "og:description", content: "Ocho etapas diarias de sanación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Redirect,
});

function Redirect() {
  const { slug } = Route.useParams();
  return <Navigate to="/caminos/$caminoId" params={{ caminoId: slug }} replace />;
}
