import { useEffect, useRef, useState } from "react";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMMUNITY_PORTRAITS } from "@/lib/funnel-visuals";

type Review = { name: string; place: string; text: string; img: string };

const REVIEWS: Review[] = [
  {
    name: "Marisol A.",
    place: "Guadalajara, MX",
    text: "Llevaba años repitiendo la misma historia con mi mamá. El diagnóstico me dijo por dónde venía y por primera vez entendí que no era mi culpa.",
    img: COMMUNITY_PORTRAITS[0] ?? "",
  },
  {
    name: "Jonathan R.",
    place: "Bogotá, CO",
    text: "Probé terapia y tres apps. Esta es la única que me dio un paso concreto cada día, de cinco minutos. Llevo 41 días seguidos.",
    img: COMMUNITY_PORTRAITS[1] ?? "",
  },
  {
    name: "Carla V.",
    place: "Lima, PE",
    text: "Lloré con el ejercicio del niño interior. No es contenido general, se siente escrito para lo que yo viví.",
    img: COMMUNITY_PORTRAITS[2] ?? "",
  },
  {
    name: "Andrés M.",
    place: "Santo Domingo, RD",
    text: "Lo que más me sirvió: aprender a decir no sin sentir culpa. Mi esposa lo notó antes que yo.",
    img: COMMUNITY_PORTRAITS[3] ?? "",
  },
  {
    name: "Paola G.",
    place: "Monterrey, MX",
    text: "Busco un momento de oración y reflexión antes de comenzar mi jornada.",
    img: COMMUNITY_PORTRAITS[4] ?? "",
  },
  {
    name: "Luis Fernando C.",
    place: "Quito, EC",
    text: "Respeta mi fe, no me impone nada. Oro con mis palabras y aún así siento acompañamiento real.",
    img: COMMUNITY_PORTRAITS[5] ?? "",
  },
];

export function ReviewsSlider() {
  const railRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onScroll = () => {
      const card = rail.firstElementChild as HTMLElement | null;
      if (!card) return;
      setIndex(Math.round(rail.scrollLeft / (card.offsetWidth + 12)));
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    return () => rail.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="mt-12">
      <p className="px-4 text-[13px] font-semibold text-muted-foreground">Historias y retratos ilustrativos; no son testimonios verificados.</p>
      <h2 className="mt-2 px-4 font-display text-[26px] font-extrabold leading-tight">
        Historias con las que puedes identificarte
      </h2>

      <div
        ref={railRef}
        className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto touch-pan-x px-4 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {REVIEWS.map((r) => (
          <article
            key={r.name}
            className="w-[84%] shrink-0 snap-center rounded-[16px] border border-border bg-card p-5 shadow-soft sm:w-[360px]"
          >
            <div className="flex items-center gap-3">
              <img
                src={r.img}
                alt="Retrato humano ilustrativo, generado para ORÍGEN"
                loading="lazy"
                width={96}
                height={96}
                className="h-12 w-12 shrink-0 rounded-full border-2 border-primary/25 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold">{r.name}</p>
                <p className="text-[12px] text-muted-foreground">{r.place}</p>
              </div>
              <span className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary">
                <Quote className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-[14.5px] leading-relaxed">{r.text}</p>
          </article>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" aria-label="Historias anteriores" title="Historias anteriores" className="h-11 w-11" onClick={() => railRef.current?.scrollBy({ left: -320, behavior: "smooth" })}><ChevronLeft className="h-5 w-5" /></Button>
        {REVIEWS.map((r, i) => (
          <span
            key={r.name}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
          />
        ))}
        <Button variant="outline" size="icon" aria-label="Más historias" title="Más historias" className="h-11 w-11" onClick={() => railRef.current?.scrollBy({ left: 320, behavior: "smooth" })}><ChevronRight className="h-5 w-5" /></Button>
      </div>
    </section>
  );
}
