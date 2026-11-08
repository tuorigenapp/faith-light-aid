import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { X, Volume2, Square, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { getMomento, lecturaFor, markDone, speak, stopSpeaking } from "@/lib/oraciones-dia";

export const Route = createFileRoute("/_authenticated/palabra_/$momento")({
  head: () => ({
    meta: [
      { title: "Oración y meditación — ORÍGEN" },
      { name: "description", content: "Una oración o versículo para este momento del día, con meditación y lectura en voz alta." },
      { property: "og:title", content: "Oración y meditación — ORÍGEN" },
      { property: "og:description", content: "Detente un minuto y escucha la palabra de Dios para este momento." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MomentoPage,
});

function MomentoPage() {
  const { momento } = Route.useParams();
  const navigate = useNavigate();
  const m = getMomento(momento);
  const [now, setNow] = useState<Date | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => { setNow(new Date()); return () => stopSpeaking(); }, []);

  if (!m) {
    return (
      <div className="min-h-dvh grid place-items-center bg-background p-6 text-center">
        <div>
          <p className="font-display text-xl font-bold">Esta oración no existe</p>
          <Link to="/palabra" className="btn-primary-gradient mt-4 inline-flex min-h-11 items-center rounded-full px-6 text-sm font-semibold">Ir a la Palabra del día</Link>
        </div>
      </div>
    );
  }

  if (!now) return <div className="min-h-dvh bg-background"><div className="h-[60dvh] animate-pulse bg-secondary" /></div>;

  const l = lecturaFor(m, now);
  const full = `${l.title}. ${l.reference}. ${l.text}. Meditación. ${l.meditation}`;

  function toggleAudio() {
    if (playing) { stopSpeaking(); setPlaying(false); return; }
    const ok = speak(full, () => setPlaying(false));
    if (!ok) { toast.error("Tu dispositivo no permite lectura en voz alta"); return; }
    setPlaying(true);
  }

  async function share() {
    const text = `${l.reference}\n${l.text}\n\nhttps://tuorigen.app/palabra/${m!.id}`;
    try {
      if (navigator.share) await navigator.share({ title: l.title, text });
      else { await navigator.clipboard.writeText(text); toast.success("Copiado para compartir"); }
    } catch { /* cancelado */ }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(`${l.reference}\n${l.text}`); toast.success("Versículo copiado"); } catch { toast.error("No se pudo copiar"); }
  }

  function amen() {
    markDone(m!.id, now!);
    stopSpeaking();
    toast.success("Amén. Que esta palabra te acompañe hoy.");
    navigate({ to: "/palabra" });
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-card">
      <div className="relative min-h-[58dvh] w-full">
        <img src={m.bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/55 to-foreground/80 dark:from-background/70 dark:via-background/60 dark:to-background/90" />
        <div className="relative z-10 mx-auto max-w-xl px-5 pt-[max(env(safe-area-inset-top),16px)] pb-10 text-background dark:text-foreground">
          <div className="flex items-center justify-between">
            <Link to="/palabra" aria-label="Cerrar" className="grid h-11 w-11 place-items-center rounded-full bg-foreground/40 backdrop-blur dark:bg-background/50">
              <X className="h-5 w-5" />
            </Link>
            <button onClick={toggleAudio} aria-label={playing ? "Detener lectura" : "Escuchar"} className="grid h-11 w-11 place-items-center rounded-full bg-foreground/40 backdrop-blur dark:bg-background/50">
              {playing ? <Square className="h-4 w-4" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
          <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="text-5xl drop-shadow-lg" aria-hidden>{m.emoji}</span>
            <h1 className="mt-3 font-display text-[28px] font-bold leading-tight">{l.title}</h1>
            <div className="mt-2 flex items-center justify-center gap-3 text-[13px] opacity-90">
              <span className="h-px w-10 bg-current opacity-60" />{l.reference}<span className="h-px w-10 bg-current opacity-60" />
            </div>
            <p className="mt-5 text-left font-display text-[21px] leading-relaxed">{l.text}</p>
          </div>
          <div className="mt-6 flex justify-center gap-6">
            <button onClick={share} aria-label="Compartir" className="grid h-12 w-12 place-items-center rounded-full bg-background/20 backdrop-blur dark:bg-foreground/15"><Share2 className="h-5 w-5" /></button>
            <button onClick={copy} aria-label="Copiar" className="grid h-12 w-12 place-items-center rounded-full bg-background/20 backdrop-blur dark:bg-foreground/15"><Copy className="h-5 w-5" /></button>
          </div>
        </div>
      </div>
      <section className="relative z-20 -mt-6 mx-auto max-w-xl rounded-t-[28px] bg-card px-6 pt-7 pb-[max(env(safe-area-inset-bottom),24px)] animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl" aria-hidden>🕊️</span>
          <h2 className="font-display text-[22px] font-bold">Meditación</h2>
        </div>
        <p className="mt-3 text-[17px] leading-relaxed text-foreground/85">{l.meditation}</p>
        <button onClick={amen} className="mt-6 w-full min-h-[54px] rounded-[14px] bg-cta-green text-[17px] font-semibold text-cta-green-foreground shadow-soft active:scale-[.97] transition-transform">
          Amén 🙏
        </button>
      </section>
    </div>
  );
}
