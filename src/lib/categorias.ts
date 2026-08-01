import bNino from "@/assets/banner-nino.png.asset.json";
import bGlowHombre from "@/assets/banner-glow-hombre.png.asset.json";
import bGlowMujer from "@/assets/banner-glow-mujer.png.asset.json";
import bPermiso from "@/assets/banner-permiso.png.asset.json";
import bMagnetico from "@/assets/banner-magnetico.png.asset.json";

export type Categoria = {
  id: string;
  programaId: string;
  title: string;
  hook: string;
  banner: string;
  /** base para el contador social (se estabiliza por día) */
  base: number;
};

export const CATEGORIAS: Categoria[] = [
  {
    id: "nino-interior",
    programaId: "nino-interior",
    title: "Sanar al niño o niña interior",
    hook: "ya descubrieron a quién estaban esperando",
    banner: bNino.url,
    base: 1284,
  },
  {
    id: "glowup-mujer",
    programaId: "glowup-mujer",
    title: "Glow Up Mujer",
    hook: "ya empezaron su glow up real",
    banner: bGlowMujer.url,
    base: 2071,
  },
  {
    id: "glowup-hombre",
    programaId: "glowup-hombre",
    title: "Glow Up Hombre",
    hook: "hombres ya trabajan su carácter",
    banner: bGlowHombre.url,
    base: 942,
  },
  {
    id: "magnetico",
    programaId: "magnetico",
    title: "Vuélvete Magnético/a",
    hook: "dejaron de perseguir y empezaron a elegir",
    banner: bMagnetico.url,
    base: 1657,
  },
  {
    id: "permiso",
    programaId: "permiso-mujer",
    title: "Deja de pedir permiso",
    hook: "ya dijeron su primer no sin culpa",
    banner: bPermiso.url,
    base: 1329,
  },
];

/** Contador estable por día (sin Math.random en módulo, seguro para SSR). */
export function watching(cat: Categoria) {
  const day = Math.floor(Date.now() / 86400000);
  const hour = new Date().getHours();
  return {
    now: 12 + ((cat.base + day * 7 + hour * 3) % 78),
    total: cat.base + (day % 60) * 13,
  };
}

export function getCategoria(id: string) {
  return CATEGORIAS.find((c) => c.id === id) ?? null;
}
