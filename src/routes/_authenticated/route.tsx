import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Home, MessageCircle, Compass, Layers, BookHeart, Dumbbell, Library, CreditCard, User as UserIcon, Shield, LogOut, Menu } from "lucide-react";
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

const NAV = [
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

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 h-screen w-72 bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-transform",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-divine text-white font-display">R</span>
            <div>
              <div className="font-display text-base text-sidebar-foreground leading-none">Reconectando</div>
              <div className="text-[10px] uppercase tracking-widest text-gold mt-1">Espíritu con Dios</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));
            return (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}>
                <Icon className="w-4 h-4 shrink-0" />{label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mt-4 border-t border-sidebar-border pt-4",
                location.pathname.startsWith("/admin") ? "bg-gold/15 text-gold font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
              )}>
              <Shield className="w-4 h-4" /> Administrador
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 mb-1">Sesión iniciada</div>
          <div className="text-sm text-sidebar-foreground truncate mb-3">{user?.email}</div>
          <Button onClick={signOut} variant="outline" size="sm" className="w-full"><LogOut className="w-3.5 h-3.5 mr-2" />Cerrar sesión</Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between p-4 bg-background/80 backdrop-blur border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><Menu className="w-5 h-5" /></Button>
          <span className="font-display">Reconectando</span>
          <div className="w-8" />
        </header>
        <main className="flex-1"><Outlet /></main>
      </div>
    </div>
  );
}
