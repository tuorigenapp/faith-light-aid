import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Headphones,
  ClipboardList,
  BrainCircuit,
  HandHelping,
  Heart,
  BookOpen,
  BarChart3,
  Trophy,
  Star,
  Download,
  CalendarDays,
  Flame,
  Info,
} from "lucide-react";

const INCLUDES = [
  { Icon: Headphones, label: "Audio guiado diario" },
  { Icon: ClipboardList, label: "Ejercicios prácticos" },
  { Icon: BrainCircuit, label: "IA especializada" },
  { Icon: HandHelping, label: "Oraciones guiadas" },
  { Icon: Heart, label: "Afirmaciones diarias" },
  { Icon: BookOpen, label: "Diario personal" },
  { Icon: BarChart3, label: "Seguimiento del progreso" },
  { Icon: Trophy, label: "Logros" },
  { Icon: Star, label: "Favoritos" },
  { Icon: Download, label: "Recursos descargables" },
  { Icon: CalendarDays, label: "Programas de 21 días" },
  { Icon: Flame, label: "Desafíos diarios" },
];

export function IncludesModal() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 h-11 text-sm font-bold text-foreground shadow-soft active:scale-[.97] transition"
        >
          <Info className="w-4 h-4 text-primary" />
          ¿Qué incluye?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[20px]">
        <DialogHeader>
          <DialogTitle className="font-display font-extrabold text-xl">
            ¿Qué incluye cada programa?
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Cada experiencia está diseñada para acompañarte paso a paso en tu transformación.
          </p>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 mt-2 max-h-[60vh] overflow-y-auto">
          {INCLUDES.map(({ Icon, label }) => (
            <div key={label} className="rounded-2xl bg-brand-soft p-3 flex flex-col items-center text-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-card grid place-items-center shadow-soft">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[11px] leading-tight text-foreground/80 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
