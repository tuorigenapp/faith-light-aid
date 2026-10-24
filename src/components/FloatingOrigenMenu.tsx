import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BookHeart,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Dumbbell,
  Gift,
  HeartHandshake,
  Headphones,
  History,
  Home,
  Layers,
  Leaf,
  MessageCircle,
  MessageCircleHeart,
  Route as RouteIcon,
  Send,
  Sparkles,
  TreeDeciduous,
  Trophy,
  User as UserIcon,
  Users,
  X,
  MessageSquareHeart,
} from "lucide-react";
import { useMensajesUnread } from "@/hooks/use-mensajes";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useOrigenPendings, type Pendings } from "@/hooks/use-origen-pendings";

type Item = {
  to: string;
  label: string;
  icon: typeof Home;
  flag?: keyof Pendings;
  mensajes?: boolean;
  search?: Record<string, string>;
};

const ITEMS_TOP: Item[] = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/avisos", label: "Avisos de ORÍGEN", icon: Bell, flag: "notices" },
  { to: "/mensajes", label: "Mensajes ORÍGEN", icon: MessageSquareHeart, mensajes: true },
  { to: "/consultas", label: "Todas las consultas", icon: MessageCircleHeart },
  { to: "/etapas", label: "Mi Camino", icon: RouteIcon, flag: "camino" },
  { to: "/ejercicios", label: "Ejercicios del día", icon: Dumbbell, flag: "ejercicios" },
  { to: "/palabra", label: "Palabra del día", icon: Sparkles, flag: "palabra" },
];

const ITEMS_BOTTOM: Item[] = [
  { to: "/arbol", label: "Mi árbol de sanación", icon: TreeDeciduous },
  { to: "/arbol", search: { vista: "mi-arbol" }, label: "Ver mi árbol generacional", icon: TreeDeciduous, flag: "arbol" },
  { to: "/ruleta", label: "Ruleta de hoy", icon: Gift, flag: "ruleta" },
  { to: "/comunidad", label: "Comunidad", icon: Users, flag: "comunidad" },
  { to: "/comprarmonedas", label: "Compras de hojas", icon: Leaf, flag: "compras" },
  { to: "/arbol", search: { vista: "transferir" }, label: "Transferir Balance", icon: Send, flag: "transferencias" },
  { to: "/historial", label: "Historial de movimientos", icon: History },
  { to: "/chat", label: "Hablar con la Mentora", icon: MessageCircle },
  { to: "/ministracion", label: "Dios te dice hoy", icon: Sparkles },
  { to: "/pareja", label: "¿Mi pareja es de destino?", icon: HeartHandshake },
  { to: "/patrones", label: "Patrones generacionales", icon: TreeDeciduous },
  { to: "/categorias", label: "Categorías", icon: Layers },
  { to: "/diario", label: "Diario íntimo", icon: BookHeart },
  { to: "/premiosorigen", label: "Premios ORÍGEN", icon: Trophy },
  { to: "/invita", label: "Invita y gana", icon: HeartHandshake },
  { to: "/membresia", label: "Membresía ORÍGEN (Suscripción)", icon: CreditCard },
  { to: "/perfil", label: "Mi perfil", icon: UserIcon },
];

function isPending(p: Pendings | undefined, flag?: keyof Pendings) {
  if (!p || !flag) return false;
  const value = p[flag];
  return typeof value === "number" ? value > 0 : value;
}

const Dot = () => <span aria-label="Novedad" className="h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" />;

type VizCategory = {
  id: string;
  title: string;
  days: { id: string; day: number; title: string; isNew: boolean }[];
  isNew: boolean;
};

