import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Download, EllipsisVertical, RotateCw, Signal, Smartphone, Wifi, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = "ios" | "android";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Icono de compartir estilo iOS: cuadrado abierto con flecha hacia arriba. */
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-label="compartir" role="img" className={className}>
      <path d="M12 3v12" />
      <path d="M7.5 7.5 12 3l4.5 4.5" />
      <path d="M8 10H6a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 18 10h-2" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg viewBox="0 0 26 12" className="h-3 w-6" aria-hidden>
      <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".5" />
      <rect x="2" y="2" width="16" height="8" rx="1.8" fill="currentColor" />
      <rect x="23.5" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".5" />
    </svg>
  );
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  return "ios";
}

/** Pantalla tutorial inmersiva para añadir ORÍGEN a la pantalla de inicio. */
export function InstallAppGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [platform, setPlatform] = useState<Platform>("ios");

  useEffect(() => {
    if (!open) return;
    setPlatform(detectPlatform());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="install-title" className="fixed inset-0 z-[200] flex flex-col overflow-y-auto bg-install-bg text-install-fg motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(ellipse_at_top,var(--color-install-phone-top),transparent_70%)] opacity-60" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="flex justify-end">
          <button type="button" onClick={onClose} aria-label="Cerrar tutorial" className="grid h-11 w-11 place-items-center rounded-full bg-install-tile text-install-fg active:scale-[.97]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 id="install-title" className="mx-auto mt-2 max-w-[320px] text-center font-display text-[30px] font-bold leading-[1.12] tracking-tight">
          Añade tu espacio de sanación ORÍGEN a tu pantalla de inicio
        </h2>

        {/* Mockup del teléfono */}
        <div className="relative mx-auto mt-8 w-[min(78vw,290px)]">
          <div className="relative aspect-[9/14] overflow-hidden rounded-[44px] border-[7px] border-install-frame bg-gradient-to-b from-install-phone-top to-install-phone-bottom shadow-[0_30px_80px_-20px_rgba(124,92,255,.45),inset_0_0_40px_rgba(0,0,0,.6)]">
            <div className="flex items-center justify-between px-6 pt-3 text-[12px] font-semibold">
              <span>9:41</span>
              <span className="flex items-center gap-1.5" aria-label="Señal, Wi-Fi y batería"><Signal className="h-3.5 w-3.5" /><Wifi className="h-3.5 w-3.5" /><BatteryIcon /></span>
            </div>
            <div className="mx-auto mt-1 h-5 w-24 rounded-full bg-install-bg" aria-hidden />
            <div className="grid grid-cols-4 gap-x-3 gap-y-4 px-5 pt-6">
              {Array.from({ length: 20 }).map((_, i) =>
                i === 9 ? (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <img src="/apple-touch-icon.png?v=3" alt="Ícono de ORÍGEN" className="aspect-square w-full rounded-[14px] shadow-[0_0_0_2px_rgba(255,255,255,.85),0_8px_24px_rgba(167,139,250,.6)]" />
                    <span className="text-[9px] font-semibold">ORÍGEN</span>
                  </div>
                ) : (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="aspect-square w-full rounded-[14px] bg-install-tile" />
                    <div className="h-1.5 w-8 rounded-full bg-install-tile" />
                  </div>
                ),
              )}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-install-bg" />
          </div>
        </div>

        {/* Burbuja de instrucción */}
        <div className="relative mx-auto -mt-6 w-full max-w-[340px]">
          <div className="rounded-[22px] bg-install-bubble px-5 py-4 text-center text-[17px] leading-snug text-install-bubble-fg shadow-[0_8px_30px_rgba(0,0,0,.35)]">
            {platform === "ios" ? (
              <p>
                Pulsa <ShareIcon className="mx-0.5 inline-block h-[1.2em] w-[1.2em] -translate-y-[2px] align-middle text-install-accent" /> y selecciona <strong>Añadir a pantalla de inicio</strong>
              </p>
            ) : (
              <p>
                Pulsa el menú <EllipsisVertical className="inline-block h-[1.1em] w-[1.1em] -translate-y-[1px] align-middle" aria-label="menú" /> y selecciona <strong>Agregar a pantalla principal</strong>
              </p>
            )}
          </div>
          <div className="mx-auto -mt-px h-0 w-0 border-x-[11px] border-t-[12px] border-x-transparent border-t-install-bubble" aria-hidden />
        </div>

        {/* Barra del navegador móvil */}
        <div className="mx-auto mt-3 flex w-full max-w-[340px] items-center gap-2 rounded-[18px] bg-install-bar px-3 py-2.5 text-install-muted">
          <ChevronLeft className="h-5 w-5" aria-hidden />
          <div className="flex-1 truncate rounded-[10px] bg-install-tile px-3 py-1.5 text-center text-[13px]">tuorigen.app</div>
          {platform === "ios" ? <ShareIcon className="h-5 w-5 text-install-accent" /> : <EllipsisVertical className="h-5 w-5 text-install-fg" aria-hidden />}
          <RotateCw className="h-4 w-4" aria-hidden />
        </div>

        <ol className="mx-auto mt-4 grid w-full max-w-[340px] gap-2 text-[15px]">
          {(platform === "ios"
            ? ["Abre tuorigen.app en Safari.", "Toca el botón Compartir (cuadrado con flecha).", "Elige «Añadir a pantalla de inicio» y toca «Añadir»."]
            : ["Abre tuorigen.app en Chrome.", "Toca el menú ⋮ arriba a la derecha.", "Elige «Instalar app» o «Agregar a pantalla principal»."]
          ).map((s, i) => (
            <li key={s} className="flex items-start gap-3 rounded-[14px] bg-install-tile px-3 py-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-install-fg text-[13px] font-bold text-install-bg">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="Tipo de teléfono">
          {(["ios", "android"] as const).map((p) => (
            <button key={p} type="button" role="tab" aria-selected={platform === p} onClick={() => setPlatform(p)}
              className={cn("min-h-11 rounded-full px-4 text-[14px] font-semibold active:scale-[.97]", platform === p ? "bg-install-fg text-install-bg" : "bg-install-tile text-install-fg")}>
              {p === "ios" ? "iPhone" : "Android"}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mx-auto mt-3 min-h-11 px-6 text-[15px] font-semibold text-install-muted">Ahora no</button>
      </div>
    </div>,
    document.body,
  );
}

/** Botón que abre el tutorial; en Android con instalación directa disponible, instala en un toque. */
export function InstallAppButton({ className, label = "Agregar al inicio" }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;

  const start = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice.catch(() => ({ outcome: "dismissed" }));
      setDeferred(null);
      if (choice.outcome === "accepted") return;
    }
    setOpen(true);
  };

  return (
    <>
      <button type="button" onClick={start} className={cn("flex min-h-12 w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left active:scale-[.97]", className)}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary"><Smartphone className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold">{label}</span>
          <span className="block text-[12px] text-muted-foreground">Abre ORÍGEN desde tu celular como una app.</span>
        </span>
        <Download className="h-4 w-4 text-primary" aria-hidden />
      </button>
      <InstallAppGuide open={open} onClose={() => setOpen(false)} />
    </>
  );
}
