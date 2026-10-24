import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, HeartHandshake, MessageCircleHeart, Network, BookOpen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import consultaMentora from "@/assets/consultas/consulta-mentora.jpg";
import consultaPareja from "@/assets/consultas/consulta-pareja.jpg";
import consultaPatrones from "@/assets/consultas/consulta-patrones.jpg";
import consultaMinistracion from "@/assets/consultas/consulta-ministracion.jpg";
import consultaArbol from "@/assets/consultas/consulta-arbol.jpg";

export const Route = createFileRoute("/_authenticated/consultas")({
  head: () => ({
    meta: [
      { title: "Todas las consultas — ORÍGEN" },
      { name: "description", content: "Todas las consultas de ORÍGEN en un solo lugar: mentora, pareja, patrones familiares, palabra de Dios y las consultas creadas para ti." },
      { property: "og:title", content: "Todas las consultas — ORÍGEN" },
      { property: "og:description", content: "Elige la consulta que tu corazón necesita hoy y recibe tu respuesta personalizada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultasPage,
});

type ConsultaCard = {
  key: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  to: string;
  slug?: string;
};

const BUILTIN: ConsultaCard[] = [
  { key: "mentora", title: "Conversa con Ruth Esther", subtitle: "Tu mentora espiritual te escucha.", tag: "Mentora", image: consultaMentora, to: "/chat" },
  { key: "pareja", title: "¿Deuda o propósito?", subtitle: "Consulta profunda de pareja.", tag: "Pareja", image: consultaPareja, to: "/pareja" },
  { key: "patrones", title: "Patrones familiares", subtitle: "Mira qué se repite en tu historia.", tag: "Consulta", image: consultaPatrones, to: "/patrones" },
  { key: "ministracion", title: "Dios te dice hoy", subtitle: "Una palabra para tu corazón.", tag: "Palabra", image: consultaMinistracion, to: "/ministracion" },
];

/** Portadas locales con texto para consultas conocidas (respaldo si la portada guardada caduca). */
const LOCAL_COVERS: Record<string, string> = {
  "sana-tu-arbol-familiar-encuentra-el-origen-8en3p": consultaArbol,
};

function ConsultasPage() {
  const { data: custom, isLoading } = useQuery({
    queryKey: ["todas-las-consultas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("custom_consultas")
        .select("id, slug, title, subtitle, cover_url")
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const customCards: ConsultaCard[] = (custom ?? []).map((c) => ({
    key: c.id,
    title: c.title,
    subtitle: c.subtitle || "Tu respuesta personalizada te espera.",
    tag: "Consulta",
    image: LOCAL_COVERS[c.slug] || c.cover_url || consultaPatrones,
    to: "/consulta/$slug",
    slug: c.slug,
  }));

  const cards = [...BUILTIN, ...customCards];

  return (
    <div className="min-h-dvh bg-aura-top">
      <div className="mx-auto max-w-[1120px] px-5 pt-6 pb-28">
        <section className="border-b border-border pb-6">
          <div className="flex items-start gap-3">
            <span className="w-12 h-12 rounded-[14px] bg-primary/10 grid place-items-center text-primary shrink-0">
              <MessageCircleHeart className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Consultas ORÍGEN</p>
              <h1 className="font-display font-extrabold text-[30px] leading-[1.12] mt-1">Todas las consultas</h1>
              <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
                Elige la consulta que tu corazón necesita hoy. Cada una te entrega una respuesta personalizada, con PDF para guardar.
              </p>
            </div>
          </div>
        </section>

        {isLoading ? (
          <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-[16px] bg-muted animate-pulse" />
            ))}
          </section>
        ) : (
          <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((c, i) => (
              <ConsultaCardView key={c.key} card={c} index={i} />
            ))}
          </section>
        )}

        <section className="mt-8 rounded-[20px] border border-border bg-card/70 p-5 flex items-center gap-4">
          <span className="w-11 h-11 rounded-[12px] bg-primary/10 grid place-items-center text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <p className="text-[13px] leading-snug text-muted-foreground">
            <span className="font-bold text-foreground">Cada consulta es única:</span> Ruth Esther prepara tu respuesta según tu historia, tu fecha y lo que hoy quieres sanar.
          </p>
        </section>
      </div>
    </div>
  );
}

function ConsultaCardView({ card, index }: { card: ConsultaCard; index: number }) {
  const inner = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={card.image}
          alt={`Portada de ${card.title}`}
          loading="lazy"
          width={1024}
          height={1280}
          className="h-full w-full object-cover transition group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-[10px] bg-background/85 backdrop-blur px-2.5 py-1 text-[10.5px] font-black text-primary">
          {card.tag === "Mentora" ? <MessageCircleHeart className="w-3 h-3" /> : card.tag === "Pareja" ? <HeartHandshake className="w-3 h-3" /> : card.tag === "Palabra" ? <BookOpen className="w-3 h-3" /> : <Network className="w-3 h-3" />}
          {card.tag}
        </span>
      </div>
      <div className="p-4">
        <h2 className="font-display font-bold text-[16px] leading-tight">{card.title}</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground line-clamp-2">{card.subtitle}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-primary">
          Abrir consulta <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </>
  );

  const cls = "group overflow-hidden rounded-[16px] bg-card border border-border shadow-soft active:scale-[.99] transition block";

  if (card.slug) {
    return (
      <Link to="/consulta/$slug" params={{ slug: card.slug }} className={cls} style={{ animation: `fade-in .4s ease-out ${index * 60}ms both` }}>
        {inner}
      </Link>
    );
  }
  return (
    <Link to={card.to} className={cls} style={{ animation: `fade-in .4s ease-out ${index * 60}ms both` }}>
      {inner}
    </Link>
  );
}
