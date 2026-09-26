import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ThreeSlider } from "@/components/ThreeSlider";
import imgMusica from "@/assets/manifesta-musica.png";
import imgPermisoMujer from "@/assets/manifesta-permiso-mujer.png";
import imgPermisoHombre from "@/assets/manifesta-permiso-hombre.png";
import imgNino from "@/assets/manifesta-nino.png";
import imgGlowMujer from "@/assets/manifesta-glowup-mujer.png";
import imgCristo from "@/assets/manifesta-cristo.png";
import imgLimpieza from "@/assets/manifesta-limpieza.png";
import imgMagnetico from "@/assets/manifesta-magnetico.png";

function Card({ img, alt }: { img: string; alt: string }) {
  return <img src={img} alt={alt} loading="lazy" className="w-full h-auto block" />;
}


const CLS =
  "block rounded-[20px] overflow-hidden shadow-soft hover:shadow-glow transition-all active:scale-[.98]";

const GRUPO_1 = [
  { key: "musica", alt: "Manifestar con música", img: imgMusica, to: "/visualiza" as const },
  { key: "permiso-mujer", alt: "Deja de pedir permiso para existir — Mujer", img: imgPermisoMujer, programa: "permiso-mujer" },
  { key: "permiso-hombre", alt: "Deja de pedir permiso para existir — Hombre", img: imgPermisoHombre, programa: "permiso-hombre" },
  { key: "nino", alt: "Sana a tu niño interior", img: imgNino, programa: "nino-interior" },
];

const GRUPO_2 = [
  { key: "glowup-mujer", alt: "Glow Up: mujer de alto valor", img: imgGlowMujer, programa: "glowup-mujer" },
  { key: "cristo", alt: "Método de Cristo 3·6·9", img: imgCristo, to: "/visualiza/cristo" as const },
  { key: "limpieza", alt: "Limpieza espiritual", img: imgLimpieza, to: "/visualiza/limpieza" as const },
  { key: "magnetico", alt: "Vuélvete magnético o magnética", img: imgMagnetico, programa: "magnetico" },
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
      <h3 className="font-display font-bold text-[19px] leading-tight">Manifiesta escuchando, no leyendo</h3>
      <p className="text-[13px] text-muted-foreground mt-1">
        Ponte los audífonos: mentor, música y un ejercicio corto guiado. Diez minutos y sigues con tu día.
      </p>
      <div className="hairline-brand mt-3 mb-3" />

      <ThreeSlider items={[...GRUPO_1, ...GRUPO_2] as Slide[]} keyOf={(s) => s.key} render={(s) => <SlideLink s={s} />} />

      <Link
        to="/visualiza"
        className="mt-3 btn-primary-gradient w-full h-[54px] rounded-[14px] flex items-center justify-center gap-2 text-[15px]"
      >
        Ver todas las categorías de manifestación <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
}
