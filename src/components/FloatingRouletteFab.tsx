import { Link, useLocation } from "@tanstack/react-router";
import { Gift } from "lucide-react";

export function FloatingRouletteFab() {
  const location = useLocation();
  const hide = location.pathname.startsWith("/onboarding") || location.pathname.startsWith("/auth") || location.pathname.startsWith("/ruleta");
  if (hide) return null;

  return (
    <Link
      to="/ruleta"
      aria-label="Abrir ruleta diaria"
      className="fixed right-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-primary/20 bg-card text-primary shadow-elevated active:scale-95 transition animate-breathe"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 150px)" }}
    >
      <Gift className="h-5 w-5" />
      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
    </Link>
  );
}
