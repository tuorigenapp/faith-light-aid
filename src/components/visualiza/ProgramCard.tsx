import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type UnifiedProgram = {
  key: string;
  title: string;
  desc: string;
  image: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconTint: string;
  chipBg: string;
  gradient: string;
  tint: string;
  emoji: string;
  days: number;
  done: number;
  to: string;
  params?: Record<string, string>;
};

export function ProgramCard({ program, delayMs }: { program: UnifiedProgram; delayMs: number }) {
  const { title, desc, image, Icon, iconTint, chipBg, gradient, tint, emoji, days, done, to, params } = program;
  return (
    <Link
      to={to as any}
      params={params as any}
      className="block"
      style={{ animation: `fade-in .4s ease-out ${delayMs}ms both` }}
    >
      <div className="app-card overflow-hidden h-full flex flex-col shadow-soft hover:shadow-glow active:scale-[.98] transition-all">
        <div className="relative aspect-square w-full">
          <img src={image} alt={title} width={640} height={640} loading="lazy" className="h-full w-full object-cover" />
          <div className={cn("absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-[10px] bg-card/95 px-2.5 py-1 text-[12px] font-semibold", tint)}>
            <Icon className="w-3.5 h-3.5" /> {days} días
          </div>
          {done > 0 && (
            <div className="absolute top-3 right-3 grid place-items-center">
              <svg width="36" height="36" viewBox="0 0 36 36" className="drop-shadow">
                <circle cx="18" cy="18" r="15.5" fill="rgba(0,0,0,0.45)" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray={`${(Math.min(done, days) / days) * 97.4} 97.4`}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />
                <text x="18" y="21" textAnchor="middle" fontSize="10" fontWeight="800" fill="white">
                  {done}
                </text>
              </svg>
            </div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-display font-extrabold text-[16px] leading-tight">{title}</h3>
          <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">{desc}</p>
          <div
            className={cn(
              "mt-3 h-11 rounded-[12px] grid place-items-center text-[14px] font-bold text-primary-foreground bg-primary shadow-soft",
            )}
          >
            <span className="inline-flex items-center gap-2">
              {done > 0 ? "Continuar" : "Comenzar"} <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
