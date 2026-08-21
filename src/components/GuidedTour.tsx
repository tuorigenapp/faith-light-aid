import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DONE_KEY = "origen_tour_done";

const SLIDES = [
  {
    emoji: "🌿",
    title: "Tus hojas de sanación",
    body: "Cada acción real te acerca a una hoja. Con hojas abres consultas, la mentora y recompensas.",
  },
  {
    emoji: "🗺️",
    title: "Tu camino, un día a la vez",
    body: "En «Mi camino ORÍGEN» y en cada categoría avanzas un día por jornada. Nada de atracones.",
  },
  {
    emoji: "📖",
    title: "La Palabra de hoy",
    body: "Enseñanza, reflexión para ti y para tu familia, quiz y una imagen para descargar y compartir.",
  },
  {
    emoji: "🕊️",
    title: "La mentora te acompaña",
    body: "Consultas de pareja, patrones familiares y «Dios te dice hoy», con historial y PDF.",
  },
];

export function GuidedTour() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(DONE_KEY) !== "1") setOpen(true);
  }, []);

  function finish() {
    localStorage.setItem(DONE_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;
  const s = SLIDES[i]!;
  const last = i === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end sm:place-items-center bg-foreground/45 p-0 sm:p-6">
      <div className="w-full sm:max-w-[420px] rounded-t-[20px] sm:rounded-[16px] bg-card p-6 shadow-elevated animate-in slide-in-from-bottom">
        <div className="flex justify-end">
          <button onClick={finish} aria-label="Saltar tour" className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[16px] bg-primary/10 text-4xl">{s.emoji}</div>
          <h2 className="mt-4 font-display text-[22px] font-bold leading-tight">{s.title}</h2>
          <p className="mx-auto mt-2 max-w-[34ch] text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {SLIDES.map((_, n) => (
            <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-primary" : "w-1.5 bg-secondary"}`} />
          ))}
        </div>

        <button
          onClick={() => (last ? finish() : setI(i + 1))}
          className="btn-primary-gradient mt-5 min-h-[52px] w-full rounded-full text-[16px] font-semibold active:scale-[.97] transition"
        >
          {last ? "Empezar mi camino" : "Siguiente"}
        </button>
        {!last && (
          <button onClick={finish} className="mt-2 min-h-11 w-full text-sm font-medium text-muted-foreground">
            Saltar el tour
          </button>
        )}
      </div>
    </div>
  );
}
