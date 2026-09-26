import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  BookHeart,
  ChevronUp,
  CreditCard,
  Dumbbell,
  Gift,
  HeartHandshake,
  Headphones,
  Home,
  Layers,
  Leaf,
  MessageCircle,
  Route as RouteIcon,
  Send,
  Sparkles,
  TreeDeciduous,
  Trophy,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { useOrigenPendings, type Pendings } from "@/hooks/use-origen-pendings";

type Item = {
  to: string;
  label: string;
  icon: typeof Home;
  flag?: keyof Pendings;
};

const ITEMS: Item[] = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/avisos", label: "Avisos de ORÍGEN", icon: Bell, flag: "notices" },
  { to: "/etapas", label: "Mi Camino", icon: RouteIcon, flag: "camino" },
  { to: "/ejercicios", label: "Ejercicios del día", icon: Dumbbell, flag: "ejercicios" },
  { to: "/palabra", label: "Palabra del día", icon: Sparkles, flag: "palabra" },
  { to: "/visualiza", label: "Visualízalo y Vívelo", icon: Headphones, flag: "visualiza" },
  { to: "/arbol", label: "Mi árbol de sanación", icon: TreeDeciduous, flag: "arbol" },
  { to: "/ruleta", label: "Ruleta de hoy", icon: Gift, flag: "ruleta" },
  { to: "/comunidad", label: "Comunidad", icon: Users, flag: "comunidad" },
  { to: "/comprarmonedas", label: "Compras de hojas", icon: Leaf, flag: "compras" },
  { to: "/comprarmonedas", label: "Transferencias", icon: Send, flag: "transferencias" },
  { to: "/chat", label: "Ruth Esther", icon: MessageCircle },
  { to: "/categorias", label: "Categorías", icon: Layers },
  { to: "/diario", label: "Diario íntimo", icon: BookHeart },
  { to: "/premiosorigen", label: "Premios ORÍGEN", icon: Trophy },
  { to: "/invita", label: "Invita y gana", icon: HeartHandshake },
  { to: "/membresia", label: "Camino ORÍGEN", icon: CreditCard },
  { to: "/perfil", label: "Mi perfil", icon: UserIcon },
];

function isPending(p: Pendings | undefined, flag?: keyof Pendings) {
  if (!p || !flag) return false;
  const value = p[flag];
  return typeof value === "number" ? value > 0 : value;
}

/** Burbuja flotante con todo ORÍGEN y bolitas rojas de pendientes. */
export function FloatingOrigenMenu() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: pendings } = useOrigenPendings(user?.id);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const hide =
    location.pathname.startsWith("/onboarding") ||
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/ruleta");
  if (hide) return null;

  const anyPending = ITEMS.some((i) => isPending(pendings, i.flag));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-[#1B1930]/55 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div
          className="fixed inset-x-3 z-50 max-h-[70dvh] overflow-y-auto rounded-[16px] border border-border bg-card p-3 shadow-elev sm:inset-x-auto sm:right-4 sm:w-[340px]"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 200px)" }}
        >
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <p className="font-display text-[15px] font-extrabold text-foreground">
              TODO LO DE ORÍGEN
            </p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="grid h-11 w-11 place-items-center rounded-full bg-muted text-foreground/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-1">
            {ITEMS.map((item) => (
              <li key={`${item.to}-${item.label}`}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-[12px] px-3 text-sm font-semibold text-foreground/85 hover:bg-secondary/60"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {isPending(pendings, item.flag) && (
                    <span
                      aria-label="Tienes algo pendiente"
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-destructive"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir todo lo de ORÍGEN"
        className={cn(
          "fixed right-4 z-50 inline-flex min-h-12 items-center gap-2 rounded-full border border-primary/25 bg-card px-3 text-[12px] font-bold text-primary shadow-elev transition active:scale-95",
        )}
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 150px)" }}
      >
        <span className="max-w-[124px] truncate">TODO LO DE ORÍGEN</span>
        <ChevronUp className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        {anyPending && (
          <span
            aria-label="Tienes pendientes"
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-destructive"
          />
        )}
      </button>
    </>
  );
}
