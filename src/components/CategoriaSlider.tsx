import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CAMINOS } from "@/lib/caminos";
import { ThreeSlider } from "@/components/ThreeSlider";
import { useContentOverrides, useCustomCaminos } from "@/hooks/use-content-overrides";

type Item = { key: string; title: string; img?: string | null; slug?: string; caminoId?: string; subtitle?: string | null };

/** Categorías de Camino ORÍGEN: 3 por pantalla, se desliza, y botón para ver todas. */
export function CategoriaSlider() {
  const ov = useContentOverrides();
  const custom = useCustomCaminos();
  const items: Item[] = [
    ...CAMINOS.filter((c) => !ov.get(`camino:${c.id}`)?.is_hidden).map((c) => ({
      key: c.id,
      caminoId: c.id,
      title: ov.get(`camino:${c.id}`)?.title || c.title,
      img: ov.get(`camino:${c.id}`)?.cover_url || c.banner,
    })),
    ...(custom.data ?? []).map((c: any) => ({ key: c.id, slug: c.slug, title: c.title, img: c.cover_url, subtitle: c.subtitle })),
  ];
  const cls = "block rounded-[20px] overflow-hidden shadow-soft transition-all active:scale-[.98]";
  return (
    <section>
      <h3 className="font-display font-bold text-[19px] leading-tight">Elige el dolor que quieres sanar</h3>
      <p className="text-[13px] text-muted-foreground mt-1">
        Cada día abre una práctica corta: entiendes algo, lo trabajas y lo cierras.
      </p>
      <div className="hairline-brand mt-3 mb-3" />
      <ThreeSlider
        items={items}
        keyOf={(i) => i.key}
        render={(it) =>
          it.caminoId ? (
            <Link to="/caminos/$caminoId" params={{ caminoId: it.caminoId }} aria-label={it.title} className={cls}>
              <img src={it.img ?? ""} alt={it.title} loading="lazy" className="w-full h-auto block" />
            </Link>
          ) : (
            <Link to="/caminos/$caminoId" params={{ caminoId: it.slug! }} aria-label={it.title} className={cls}>
              {it.img ? <img src={it.img} alt={it.title} loading="lazy" className="w-full aspect-[16/9] object-cover block" /> : <div className="w-full aspect-[16/9] bg-gradient-to-br from-primary/30 to-accent-pink/30" />}
            </Link>
          )
        }
      />
      <Link to="/categorias" className="mt-3 btn-primary-gradient w-full h-[54px] rounded-[14px] flex items-center justify-center gap-2 text-[15px]">
        Ver todas las categorías <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
}
