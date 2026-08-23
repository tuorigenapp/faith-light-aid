import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookHeart, Flag, Gift, HeartHandshake, Sparkles, Users, X } from "lucide-react";
import { getLiveActivity } from "@/lib/social-proof.functions";
import { useAuth } from "@/lib/use-auth";

const ICONS: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  users: Users,
  dove: Sparkles,
  heart: HeartHandshake,
  gift: Gift,
  book: BookHeart,
  flag: Flag,
};

const VISIBLE_MS = 5000;
const IDLE_MS = 90000;

/** Toasts flotantes con actividad REAL y anónima. Si no hay datos, no se muestra nada. */
export function LiveActivityToasts() {
  const { user } = useAuth();
  const fetchActivity = useServerFn(getLiveActivity);
  const [current, setCurrent] = useState<{ icon: string; text: string } | null>(null);
  const idx = useRef(0);
  const lastActive = useRef(Date.now());

  const { data } = useQuery({
    queryKey: ["live-activity", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    queryFn: () => fetchActivity(),
  });

  useEffect(() => {
    const mark = () => { lastActive.current = Date.now(); };
    const events = ["pointerdown", "keydown", "scroll", "visibilitychange"] as const;
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, mark));
  }, []);

  useEffect(() => {
    const messages = data?.messages ?? [];
    if (messages.length === 0) return;

    let hideTimer: ReturnType<typeof setTimeout>;
    const showNext = () => {
      if (document.hidden) return;
      if (Date.now() - lastActive.current > IDLE_MS) return;
      const msg = messages[idx.current % messages.length]!;
      idx.current += 1;
      setCurrent(msg);
      hideTimer = setTimeout(() => setCurrent(null), VISIBLE_MS);
    };

    const first = setTimeout(showNext, 12000);
    const loop = setInterval(showNext, 75000);
    return () => { clearTimeout(first); clearInterval(loop); clearTimeout(hideTimer); };
  }, [data]);

  if (!current) return null;
  const Icon = ICONS[current.icon] ?? Sparkles;

  return (
    <div className="pointer-events-none fixed bottom-[150px] left-4 z-30 w-[min(78vw,290px)]">
      <div className="pointer-events-auto flex items-start gap-2.5 rounded-[14px] border border-border/60 bg-card/95 p-3 shadow-elevated backdrop-blur animate-in fade-in slide-in-from-left-4 duration-500">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="pt-0.5 text-[12.5px] font-medium leading-snug text-foreground/90">{current.text}</p>
        <button
          onClick={() => setCurrent(null)}
          aria-label="Descartar aviso"
          className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
