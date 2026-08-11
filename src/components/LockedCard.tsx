import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function LockedCard({
  title,
  subtitle,
  icon,
  className,
}: {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to="/membresia"
      className={cn(
        "relative block app-card p-4 overflow-hidden hover:border-primary/40 transition",
        className
      )}
    >
      <div className="absolute inset-0 bg-card/60 backdrop-blur-[2px] z-10" />
      <div className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-brand-gradient text-white grid place-items-center shadow-glow">
        <Lock className="w-4 h-4" />
      </div>
      <div className="relative z-0 opacity-40">
        {icon}
        <h4 className="font-display font-bold text-[15px] mt-2">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="relative z-20 mt-3">
        <span className="text-[11px] uppercase tracking-widest font-bold text-primary">
          Camino ORIGEN · desbloquear
        </span>
      </div>
    </Link>
  );
}
