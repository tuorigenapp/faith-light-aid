import narcisista from "@/assets/visualiza/cat-narcisista.jpg";
import arbolFamiliar from "@/assets/visualiza/cat-arbol-familiar.jpg";
import musica from "@/assets/visualiza/cat-musica.jpg";
import limpieza from "@/assets/visualiza/cat-limpieza.jpg";
import identidad from "@/assets/visualiza/cat-identidad.jpg";
import cristo from "@/assets/visualiza/cat-cristo.jpg";

export const VISUALIZA_METHOD_COVERS = { musica, limpieza, identidad, cristo };

const CATEGORY_COVERS: Record<string, string> = {
  "liberate-del-narcisista": narcisista,
  "sana-tu-arbol-familiar": arbolFamiliar,
};

/** Home and Visualiza honor the same editable cover before bundled and stored sources. */
export function visualizaCategoryCover(id: string, override: string | null | undefined, stored: string | null | undefined, fallback: string): string {
  return override || CATEGORY_COVERS[id] || stored || fallback;
}