import { useState } from "react";
import { Layers, ChevronDown } from "lucide-react";

const STEPS = [
  "Abre Ajustes de tu teléfono y entra en Aplicaciones.",
  "Busca ORÍGEN (o Chrome si la usas desde el navegador).",
  "Toca «Mostrar sobre otras aplicaciones» y actívalo.",
  "Vuelve a ORÍGEN: tus avisos de oración aparecerán aunque estés en otra app.",
];

export function AndroidOverlayGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-h-11 w-full items-center gap-3 text-left" aria-expanded={open}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Layers className="h-5 w-5" /></span>
        <span className="flex-1">
          <span className="block text-[15px] font-semibold text-foreground">Avisos sobre otras apps (Android)</span>
          <span className="block text-[13px] text-muted-foreground">Cómo permitir que ORÍGEN te acompañe siempre</span>
        </span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ol className="mt-3 space-y-2">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3 text-[14px] text-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[12px] font-semibold text-primary">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