/** Temas y subtemas de Visualízalo y Vívelo con aviso de lo nuevo o abierto. */
function useVisualizaTree(userId?: string) {
  return useQuery({
    queryKey: ["menu-visualiza-tree", userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<VizCategory[]> => {
      const [cats, audios, seen] = await Promise.all([
        supabase.from("manifest_categories").select("id, title, sort_order, is_published").order("sort_order"),
        supabase.from("manifest_audios").select("id, category_id, day_index, title, is_published, created_at").order("day_index"),
        supabase.from("daily_activity").select("reference_id").eq("user_id", userId!).eq("activity_type", "manifest_audio"),
      ]);
      const opened = new Set((seen.data ?? []).map((r: { reference_id: string | null }) => r.reference_id ?? ""));
      const fresh = Date.now() - 14 * 86400000;
      return (cats.data ?? [])
        .filter((c: { is_published: boolean }) => c.is_published)
        .map((c: { id: string; title: string }) => {
          const days = (audios.data ?? [])
            .filter((a: { category_id: string; is_published: boolean }) => a.category_id === c.id && a.is_published)
            .map((a: { id: string; day_index: number; title: string; created_at: string }) => ({
              id: a.id,
              day: a.day_index,
              title: a.title,
              isNew: new Date(a.created_at).getTime() > fresh && !opened.has(a.id),
            }));
          return { id: c.id, title: c.title, days, isNew: days.some((d) => d.isNew) };
        })
        .filter((c) => c.days.length > 0);
    },
  });
}

/** Burbuja flotante con todo ORÍGEN y bolitas rojas de pendientes. */
export function FloatingOrigenMenu() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: pendings } = useOrigenPendings(user?.id);
  const [open, setOpen] = useState(false);
  const [vizOpen, setVizOpen] = useState(false);
  const [catOpen, setCatOpen] = useState<string | null>(null);
  const { data: vizTree = [] } = useVisualizaTree(open ? user?.id : undefined);

  const { data: consultas = [] } = useQuery({
    queryKey: ["menu-consultas"],
    enabled: open,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("custom_consultas")
        .select("slug, title")
        .eq("is_published", true)
        .order("sort_order");
      return (data ?? []) as { slug: string; title: string }[];
    },
  });

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const hide =
    location.pathname.startsWith("/onboarding") ||
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/ruleta");
  if (hide) return null;

  const mensajesUnread = useMensajesUnread();
  const anyPending = mensajesUnread > 0 || [...ITEMS_TOP, ...ITEMS_BOTTOM].some((i) => isPending(pendings, i.flag));
  const rowCls = "flex min-h-12 items-center gap-3 rounded-[12px] px-3 text-sm font-semibold text-foreground/85 hover:bg-secondary/60";

  const renderItem = (item: Item) => (
    <li key={`${item.to}-${item.label}`}>
      <Link to={item.to} search={(item.search ?? {}) as never} onClick={() => setOpen(false)} className={rowCls}>
        <item.icon className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {(isPending(pendings, item.flag) || (item.mensajes && mensajesUnread > 0)) && <Dot />}
      </Link>
    </li>
  );

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-[#1B1930]/55 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {open && (
        <div
          className="fixed inset-x-3 z-50 max-h-[70dvh] overflow-y-auto rounded-[16px] border border-border bg-card p-3 shadow-elev sm:inset-x-auto sm:right-4 sm:w-[340px]"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 200px)" }}
        >
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <p className="font-display text-[15px] font-extrabold text-foreground">Todo en ORÍGEN</p>
            <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="grid h-11 w-11 place-items-center rounded-full bg-muted text-foreground/70">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-1">
            {ITEMS_TOP.map(renderItem)}

            {/* Visualízalo y Vívelo con sus temas y subtemas */}
            <li>
              <button onClick={() => setVizOpen((v) => !v)} className={cn(rowCls, "w-full text-left")}>
                <Headphones className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">Visualízalo y Vívelo</span>
                {(isPending(pendings, "visualiza") || vizTree.some((c) => c.isNew)) && <Dot />}
                {vizOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
              {vizOpen && (
                <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                  <li>
                    <Link to="/visualiza" onClick={() => setOpen(false)} className={cn(rowCls, "text-[13px]")}>
                      <span className="min-w-0 flex-1 truncate">Ver todos los temas</span>
                    </Link>
                  </li>
                  {vizTree.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setCatOpen((v) => (v === c.id ? null : c.id))} className={cn(rowCls, "w-full text-left text-[13px]")}>
                        <span className="min-w-0 flex-1 truncate">{c.title}</span>
                        {c.isNew && <Dot />}
                        {catOpen === c.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      {catOpen === c.id && (
                        <ul className="ml-3 space-y-1 border-l border-border pl-2">
                          {c.days.map((d) => (
                            <li key={d.id}>
                              <Link
                                to="/visualiza/$categoryId/$day"
                                params={{ categoryId: c.id, day: String(d.day) }}
                                onClick={() => setOpen(false)}
                                className={cn(rowCls, "text-[13px] text-foreground/75")}
                              >
                                <span className="min-w-0 flex-1 truncate">#{String(d.day).padStart(2, "0")} {d.title}</span>
                                {d.isNew && <Dot />}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {ITEMS_BOTTOM.map(renderItem)}

            {consultas.map((c) => (
              <li key={c.slug}>
                <Link to="/consulta/$slug" params={{ slug: c.slug }} onClick={() => setOpen(false)} className={rowCls}>
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir todo lo de ORÍGEN"
        className="fixed right-4 z-50 grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-b from-[#8F74FF] to-[#6A4BEF] text-white shadow-[0_6px_18px_rgba(106,75,239,.35)] ring-2 ring-background transition active:scale-95"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 150px)" }}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <span className="grid grid-cols-2 gap-[3px]" aria-hidden>
            <span className="h-[9px] w-[9px] rounded-[3px] bg-white" />
            <span className="h-[9px] w-[9px] rounded-full bg-white/80" />
            <span className="h-[9px] w-[9px] rounded-full bg-white/80" />
            <span className="h-[9px] w-[9px] rotate-45 rounded-[2px] bg-[#FFD27A]" />
          </span>
        )}
        {anyPending && <span aria-label="Tienes pendientes" className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-destructive" />}
      </button>
    </>
  );
}
