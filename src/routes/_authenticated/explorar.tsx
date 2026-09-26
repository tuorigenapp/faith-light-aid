import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, Search, Sparkles } from "lucide-react";
import { EXPLORE_ITEMS, exploreKey } from "@/lib/explore-content";
import { useContentOverrides } from "@/hooks/use-content-overrides";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/explorar")({
  head: () => ({
    meta: [
      { title: "Explorar ORÍGEN — Todo el contenido" },
      { name: "description", content: "Encuentra todas las secciones, programas, consultas, ejercicios y premios disponibles dentro de ORÍGEN." },
      { property: "og:title", content: "Explorar ORÍGEN" },
      { property: "og:description", content: "Todo el contenido de ORÍGEN organizado con imágenes, accesos y candados según tu plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorarPage,
});

function ExplorarPage() {
  const ov = useContentOverrides();
  const items = EXPLORE_ITEMS.filter((i) => !ov.get(exploreKey(i.title))?.is_hidden).map((i) => {
    const o = ov.get(exploreKey(i.title));
    return { ...i, title: o?.title || i.title, image: o?.cover_url || i.image };
  });
  return (
    <div className="min-h-dvh bg-aura-top">
      <div className="mx-auto max-w-[1120px] px-5 pt-6 pb-28">
        <section className="app-card p-5">
          <div className="flex items-start gap-3">
            <span className="w-12 h-12 rounded-[14px] bg-primary/10 grid place-items-center text-primary shrink-0">
              <Search className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Explora</p>
              <h1 className="font-display font-extrabold text-[30px] leading-[1.12] mt-1">Todo el contenido de ORÍGEN</h1>
              <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">Tus consultas, caminos, ejercicios, premios y herramientas en un solo lugar.</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <ExploreCard key={`${item.title}-${item.to}`} item={item} />
          ))}
        </section>
      </div>
    </div>
  );
}

function ExploreCard({ item }: { item: (typeof EXPLORE_ITEMS)[number] }) {
  return (
    <Link
      to={item.locked ? "/membresia" : item.to}
      className={cn("group overflow-hidden rounded-[16px] bg-card border border-border shadow-soft active:scale-[.99] transition", item.locked && "relative")}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={item.image} alt={item.title} loading="lazy" className={cn("h-full w-full object-cover transition group-hover:scale-[1.03]", item.locked && "opacity-55")} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-[10px] bg-background/85 backdrop-blur px-2.5 py-1 text-[10.5px] font-black text-primary">
          {item.locked ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />} {item.tag}
        </span>
      </div>
      <div className="p-4">
        <h2 className="font-display font-bold text-[16px] leading-tight">{item.title}</h2>
        <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{item.description}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-primary">
          {item.locked ? "Desbloquear" : "Abrir"} <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}
