import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/diagnostico")({
  head: () => ({ meta: [{ title: "Onboarding ORIGEN — Reconectando" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/onboarding", replace: true });
  },
  component: () => null,
});
