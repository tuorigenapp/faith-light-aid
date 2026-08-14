import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Share2, Download, Sparkles, Leaf } from "lucide-react";
import { getPalabraHoy, palabraShareText, type Palabra } from "@/lib/palabra365";
import { awardLeaf } from "@/lib/gems";
import { useAuth } from "@/lib/use-auth";
import heroImg from "@/assets/camino-paisaje.png";

const APP_URL = "https://faith-light-aid.lovable.app";

export const Route = createFileRoute("/_authenticated/palabra")({
  head: () => ({
    meta: [
      { title: "Palabra del día — ORÍGEN" },
      {
        name: "description",
        content:
          "Recibe cada día una palabra, un pasaje bíblico, una reflexión y un consejo espiritual para acompañar tu camino con Dios.",
      },
      { property: "og:title", content: "Palabra del día — ORÍGEN" },
      {
        property: "og:description",
        content: "Una palabra de Dios, distinta cada día, para nutrir tu relación con Él.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PalabraPage,
});

function PalabraPage() {
  const { user } = useAuth();
  const [palabra, setPalabra] = useState<Palabra | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      const p = getPalabraHoy();
      setPalabra(p);
    } catch (e) {
      console.error(e);
      setError("No pudimos cargar la palabra de hoy. Intenta de nuevo en un momento.");
    }
  }, []);

  useEffect(() => {
    if (!palabra) return;
    const key = `palabra_leaf_${user?.id ?? "anon"}_${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    (async () => {
      const res = await awardLeaf("palabra", "medium", "Palabra del día", { day: palabra.day });
      if (res.granted > 0) {
        toast("🌿 Recibiste una hoja de sanación", {
          description: "Por abrir la palabra de hoy.",
        });
      }
    })().catch((e) => console.error(e));
  }, [palabra, user?.id]);

  const shareText = useMemo(() => (palabra ? palabraShareText(palabra) : ""), [palabra]);

  async function handleShare() {
    if (!palabra) return;
    const fullText = `${shareText}\n\n${APP_URL}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: palabra.title, text: fullText });
        return;
      }
      throw new Error("no-native-share");
    } catch {
      try {
        const clipboardText = [
          "Hola, he copiado esto desde la aplicación ORÍGEN 🕊️",
          "Te recomiendo descargarla para acompañar tu camino con Dios cada día.",
          "",
          fullText,
        ].join("\n");
        await navigator.clipboard.writeText(clipboardText);
        toast.success("Copiado al portapapeles", { description: "Ya puedes pegarlo donde quieras compartirlo." });
      } catch (e) {
        console.error(e);
        toast.error("No pudimos copiar el texto.");
      }
    }
  }

  async function handleDownload() {
    if (!palabra) return;
    setDownloading(true);
    try {
      await drawAndDownload(palabra);
    } catch (e) {
      console.error(e);
      toast.error("No pudimos generar la imagen.");
    } finally {
      setDownloading(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!palabra) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary/50" />
          <p className="text-sm text-muted-foreground">Cargando la palabra de hoy…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="relative h-56 w-full overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/20" />
        <div className="absolute inset-x-0 bottom-3 px-5">
          <div className="text-[11px] uppercase tracking-widest font-bold text-white/90 flex items-center gap-1.5 drop-shadow">
            <Sparkles className="w-3.5 h-3.5" /> Palabra del día
          </div>
        </div>
      </div>

      <div className="px-5 -mt-2 relative">
        <div className="app-card p-5">
          <h1 className="font-display font-bold text-2xl leading-snug">{palabra.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/85">{palabra.intro}</p>

          <div className="mt-5 rounded-2xl bg-brand-soft p-4">
            <p className="text-[11px] uppercase tracking-widest font-bold text-primary">{palabra.passage.reference}</p>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed font-medium">{palabra.passage.text}</p>
          </div>

          <div className="mt-5">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Reflexión</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">{palabra.reflection}</p>
          </div>

          <div className="mt-5">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Consejo espiritual</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">{palabra.advice}</p>
          </div>

          <div className="mt-6 text-center">
            <p className="font-display font-semibold text-sm text-primary">{palabra.closing}</p>
            <p className="mt-1 text-xs text-muted-foreground italic">
              (Comparte, que se difunda la Palabra de Hoy)
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleShare}
              className="btn-primary-gradient flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
            >
              <Share2 className="w-4 h-4" /> Compartir
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              <Download className="w-4 h-4" /> {downloading ? "Generando…" : "Descargar la palabra de hoy"}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Leaf className="w-3.5 h-3.5 text-primary" /> Ganaste una hoja de sanación al abrir esta palabra hoy.
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (para.trim() === "") {
      lines.push("");
      continue;
    }
    const words = para.split(" ");
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

async function drawAndDownload(palabra: Palabra) {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#1c1730");
  bg.addColorStop(0.5, "#2c2350");
  bg.addColorStop(1, "#150f28");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Soft glow accents
  ctx.save();
  const glow = ctx.createRadialGradient(width / 2, 220, 40, width / 2, 220, 520);
  glow.addColorStop(0, "rgba(255,210,140,0.35)");
  glow.addColorStop(1, "rgba(255,210,140,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, 700);
  ctx.restore();

  const marginX = 90;
  const maxWidth = width - marginX * 2;
  let y = 180;

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "600 34px 'Trebuchet MS', sans-serif";
  ctx.fillText("✨ ORÍGEN — Palabra del día", width / 2, y);
  y += 90;

  ctx.font = "700 56px Georgia, 'Times New Roman', serif";
  ctx.fillStyle = "#ffffff";
  const titleLines = wrapText(ctx, palabra.title, maxWidth);
  for (const line of titleLines) {
    ctx.fillText(line, width / 2, y);
    y += 66;
  }
  y += 30;

  ctx.font = "italic 500 32px Georgia, serif";
  ctx.fillStyle = "rgba(255,210,140,0.95)";
  ctx.fillText(palabra.passage.reference, width / 2, y);
  y += 60;

  ctx.textAlign = "left";
  ctx.font = "500 34px Georgia, serif";
  ctx.fillStyle = "#f5f0ff";
  const passageLines = wrapText(ctx, palabra.passage.text, maxWidth);
  for (const line of passageLines) {
    if (line === "") { y += 26; continue; }
    ctx.fillText(line, marginX, y);
    y += 46;
  }
  y += 50;

  ctx.font = "700 30px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(255,210,140,0.95)";
  ctx.fillText("Reflexión", marginX, y);
  y += 48;

  ctx.font = "400 28px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const reflectionLines = wrapText(ctx, palabra.reflection, maxWidth);
  for (const line of reflectionLines) {
    if (y > height - 420) break;
    ctx.fillText(line, marginX, y);
    y += 40;
  }
  y += 40;

  ctx.font = "700 30px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(255,210,140,0.95)";
  ctx.fillText("Consejo espiritual", marginX, y);
  y += 48;

  ctx.font = "400 28px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const adviceLines = wrapText(ctx, palabra.advice, maxWidth);
  for (const line of adviceLines) {
    if (y > height - 220) break;
    ctx.fillText(line, marginX, y);
    y += 40;
  }

  ctx.textAlign = "center";
  ctx.font = "700 34px Georgia, serif";
  ctx.fillStyle = "#ffd28c";
  ctx.fillText(palabra.closing, width / 2, height - 130);

  ctx.font = "italic 400 24px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("(Comparte, que se difunda la Palabra de Hoy)", width / 2, height - 90);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("no blob");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `origen-palabra-dia-${palabra.day}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
