import { useEffect, useRef, useState } from "react";
import { Star, Quote } from "lucide-react";
import avatar1 from "@/assets/community-avatar-01.png";
import avatar3 from "@/assets/community-avatar-03.png";
import avatar5 from "@/assets/community-avatar-05.png";
import avatar7 from "@/assets/community-avatar-07.png";
import avatar9 from "@/assets/community-avatar-09.png";
import avatar12 from "@/assets/community-avatar-12.png";

type Review = { name: string; place: string; text: string; img: string };

const REVIEWS: Review[] = [
  {
    name: "Marisol A.",
    place: "Guadalajara, MX",
    text: "Llevaba años repitiendo la misma historia con mi mamá. El diagnóstico me dijo por dónde venía y por primera vez entendí que no era mi culpa.",
    img: avatar1,
  },
  {
    name: "Jonathan R.",
    place: "Bogotá, CO",
    text: "Probé terapia y tres apps. Esta es la única que me dio un paso concreto cada día, de cinco minutos. Llevo 41 días seguidos.",
    img: avatar5,
  },
  {
    name: "Carla V.",
    place: "Lima, PE",
    text: "Lloré con el ejercicio del niño interior. No es contenido general, se siente escrito para lo que yo viví.",
    img: avatar3,
  },
  {
    name: "Andrés M.",
    place: "Santo Domingo, RD",
    text: "Lo que más me sirvió: aprender a decir no sin sentir culpa. Mi esposa lo notó antes que yo.",
    img: avatar7,
  },
  {
    name: "Paola G.",
    place: "Monterrey, MX",
    text: "Los audios de manifestación guiada los uso en el carro camino al trabajo. Llego distinta.",
    img: avatar9,
  },
  {
    name: "Luis Fernando C.",
    place: "Quito, EC",
    text: "Respeta mi fe, no me impone nada. Oro con mis palabras y aún así siento acompañamiento real.",
    img: avatar12,
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
      <div className="flex items-center gap-2 px-4">
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-4 w-4 fill-[#F5C77E] text-[#F5C77E]" />
          ))}
        </div>
        <p className="text-[13px] font-semibold text-muted-foreground">4,8 de 5 según quienes ya empezaron</p>
      </div>
      <h2 className="mt-2 px-4 font-display text-[26px] font-extrabold leading-tight">
        Lo que cambió para personas como tú
      </h2>

      <div
        ref={railRef}
        className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto touch-pan-x px-4 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {REVIEWS.map((r) => (
          <article
            key={r.name}
            className="min-w-[84%] snap-center rounded-[16px] border border-border bg-card p-5 shadow-soft sm:min-w-[360px]"
          >
            <div className="flex items-center gap-3">
              <img
                src={r.img}
                alt={`Foto de ${r.name}`}
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
            <div className="mt-3 flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-[#F5C77E] text-[#F5C77E]" />
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-1 flex justify-center gap-1.5">
        {REVIEWS.map((r, i) => (
          <span
            key={r.name}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
          />
        ))}
      </div>
    </section>
  );
}
