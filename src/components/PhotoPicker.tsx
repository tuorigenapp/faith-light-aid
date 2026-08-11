import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { cropToSquareBlob, loadImage, MAX_PHOTO_MB } from "@/lib/photo";

const VIEWPORT = 260;

type Props = {
  /** URL actual (firmada o http) para mostrar */
  value?: string | null;
  /** Devuelve el blob recortado listo para subir */
  onCropped: (blob: Blob, previewUrl: string) => void;
  onRemove?: () => void;
  size?: number;
  shape?: "circle" | "rounded";
  label?: string;
};

export function PhotoPicker({ value, onCropped, onRemove, size = 96, shape = "circle", label }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Selecciona una imagen válida");
    if (f.size > MAX_PHOTO_MB * 1024 * 1024) return toast.error(`La foto debe pesar menos de ${MAX_PHOTO_MB} MB`);
    const url = URL.createObjectURL(f);
    try {
      const loaded = await loadImage(url);
      setSrc(url);
      setImg(loaded);
      setZoom(1);
      setOff({ x: 0, y: 0 });
    } catch {
      toast.error("No pudimos leer esa imagen, intenta con otra");
    }
  }

  async function confirm() {
    if (!img) return;
    setBusy(true);
    try {
      const blob = await cropToSquareBlob(img, { zoom, offsetX: off.x, offsetY: off.y, viewport: VIEWPORT });
      onCropped(blob, URL.createObjectURL(blob));
      setImg(null);
      setSrc(null);
    } catch (err: any) {
      toast.error(err?.message ?? "No pudimos recortar la foto");
    } finally {
      setBusy(false);
    }
  }

  const radius = shape === "circle" ? "9999px" : "20px";

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative grid place-items-center overflow-hidden bg-[#F1ECFF] border-2 border-dashed border-[#7C5CFF]/45 active:scale-95 transition"
          style={{ width: size, height: size, borderRadius: radius }}
          aria-label="Subir foto"
        >
          {value ? (
            <img src={value} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center px-1">
              <Camera className="w-6 h-6 text-[#7C5CFF] mx-auto" />
              <div className="text-[9px] font-bold text-[#7C5CFF] mt-1">Subir</div>
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#7C5CFF] grid place-items-center border-2 border-background">
            <Camera className="w-3.5 h-3.5 text-white" />
          </span>
        </button>
        <div className="flex-1 text-[12px] text-muted-foreground leading-snug">
          {label ?? `Toca para elegir una foto. Podrás recortarla. Máx. ${MAX_PHOTO_MB} MB.`}
          {value && onRemove && (
            <button type="button" onClick={onRemove} className="mt-1 flex items-center gap-1 text-[#F5566B] font-bold text-[11px]">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar foto
            </button>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />

      <Dialog open={!!img} onOpenChange={(o) => !o && (setImg(null), setSrc(null))}>
        <DialogContent className="max-w-[340px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-display text-[18px]">Ajusta tu foto</DialogTitle>
          </DialogHeader>
          <div
            className="relative mx-auto overflow-hidden bg-[#1B1930] touch-none"
            style={{ width: VIEWPORT, height: VIEWPORT, borderRadius: radius }}
            onPointerDown={(e) => { drag.current = { x: e.clientX - off.x, y: e.clientY - off.y }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => { if (drag.current) setOff({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); }}
            onPointerUp={() => (drag.current = null)}
          >
            {src && img && (
              <img
                src={src}
                alt="Recorte"
                draggable={false}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: img.naturalWidth * (VIEWPORT / Math.min(img.naturalWidth, img.naturalHeight)) * zoom,
                  transform: `translate(calc(-50% + ${off.x}px), calc(-50% + ${off.y}px))`,
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <ZoomIn className="w-4 h-4 text-[#7C5CFF]" />
            <input
              type="range" min={1} max={3} step={0.01} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#7C5CFF]"
              aria-label="Zoom"
            />
          </div>
          <p className="text-[11px] text-muted-foreground text-center">Arrastra para mover · desliza para acercar</p>
          <Button onClick={confirm} disabled={busy} className="w-full h-12 rounded-[14px] btn-primary-gradient">
            {busy ? "Procesando…" : "Usar esta foto"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
