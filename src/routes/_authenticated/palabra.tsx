import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Share2, Download, Sparkles, Leaf, Check, X, Image as ImageIcon } from "lucide-react";
import { getPalabraHoy, palabraShareText, type Palabra } from "@/lib/palabra365";
import {
  APP_URL,
  PALABRA_BACKGROUNDS,
  backgroundForDay,
  palabraBlocks,
  palabraQuiz,
  shareTargets,
} from "@/lib/palabra-extras";
import { awardLeaf } from "@/lib/gems";
import { appDayKey } from "@/lib/app-day";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SatisfactionRating } from "@/components/SatisfactionRating";
import { celebrate } from "@/lib/celebrate";

export const Route = createFileRoute("/_authenticated/palabra")({
  head: () => ({
    meta: [
      { title: "Palabra del día — ORÍGEN" },
      {
        name: "description",
        content:
          "Cada día una enseñanza, un pasaje, reflexión para ti y tu familia, quiz e imagen descargable para compartir.",
      },
      { property: "og:title", content: "Palabra del día — ORÍGEN" },
      {
        property: "og:description",
        content: "Una palabra de Dios, distinta cada día, para nutrir tu relación con Él.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PalabraPage,
});

function PalabraPage() {
  const { user } = useAuth();
  const [palabra, setPalabra] = useState<Palabra | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizRewarded, setQuizRewarded] = useState(false);

  useEffect(() => {
    try {
      const p = getPalabraHoy();
      setPalabra(p);
      setBgIndex((p.day - 1) % PALABRA_BACKGROUNDS.length);
    } catch (e) {
      console.error(e);
      setError("No pudimos cargar la palabra de hoy. Intenta de nuevo en un momento.");
    }
  }, []);

  // Hoja del día por abrir la palabra + registro para "Primeros pasos"
  useEffect(() => {
    if (!palabra || !user) return;
    const key = `palabra_leaf_${user.id}_${appDayKey()}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    (async () => {
      await supabase.from("daily_activity").insert({
        user_id: user.id,
        activity_date: appDayKey(),
        activity_type: "palabra",
        reference_id: String(palabra.day),
      });
      const res = await awardLeaf("palabra", "medium", "Palabra del día", { day: palabra.day });
      if (res.granted > 0) toast("🌿 Sumaste progreso de hoja por abrir la palabra de hoy.");
    })().catch((e) => console.error(e));
  }, [palabra, user]);

  const blocks = useMemo(() => (palabra ? palabraBlocks(palabra) : []), [palabra]);
  const quiz = useMemo(() => (palabra ? palabraQuiz(palabra) : []), [palabra]);
  const shareText = useMemo(() => (palabra ? palabraShareText(palabra) : ""), [palabra]);
  const correctCount = quiz.filter((q, i) => answers[i] === q.correct).length;
  const quizDone = Object.keys(answers).length === quiz.length && quiz.length > 0;

  useEffect(() => {
    if (!quizDone || quizRewarded || !palabra) return;
    setQuizRewarded(true);
    (async () => {
      const res = await awardLeaf("palabra-quiz", "medium", "Quiz Para pensar", {
        day: palabra.day,
        aciertos: correctCount,
      });
      if (correctCount === quiz.length) celebrate(1200);
      toast(
        correctCount === quiz.length
          ? "¡Las tres correctas! 🌿 Sumaste progreso de hoja."
          : `${correctCount} de ${quiz.length} correctas. Lo importante es que lo pensaste.`,
        { description: res.granted > 0 ? "Progreso de hoja acreditado." : undefined },
      );
    })().catch((e) => console.error(e));
  }, [quizDone, quizRewarded, correctCount, quiz.length, palabra]);

  async function handleShare(target: ReturnType<typeof shareTargets>[number]) {
    if (!palabra) return;
    const fullText = `${shareText}\n\nORÍGEN · ${APP_URL}`;
    if (target.copy) {
      try {
        await navigator.clipboard.writeText(fullText);
        toast.success("Copiado", { description: "Pégalo donde quieras compartirlo." });
      } catch {
        toast.error("No pudimos copiar el texto.");
      }
    } else if (target.href) {
      window.open(target.href, "_blank", "noopener,noreferrer");
    }
    setShareOpen(false);
  }

  async function nativeShare() {
    if (!palabra) return;
    const fullText = `${shareText}\n\nORÍGEN · ${APP_URL}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: palabra.title, text: fullText });
        return;
      } catch {
        /* usuario canceló */
      }
    }
    setShareOpen(true);
  }

  async function handleDownload() {
    if (!palabra) return;
    setDownloading(true);
    try {
      await drawWallpaper(palabra, PALABRA_BACKGROUNDS[bgIndex]!);
      toast.success("Imagen descargada", { description: "Ya puedes ponerla de fondo o compartirla." });
    } catch (e) {
      console.error(e);
      toast.error("No pudimos generar la imagen.");
    } finally {
      setDownloading(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-dvh grid place-items-center p-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary-gradient mt-4 min-h-11 rounded-full px-6 text-sm font-semibold"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!palabra) {
    return (
      <div className="min-h-dvh bg-background px-5 pt-8">
        <div className="h-56 w-full animate-pulse rounded-[16px] bg-secondary" />
        <div className="mt-4 h-6 w-2/3 animate-pulse rounded-full bg-secondary" />
        <div className="mt-3 h-24 w-full animate-pulse rounded-[16px] bg-secondary" />
        <div className="mt-3 h-40 w-full animate-pulse rounded-[16px] bg-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-28">
      {/* Héroe con el fondo del día */}
      <div className="relative h-64 w-full overflow-hidden">
        <img
          src={backgroundForDay(palabra.day)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          width={1080}
          height={1920}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-4 px-5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80">
            <Sparkles className="h-3.5 w-3.5" /> Palabra del día · Día {palabra.day}
          </div>
          <h1 className="mt-1 font-display text-[28px] font-extrabold leading-[1.15]">{palabra.title}</h1>
        </div>
      </div>

      <div className="space-y-3 px-5 pt-4">
        {/* Pasaje */}
        <section className="rounded-[16px] bg-brand-soft p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{palabra.passage.reference}</p>
          <p className="mt-2 whitespace-pre-line text-[15px] font-medium leading-relaxed">{palabra.passage.text}</p>
        </section>

        {/* Bloques narrados con emoji 3D */}
        {blocks.map((b) => (
          <section key={b.key} className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-2xl">{b.emoji}</span>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{b.label}</p>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{b.text}</p>
          </section>
        ))}

        {/* Quiz Para pensar */}
        <section className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-2xl">🧠</span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Para pensar</p>
              <p className="text-[13px] text-muted-foreground">3 preguntas sobre la palabra de hoy</p>
            </div>
          </div>

          <div className="mt-4 space-y-5">
            {quiz.map((q, qi) => {
              const chosen = answers[qi];
              return (
                <div key={qi}>
                  <p className="text-[15px] font-semibold leading-snug">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="mt-2 space-y-2">
                    {q.options.map((opt, oi) => {
                      const isChosen = chosen === oi;
                      const isCorrect = oi === q.correct;
                      const answered = chosen !== undefined;
                      const state = !answered
                        ? "border border-border/60 bg-background"
                        : isCorrect
                          ? "border-2 border-emerald-500 bg-emerald-500/10"
                          : isChosen
                            ? "border-2 border-destructive bg-destructive/10"
                            : "border border-border/40 bg-background opacity-60";
                      return (
                        <button
                          key={oi}
                          disabled={answered}
                          onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                          className={`flex w-full min-h-11 items-center justify-between gap-3 rounded-[10px] px-4 py-3 text-left text-sm font-medium transition active:scale-[.99] ${state}`}
                        >
                          <span>{opt}</span>
                          {answered && isCorrect && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                          {answered && isChosen && !isCorrect && <X className="h-4 w-4 shrink-0 text-destructive" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {quizDone && (
            <p className="mt-4 rounded-[10px] bg-primary/5 p-3 text-center text-sm font-semibold text-primary">
              {correctCount} de {quiz.length} correctas · progreso de hoja acreditado
            </p>
          )}
        </section>

        {/* Descargar imprimible */}
        <section className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-primary">
              <ImageIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-[17px] font-bold">Descarga tu fondo de pantalla</p>
              <p className="text-[13px] text-muted-foreground">Elige uno de los 10 fondos</p>
            </div>
          </div>

          <div className="-mx-5 mt-4 flex gap-3 overflow-x-auto px-5 pb-2">
            {PALABRA_BACKGROUNDS.map((src, i) => (
              <button
                key={i}
                onClick={() => setBgIndex(i)}
                aria-label={`Fondo ${i + 1}`}
                className={`shrink-0 overflow-hidden rounded-[12px] transition ${
                  i === bgIndex ? "border-2 border-primary" : "border border-border/60 opacity-80"
                }`}
              >
                <img src={src} alt="" loading="lazy" className="h-24 w-14 object-cover" width={1080} height={1920} />
              </button>
            ))}
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary-gradient mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> {downloading ? "Generando…" : "Descargar la palabra de hoy"}
          </button>
          <button
            onClick={nativeShare}
            className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary/10 text-sm font-semibold text-primary"
          >
            <Share2 className="h-4 w-4" /> Compartir en redes
          </button>
        </section>

        <div className="flex items-center justify-center gap-1.5 pt-1 text-[12px] text-muted-foreground">
          <Leaf className="h-3.5 w-3.5 text-primary" /> {palabra.closing}
        </div>

        <SatisfactionRating section="palabra" question="¿Te sirvió la palabra de hoy?" />
      </div>

      {/* Menú de compartir */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/40" onClick={() => setShareOpen(false)}>
          <div
            className="w-full rounded-t-[20px] bg-card p-5 shadow-elevated animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center font-display text-[17px] font-bold">Compartir la Palabra de hoy</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {shareTargets(shareText).map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleShare(t)}
                  className="flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-[12px] border border-border/60 bg-background px-2 text-[12px] font-semibold"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                    <Share2 className="h-4 w-4" />
                  </span>
                  {t.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShareOpen(false)} className="mt-4 min-h-11 w-full text-sm font-medium text-muted-foreground">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Imprimible ---------------- */

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

async function drawWallpaper(palabra: Palabra, bgSrc: string) {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");

  const img = await loadImage(bgSrc);
  // cubrir toda la página sin cortar contenido
  const scale = Math.max(width / img.width, height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);

  // velo con degradado para que TODO se lea
  const veil = ctx.createLinearGradient(0, 0, 0, height);
  veil.addColorStop(0, "rgba(18,14,32,0.72)");
  veil.addColorStop(0.45, "rgba(18,14,32,0.58)");
  veil.addColorStop(1, "rgba(18,14,32,0.80)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, width, height);

  const marginX = 96;
  const maxWidth = width - marginX * 2;
  ctx.textAlign = "center";

  let y = 210;
  ctx.font = "700 32px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("🕊️  ORÍGEN · PALABRA DEL DÍA", width / 2, y);

  y += 96;
  ctx.font = "700 60px Georgia, serif";
  ctx.fillStyle = "#ffffff";
  for (const line of wrapText(ctx, palabra.title, maxWidth)) {
    ctx.fillText(line, width / 2, y);
    y += 70;
  }

  y += 34;
  ctx.font = "italic 600 34px Georgia, serif";
  ctx.fillStyle = "#F5C77E";
  ctx.fillText(palabra.passage.reference, width / 2, y);

  y += 66;
  ctx.font = "500 36px Georgia, serif";
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  for (const line of wrapText(ctx, palabra.passage.text, maxWidth)) {
    if (line === "") {
      y += 24;
      continue;
    }
    if (y > height - 620) break;
    ctx.fillText(line, width / 2, y);
    y += 50;
  }

  y += 52;
  ctx.font = "700 30px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#F5C77E";
  ctx.fillText("CONSEJO ESPIRITUAL", width / 2, y);

  y += 52;
  ctx.font = "400 30px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  for (const line of wrapText(ctx, palabra.advice, maxWidth)) {
    if (y > height - 260) break;
    ctx.fillText(line, width / 2, y);
    y += 44;
  }

  ctx.font = "700 34px Georgia, serif";
  ctx.fillStyle = "#F5C77E";
  ctx.fillText("ORÍGEN", width / 2, height - 150);
  ctx.font = "400 26px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText(APP_URL.replace("https://", ""), width / 2, height - 106);

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
