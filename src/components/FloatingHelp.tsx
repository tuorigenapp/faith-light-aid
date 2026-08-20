import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HelpCircle, X, MessageCircle, Mail, Compass, Leaf } from "lucide-react";

const ITEMS = [
  { icon: Compass, label: "Ver el tour de la app", to: "/dashboard?tour=1" as const },
  { icon: MessageCircle, label: "Hablar con la mentora", to: "/chat" as const },
  { icon: Leaf, label: "Cómo funcionan las hojas", to: "/premios" as const },
];

export function FloatingHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      )}
      <div className="fixed bottom-[92px] left-4 z-50">
        {open && (
          <div className="mb-3 w-[248px] rounded-[16px] border border-border/60 bg-card p-3 shadow-elevated animate-in fade-in slide-in-from-bottom-2">
            <p className="px-1 pb-2 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
              ¿Te ayudo con algo?
            </p>
            <div className="space-y-1">
              {ITEMS.map((it) => (
                <Link
                  key={it.label}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-[10px] px-2 text-sm font-medium hover:bg-secondary"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary/10 text-primary">
                    <it.icon className="h-4 w-4" />
                  </span>
                  {it.label}
                </Link>
              ))}
              <a
                href="mailto:infodenegociorm@gmail.com"
                className="flex min-h-11 items-center gap-3 rounded-[10px] px-2 text-sm font-medium hover:bg-secondary"
              >
                <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </span>
                Escribir a soporte
              </a>
            </div>
          </div>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Cerrar ayuda" : "Abrir ayuda"}
          className="grid h-12 w-12 place-items-center rounded-full bg-card text-primary shadow-elevated border border-border/60 active:scale-[.97] transition"
        >
          {open ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
        </button>
      </div>
    </>
  );
}
