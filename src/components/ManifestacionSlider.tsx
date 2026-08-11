import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import imgMusica from "@/assets/manifesta-musica.png.asset.json";
import imgPermisoMujer from "@/assets/manifesta-permiso-mujer.png.asset.json";
import imgPermisoHombre from "@/assets/manifesta-permiso-hombre.png.asset.json";
import imgNino from "@/assets/manifesta-nino.png.asset.json";
import imgGlowMujer from "@/assets/manifesta-glowup-mujer.png.asset.json";
import imgCristo from "@/assets/manifesta-cristo.png.asset.json";
import imgLimpieza from "@/assets/manifesta-limpieza.png.asset.json";
import imgMagnetico from "@/assets/manifesta-magnetico.png.asset.json";

function Card({ img, alt }: { img: string; alt: string }) {
  return <img src={img} alt={alt} loading="lazy" className="w-full h-auto block" />;
}


const CLS =
  "block rounded-[20px] overflow-hidden shadow-soft hover:shadow-glow transition-all active:scale-[.98]";

const GRUPO_1 = [
  { key: "musica", alt: "Manifestar con música", img: imgMusica.url, to: "/visualiza" as const },
  { key: "permiso-mujer", alt: "Deja de pedir permiso para existir — Mujer", img: imgPermisoMujer.url, camino: "permiso" },
  { key: "permiso-hombre", alt: "Deja de pedir permiso para existir — Hombre", img: imgPermisoHombre.url, programa: "permiso-hombre" },
  { key: "nino", alt: "Sana a tu niño interior", img: imgNino.url, camino: "nino-interior" },
];

const GRUPO_2 = [
  { key: "glowup-mujer", alt: "Glow Up: mujer de alto valor", img: imgGlowMujer.url, camino: "glowup-mujer" },
  { key: "cristo", alt: "Método de Cristo 3·6·9", img: imgCristo.url, to: "/visualiza/cristo" as const },
  { key: "limpieza", alt: "Limpieza espiritual", img: imgLimpieza.url, to: "/visualiza/limpieza" as const },
  { key: "magnetico", alt: "Vuélvete magnético o magnética", img: imgMagnetico.url, camino: "magnetico" },
];

type Slide = (typeof GRUPO_1)[number] & { camino?: string; programa?: string; to?: string };

function SlideLink({ s }: { s: Slide }) {
  const inner = <Card img={s.img} alt={s.alt} />;
  if (s.camino) {
    return (
      <Link to="/caminos/$caminoId" params={{ caminoId: s.camino }} aria-label={s.alt} className={CLS}>
        {inner}
      </Link>
    );
  }
  if (s.programa) {
    return (
      <Link to="/programas/$programaId" params={{ programaId: s.programa }} aria-label={s.alt} className={CLS}>
        {inner}
      </Link>
    );
  }
  return (
    <Link to={(s.to ?? "/visualiza") as "/visualiza"} aria-label={s.alt} className={CLS}>
      {inner}
    </Link>
  );
}

/** Slider de manifestación: 4 imágenes por pantalla, una debajo de la otra. */
export function ManifestacionSlider() {
  return (
    <section>
      <h3 className="font-display font-bold text-[16px] leading-snug">
        Wow 🥳 Ahora es posible manifestar con un Mentor Espiritual + Música + Ejercicios + Materiales de apoyo
      </h3>
      <p className="text-[13px] text-muted-foreground mt-1">
        Entra a cualquiera de estas secciones si no tienes tiempo para hacer las etapas cada día.
      </p>
      <div className="hairline-brand mt-3 mb-3" />

      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        <ul className="flex gap-4">
          {[GRUPO_1, GRUPO_2].map((grupo, gi) => (
            <li key={gi} className="w-[calc(100vw-2rem)] max-w-[520px] lg:w-[460px] shrink-0 snap-center space-y-4">
              {(grupo as Slide[]).map((s, i) => (
                <div key={s.key} style={{ animation: `fade-in .4s ease-out ${(gi * 4 + i) * 60}ms both` }}>
                  <SlideLink s={s} />
                </div>
              ))}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Desliza para ver más
      </p>

      <Link
        to="/visualiza"
        className="mt-3 btn-primary-gradient w-full h-[54px] rounded-[14px] flex items-center justify-center gap-2 text-[15px] animate-pulse-soft"
      >
        Ver todas las categorías de manifestación <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
}
