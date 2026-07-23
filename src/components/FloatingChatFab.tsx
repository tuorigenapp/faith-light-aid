import { Link, useLocation } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export function FloatingChatFab() {
  const location = useLocation();
  const hide =
    location.pathname.startsWith("/onboarding") ||
    location.pathname.startsWith("/chat") ||
    location.pathname.startsWith("/auth");
  if (hide) return null;

  return (
    <Link
      to="/chat"
      aria-label="Habla con Ruth Esther"
      className="fixed right-4 z-40 grid place-items-center w-14 h-14 rounded-full bg-brand-gradient shadow-glow text-white active:scale-95 transition-transform animate-breathe"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 84px)" }}
    >
      <MessageCircle className="w-6 h-6" />
      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F58BCB] border-2 border-white" />
    </Link>
  );
}
