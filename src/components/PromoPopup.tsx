import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Placement = "inicio" | "comunidad";

/** Campaña emergente: imagen clicable con X de cierre. Inicio y comunidad son independientes. */
export function PromoPopup({ userId, placement = "inicio" }: { userId?: string; placement?: Placement }) {
  const [open, setOpen] = useState(false);
  const { data: promo } = useQuery({
    queryKey: ["promo-active", placement],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("promo_campaigns")
        .select("id, title, image_url, link_url, starts_at, ends_at, placement, days, shows_per_day, created_at")
        .eq("is_active", true)
        .eq("placement", placement)
        .order("created_at", { ascending: false })
        .limit(8);
      return (
        (data ?? []).find((p) => {
          if (p.starts_at && p.starts_at > nowIso) return false;
          if (p.ends_at && p.ends_at < nowIso) return false;
          // Duración en días desde su creación
          const days = Number(p.days ?? 0);
          if (days > 0 && p.created_at) {
            const limit = new Date(new Date(p.created_at).getTime() + days * 86400000).toISOString();
            if (limit < nowIso) return false;
          }
          return true;
        }) ?? null
      );
    },
  });

  useEffect(() => {
    if (!promo) return;
    const key = `origen-promo-${placement}-${promo.id}-${new Date().toISOString().slice(0, 10)}`;
    const shown = Number(localStorage.getItem(key) ?? "0");
    const max = Math.max(1, Number(promo.shows_per_day ?? 1));
    if (shown >= max) return;
    const t = setTimeout(() => {
      setOpen(true);
      localStorage.setItem(key, String(shown + 1));
    }, 1200);
    return () => clearTimeout(t);
  }, [promo, placement]);

  if (!open || !promo) return null;
  const img = <img src={promo.image_url} alt={promo.title || "Campaña de ORÍGEN"} className="block max-h-[75dvh] w-full rounded-[20px] object-contain" />;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-foreground/60 p-5 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-[420px] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute -right-2 -top-2 z-10 grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-elev active:scale-95">
          <X className="h-5 w-5" />
        </button>
        {promo.link_url ? (
          <a href={promo.link_url} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="block shadow-elev rounded-[20px]">{img}</a>
        ) : (
          <div className="shadow-elev rounded-[20px]">{img}</div>
        )}
      </div>
    </div>
  );
}
