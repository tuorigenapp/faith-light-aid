/**
 * Genera la imagen 1080x1920 de la Palabra del día: fondo elegido + velo
 * de degradado + todo el contenido (tema, pasaje, enseñanza, reflexión para
 * ti y para tu familia) con auto-ajuste de tamaño para que nada se corte.
 */
import type { Palabra } from "@/lib/palabra365";
import type { PalabraBlock } from "@/lib/palabra-extras";

const WIDTH = 1080;
const HEIGHT = 1920;
const SEAL = "tuorigen.app";

type Section = { kind: "title"; text: string } | { kind: "ref"; text: string } | { kind: "body"; heading?: string; text: string };

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of para.split(" ")) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else current = test;
    }
    if (current) lines.push(current);
  }
  return lines;
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function buildSections(palabra: Palabra, blocks: PalabraBlock[]): Section[] {
  const ense = blocks.find((b) => b.key === "ensenanza");
  const refl = blocks.find((b) => b.key === "reflexion");
  const fam = blocks.find((b) => b.key === "familia");
  const sections: Section[] = [
    { kind: "title", text: palabra.title },
    { kind: "ref", text: palabra.passage.reference },
    { kind: "body", text: palabra.passage.text },
  ];
  if (ense) sections.push({ kind: "body", heading: "ENSEÑANZA DE HOY", text: ense.text });
  if (refl) sections.push({ kind: "body", heading: "REFLEXIÓN PARA TI", text: refl.text });
  if (fam) sections.push({ kind: "body", heading: "REFLEXIÓN PARA TU FAMILIA", text: fam.text });
  return sections;
}

/** Mide la altura total del contenido con un factor de escala dado. */
function measure(ctx: CanvasRenderingContext2D, sections: Section[], maxWidth: number, scale: number) {
  let total = 0;
  const headerSize = Math.round(32 * scale);
  total += headerSize + Math.round(64 * scale); // header + gap

  for (const s of sections) {
    if (s.kind === "title") {
      ctx.font = `700 ${Math.round(58 * scale)}px Georgia, serif`;
      const lines = wrapText(ctx, s.text, maxWidth);
      total += lines.length * Math.round(66 * scale) + Math.round(30 * scale);
    } else if (s.kind === "ref") {
      total += Math.round(58 * scale);
    } else {
      if (s.heading) total += Math.round(46 * scale) + Math.round(14 * scale);
      ctx.font = `500 ${Math.round(32 * scale)}px Georgia, serif`;
      const lines = wrapText(ctx, s.text, maxWidth);
      total += lines.reduce((acc, l) => acc + (l === "" ? Math.round(18 * scale) : Math.round(42 * scale)), 0);
      total += Math.round(34 * scale); // gap after section
    }
  }
  return total;
}

export async function generatePalabraWallpaper(
  palabra: Palabra,
  blocks: PalabraBlock[],
  bgSrc: string,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");

  const img = await loadImage(bgSrc);
  const cover = Math.max(WIDTH / img.width, HEIGHT / img.height);
  const w = img.width * cover;
  const h = img.height * cover;
  ctx.drawImage(img, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);

  const veil = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  veil.addColorStop(0, "rgba(15,12,26,0.74)");
  veil.addColorStop(0.4, "rgba(15,12,26,0.58)");
  veil.addColorStop(1, "rgba(15,12,26,0.84)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const marginX = 96;
  const maxWidth = WIDTH - marginX * 2;
  const topMargin = 130;
  const footerHeight = 190;
  const availableHeight = HEIGHT - topMargin - footerHeight;

  const sections = buildSections(palabra, blocks);

  // Auto-ajuste: bajamos la escala hasta que quepa todo, con piso razonable.
  ctx.textAlign = "center";
  let scale = 1;
  while (scale > 0.5 && measure(ctx, sections, maxWidth, scale) > availableHeight) {
    scale -= 0.05;
  }

  let y = topMargin;
  ctx.font = `700 ${Math.round(32 * scale)}px 'Trebuchet MS', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("🕊️  ORÍGEN · PALABRA DEL DÍA", WIDTH / 2, y);
  y += Math.round(64 * scale);

  for (const s of sections) {
    if (s.kind === "title") {
      ctx.font = `700 ${Math.round(58 * scale)}px Georgia, serif`;
      ctx.fillStyle = "#ffffff";
      const lines = wrapText(ctx, s.text, maxWidth);
      for (const line of lines) {
        ctx.fillText(line, WIDTH / 2, y);
        y += Math.round(66 * scale);
      }
      y += Math.round(30 * scale);
    } else if (s.kind === "ref") {
      ctx.font = `italic 600 ${Math.round(34 * scale)}px Georgia, serif`;
      ctx.fillStyle = "#F5C77E";
      ctx.fillText(s.text, WIDTH / 2, y);
      y += Math.round(58 * scale);
    } else {
      if (s.heading) {
        ctx.font = `700 ${Math.round(30 * scale)}px 'Trebuchet MS', sans-serif`;
        ctx.fillStyle = "#F5C77E";
        ctx.fillText(s.heading, WIDTH / 2, y);
        y += Math.round(46 * scale) + Math.round(14 * scale);
      }
      ctx.font = `500 ${Math.round(32 * scale)}px Georgia, serif`;
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      const lines = wrapText(ctx, s.text, maxWidth);
      for (const line of lines) {
        if (line === "") {
          y += Math.round(18 * scale);
          continue;
        }
        ctx.fillText(line, WIDTH / 2, y);
        y += Math.round(42 * scale);
      }
      y += Math.round(34 * scale);
    }
  }

  ctx.font = "700 34px Georgia, serif";
  ctx.fillStyle = "#F5C77E";
  ctx.fillText("ORÍGEN", WIDTH / 2, HEIGHT - 150);
  ctx.font = "400 26px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(SEAL, WIDTH / 2, HEIGHT - 106);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("no blob");
  return blob;
}

export async function downloadPalabraWallpaper(palabra: Palabra, blocks: PalabraBlock[], bgSrc: string) {
  const blob = await generatePalabraWallpaper(palabra, blocks, bgSrc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `origen-palabra-dia-${palabra.day}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function blobToShareFile(blob: Blob, day: number) {
  return new File([blob], `origen-palabra-dia-${day}.png`, { type: "image/png" });
}
