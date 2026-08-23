/** Videos guía de YouTube (música/oración para acompañar la lección). */
const VIDEOS = [
  "n_wERpnvzTo", // Música cristiana instrumental para orar
  "1H4tS8cW4rE",
  "2X3z-b0RjM8",
  "Hs4mdxIfSl4",
  "dQY0lBRvQEo",
  "1ZYbU82GVz4",
  "4-043COFhwo",
  "JyPZFYq3Ss4",
];

/** Devuelve un id de video estable según la posición de la etapa. */
export function videoForStage(position: number) {
  return VIDEOS[(Math.max(1, position) - 1) % VIDEOS.length]!;
}
