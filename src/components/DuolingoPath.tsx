import { Check, Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import mascota from "@/assets/e3d-heartgem.png";

export type PathNode = {
  key: string;
  /** Texto corto bajo el círculo */
  label: string;
  /** Aviso opcional (por ejemplo: se abre a medianoche) */
  note?: string;
  state: "completed" | "active" | "locked";
};

/** Desplazamiento lateral tipo Duolingo (curva serpenteante) */
const OFFSETS = [0, 46, 74, 46, 0, -46, -74, -46];

/** Mapa de progreso vertical estilo Duolingo: nodos redondos en curva, con burbuja "Empieza aquí". */
export function DuolingoPath({
  nodes,
  onSelect,
  className,
}: {
  nodes: PathNode[];
  onSelect: (node: PathNode, index: number) => void;
  className?: string;
}) {
  const activeIndex = nodes.findIndex((n) => n.state === "active");

  return (
    <ol className={cn("relative mx-auto w-full max-w-[420px] pb-4", className)} aria-label="Mapa de progreso">
      {nodes.map((node, i) => {
        const offset = OFFSETS[i % OFFSETS.length]!;
        const isActive = node.state === "active";
        const isDone = node.state === "completed";
        const isLocked = node.state === "locked";
        return (
          <li
            key={node.key}
            className="relative flex flex-col items-center"
            style={{ marginTop: i === 0 ? 0 : 26, animation: `fade-in .45s ease-out ${Math.min(i, 8) * 60}ms both` }}
          >
            <div className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
              {isActive && (
                <span className="mb-2 inline-flex animate-bounce items-center rounded-[10px] border-2 border-white/70 bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-primary shadow-[0_4px_14px_rgba(124,92,255,.3)]">
                  Empieza aquí
                </span>
              )}

              <button
                onClick={() => onSelect(node, i)}
                aria-label={`${node.label}${isLocked ? " (bloqueado)" : ""}`}
                className={cn(
                  "grid h-[68px] w-[68px] place-items-center rounded-full border-[3px] transition active:translate-y-[3px] active:scale-[.97]",
                  isDone && "border-white/70 bg-[#3FBE8F] text-white shadow-[0_6px_0_#2F9A73]",
                  isActive && "border-white bg-gradient-to-br from-accent-pink to-primary text-white shadow-[0_6px_0_#6A46E6,0_0_0_10px_rgba(245,139,203,.2)]",
                  isLocked && "border-white/25 bg-white/20 text-white/70 shadow-[0_6px_0_rgba(255,255,255,.12)] backdrop-blur",
                )}
              >
                {isDone ? (
                  <Check className="h-8 w-8" strokeWidth={3} />
                ) : isActive ? (
                  <Star className="h-8 w-8 fill-white" strokeWidth={2} />
                ) : (
                  <Lock className="h-6 w-6" />
                )}
              </button>

              <span
                className={cn(
                  "mt-2 max-w-[150px] text-center text-[12px] font-bold leading-tight",
                  isLocked ? "text-white/65" : "text-white",
                )}
              >
                {node.label}
              </span>
              {node.note && <span className="text-center text-[10.5px] font-semibold text-white/60">{node.note}</span>}
            </div>

            {i === activeIndex && (
              <img
                src={mascota}
                alt=""
                aria-hidden
                width={256}
                height={256}
                className="pointer-events-none absolute top-6 h-16 w-16 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,.35)]"
                style={{ transform: `translateX(${offset > 0 ? offset - 120 : offset + 120}px)` }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
