import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useTheme } from "@/lib/theme";
import {
  Home, MessageCircle, Layers, BookHeart, Dumbbell,
  CreditCard, User as UserIcon, Shield, LogOut, Menu, Sun, Moon, X,
  Headphones, TreeDeciduous, Trophy, HeartHandshake, Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { FloatingChatFab } from "@/components/FloatingChatFab";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthLayout,
});

const BOTTOM_NAV = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/etapas", label: "Camino", icon: Layers },
  { to: "/pareja", label: "Pareja", icon: HeartHandshake },
  { to: "/visualiza", label: "Vívelo", icon: Headphones },
  { to: "/perfil", label: "Yo", icon: UserIcon },
] as const;

const FULL_NAV = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/chat", label: "Conversa con Ruth Esther", icon: MessageCircle },
  { to: "/pareja", label: "¿Deuda o propósito?", icon: HeartHandshake },
  { to: "/patrones", label: "Patrones familiares", icon: Sparkles },
  { to: "/arbol", label: "Mi árbol genealógico", icon: TreeDeciduous },
  { to: "/etapas", label: "Mi camino (etapas)", icon: Layers },
  { to: "/visualiza", label: "Visualízalo y Vívelo", icon: Headphones },
  { to: "/diario", label: "Diario íntimo", icon: BookHeart },
  { to: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { to: "/premios", label: "Hojas de sanación", icon: Trophy },
  { to: "/invita", label: "Invita y gana", icon: Sparkles },
  { to: "/membresia", label: "Camino ORIGEN", icon: CreditCard },
  { to: "/perfil", label: "Perfil", icon: UserIcon },
] as const;

function AuthLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });
  const { data: intake } = useQuery({
    queryKey: ["intake-status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("intake_sessions").select("status").eq("user_id", user!.id).maybeSingle();
      return data?.status ?? "missing";
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, full_name, gems, avatar_url").eq("id", user!.id).maybeSingle();
      return data;
    },
    refetchInterval: 30000,
  });
  const displayName = (profile?.display_name || profile?.full_name || user?.email?.split("@")[0] || "Amigo").split(" ")[0];
  const gems = profile?.gems ?? 0;

  useEffect(() => {
    if (!user || intake === undefined) return;
    if (intake !== "completed" && location.pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [intake, user, location.pathname, navigate]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const isActive = (to: string) =>
    location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));

  const immersive = location.pathname.startsWith("/onboarding");
  if (immersive) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-aura-top text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-72 bg-white/70 backdrop-blur border-r border-border flex-col z-30">
        <div className="p-5 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-gradient shadow-glow grid place-items-center text-white font-display font-bold">O</div>
            <div>
              <div className="font-display font-bold text-[17px] leading-none">ORIGEN</div>
              <div className="text-[10px] uppercase tracking-widest text-primary mt-1">Transforma tu alma</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {FULL_NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm transition-colors",
                isActive(to)
                  ? "bg-secondary text-primary font-semibold"
                  : "text-foreground/75 hover:bg-secondary/60 hover:text-foreground"
              )}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin"
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm mt-3 border-t border-border pt-4",
                location.pathname.startsWith("/admin") ? "bg-primary/10 text-primary font-semibold" : "text-foreground/70 hover:bg-secondary/60"
              )}>
              <Shield className="w-4 h-4" /> Administrador
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground truncate">{user?.email}</span>
            <Button onClick={toggle} variant="ghost" size="icon" aria-label="Tema">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
          <Button onClick={signOut} variant="outline" size="sm" className="w-full rounded-[10px]">
            <LogOut className="w-3.5 h-3.5 mr-2" />Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white border-r border-border z-50 lg:hidden flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-gradient shadow-glow grid place-items-center text-white font-bold">O</div>
                <span className="font-display font-bold">ORIGEN</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="w-5 h-5" /></Button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {FULL_NAV.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={() => setOpen(false)}
                  className={cn("flex items-center gap-3 px-3 py-3 rounded-[12px] text-sm",
                    isActive(to) ? "bg-secondary text-primary font-semibold" : "text-foreground/80 hover:bg-secondary/60"
                  )}>
                  <Icon className="w-5 h-5" />{label}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-[12px] text-sm mt-3 border-t border-border pt-4 text-primary">
                  <Shield className="w-5 h-5" /> Administrador
                </Link>
              )}
            </nav>
            <div className="p-4 border-t border-border flex items-center gap-2">
              <Button onClick={toggle} variant="outline" size="sm" className="flex-1 rounded-[10px]">
                {theme === "dark" ? <><Sun className="w-4 h-4 mr-2" />Claro</> : <><Moon className="w-4 h-4 mr-2" />Oscuro</>}
              </Button>
              <Button onClick={signOut} variant="outline" size="sm" className="flex-1 rounded-[10px]">
                <LogOut className="w-3.5 h-3.5 mr-2" />Salir
              </Button>
            </div>
          </aside>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-3 h-16 bg-white/85 backdrop-blur-xl border-b border-border">
          <Link to="/perfil" className="flex items-center gap-2 min-w-0 rounded-2xl px-1.5 py-1 hover:bg-secondary/60">
            <div className="w-9 h-9 rounded-2xl bg-brand-gradient shadow-glow text-white grid place-items-center font-display font-bold text-sm shrink-0">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-[10px] uppercase text-muted-foreground tracking-wider truncate">Hola</div>
              <div className="font-display font-bold text-sm truncate">{displayName}</div>
            </div>
          </Link>
          <div />
          <Link to="/premios" className="justify-self-end inline-flex items-center gap-1.5 rounded-full pl-2 pr-3 h-9 bg-white border border-border shadow-soft" aria-label="Hojas de sanación">
            <span className="text-base">🍃</span>
            <span className="font-display font-bold text-sm text-primary">{gems.toLocaleString()}</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Menú">
            <Menu className="w-5 h-5" />
          </Button>
        </header>

        <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+72px)] lg:pb-0"><Outlet /></main>

        {/* Floating chat with Ruth Esther */}
        <FloatingChatFab />

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-white/90 backdrop-blur-xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <ul className="grid grid-cols-5 h-16">
            {BOTTOM_NAV.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <li key={to}>
                  <Link to={to} className={cn(
                    "h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors relative",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}>
                    {active && <span className="absolute top-0 h-0.5 w-8 bg-primary rounded-b-full" />}
                    <Icon className={cn("w-[22px] h-[22px]", active && "drop-shadow-[0_0_6px_currentColor]")} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
