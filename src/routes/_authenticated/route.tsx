import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useTheme } from "@/lib/theme";
import {
  Home, MessageCircle, Compass, Layers, BookHeart, Dumbbell, Library,
  CreditCard, User as UserIcon, Shield, LogOut, Menu, Sun, Moon, X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthLayout,
});

// Primary (bottom-bar) navigation — keep to 5 for mobile thumb reach
const BOTTOM_NAV = [
  { to: "/dashboard", label: "Hoy", icon: Home },
  { to: "/etapas", label: "Etapas", icon: Layers },
  { to: "/chat", label: "Chat IA", icon: MessageCircle },
  { to: "/diario", label: "Diario", icon: BookHeart },
  { to: "/perfil", label: "Perfil", icon: UserIcon },
] as const;

// Full nav for sidebar / drawer
const FULL_NAV = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/chat", label: "Consultor IA", icon: MessageCircle },
  { to: "/diagnostico", label: "Diagnóstico", icon: Compass },
  { to: "/etapas", label: "8 Etapas", icon: Layers },
  { to: "/diario", label: "Diario", icon: BookHeart },
  { to: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { to: "/biblioteca", label: "Biblioteca", icon: Library },
  { to: "/membresia", label: "Membresía", icon: CreditCard },
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

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const isActive = (to: string) =>
    location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-72 bg-sidebar border-r border-sidebar-border flex-col z-30">
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="/app-icon.png" alt="" width={36} height={36} className="rounded-xl shadow-soft" />
            <div className="min-w-0">
              <div className="font-display text-base text-sidebar-foreground leading-none truncate">Reconectando</div>
              <div className="text-[10px] uppercase tracking-widest text-gold mt-1">Espíritu con Dios</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {FULL_NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive(to)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin"
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mt-4 border-t border-sidebar-border pt-4",
                location.pathname.startsWith("/admin") ? "bg-gold/15 text-gold font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
              )}>
              <Shield className="w-4 h-4" /> Administrador
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs text-sidebar-foreground/60">Sesión</div>
              <div className="text-sm text-sidebar-foreground truncate">{user?.email}</div>
            </div>
            <Button onClick={toggle} variant="ghost" size="icon" aria-label="Cambiar tema">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
          <Button onClick={signOut} variant="outline" size="sm" className="w-full">
            <LogOut className="w-3.5 h-3.5 mr-2" />Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile drawer (full menu) */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-sidebar border-r border-sidebar-border z-50 lg:hidden flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
              <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
                <img src="/app-icon.png" alt="" width={32} height={32} className="rounded-lg" />
                <span className="font-display text-sidebar-foreground">Reconectando</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="w-5 h-5" /></Button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {FULL_NAV.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={() => setOpen(false)}
                  className={cn("flex items-center gap-3 px-3 py-3 rounded-xl text-sm",
                    isActive(to)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                  )}>
                  <Icon className="w-5 h-5" />{label}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm mt-3 border-t border-sidebar-border pt-4 text-gold">
                  <Shield className="w-5 h-5" /> Administrador
                </Link>
              )}
            </nav>
            <div className="p-4 border-t border-sidebar-border flex items-center gap-2">
              <Button onClick={toggle} variant="outline" size="sm" className="flex-1">
                {theme === "dark" ? <><Sun className="w-4 h-4 mr-2" />Claro</> : <><Moon className="w-4 h-4 mr-2" />Oscuro</>}
              </Button>
              <Button onClick={signOut} variant="outline" size="sm" className="flex-1">
                <LogOut className="w-3.5 h-3.5 mr-2" />Salir
              </Button>
            </div>
          </aside>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 h-14 bg-background/85 backdrop-blur-xl border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Menu className="w-5 h-5" />
          </Button>
          <Link to="/dashboard" className="flex items-center gap-2 justify-self-center">
            <img src="/app-icon.png" alt="" width={26} height={26} className="rounded-md" />
            <span className="font-display text-sm truncate">Reconectando</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Cambiar tema">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </header>

        <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+72px)] lg:pb-0"><Outlet /></main>

        {/* Mobile bottom nav */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="grid grid-cols-5 h-16">
            {BOTTOM_NAV.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <li key={to}>
                  <Link to={to}
                    className={cn(
                      "h-full flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors relative",
                      active ? "text-gold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {active && <span className="absolute top-0 h-0.5 w-8 bg-gold rounded-b-full" />}
                    <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_currentColor]")} />
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
