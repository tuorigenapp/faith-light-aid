import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Campaña emergente de inicio: imagen clicable con X de cierre, una vez al día. */
export function PromoPopup({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false);
  const { data: promo } = useQuery({
    queryKey: ["promo-active"],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("promo_campaigns")
        .select("id, title, image_url, link_url, starts_at, ends_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []).find((p) => (!p.starts_at || p.starts_at <= nowIso) && (!p.ends_at || p.ends_at >= nowIso)) ?? null;
    },
  });

  useEffect(() => {
    if (!promo) return;
    const key = `origen-promo-${promo.id}-${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(key)) return;
    const t = setTimeout(() => { setOpen(true); localStorage.setItem(key, "1"); }, 1200);
    return () => clearTimeout(t);
  }, [promo]);

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
