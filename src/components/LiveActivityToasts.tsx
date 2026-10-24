import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { getLiveActivity } from "@/lib/social-proof.functions";
import { useAuth } from "@/lib/use-auth";
import { FUNNEL_INTERACTIONS as icons } from "@/lib/funnel-interactions";
import { appDayKey } from "@/lib/app-day";
import { buildSocialProofMessages, type SocialProofMessage } from "@/components/social/social-proof-content";

/** Elementos 3D propios de ORÍGEN (sin emojis del sistema). */
const ART: Record<string, string> = {
  book: icons.bible, brain: icons.brain, butterfly: icons.familyTree, clouds: icons.rest,
  coin: icons.leafToken, couple: icons.couple, cross: icons.prayer, headphones: icons.audio,
  "heart-purple": icons.dove, heartgem: icons.mentor, practice: icons.journal, star: icons.path,
  sparkles: icons.path, users: icons.categories, sun: icons.sun, gift: icons.gift,
  compass: icons.compass, heart: icons.healingHeart, eye: icons.butterfly,
};

const VISIBLE_MS = 5500;
const IDLE_MS = 90000;

/** Avisos flotantes de actividad: "landing" para la venta, "app" dentro de la aplicación. */
export function LiveActivityToasts({ variant = "app" }: { variant?: "landing" | "app" }) {
  const { user } = useAuth();
  const fetchActivity = useServerFn(getLiveActivity);
  const [current, setCurrent] = useState<SocialProofMessage | null>(null);
  const idx = useRef(0);
  const lastActive = useRef(Date.now());

  const { data } = useQuery({
    queryKey: ["live-activity", user?.id],
    enabled: variant === "app" && !!user,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    queryFn: () => fetchActivity(),
  });

  const messages = useMemo(
    () => buildSocialProofMessages(variant, appDayKey(), data?.messages),
    [variant, data],
  );

  useEffect(() => {
    const mark = () => {
      lastActive.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "scroll", "visibilitychange"] as const;
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, mark));
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && variant === "app") return;

    let hideTimer: ReturnType<typeof setTimeout>;
    let nextTimer: ReturnType<typeof setTimeout>;

    const schedule = (ms: number) => {
      nextTimer = setTimeout(showNext, ms);
    };

    function showNext() {
      const gap = variant === "landing" ? 12000 + Math.random() * 8000 : 60000 + Math.random() * 30000;
      if (document.hidden || Date.now() - lastActive.current > IDLE_MS) {
        schedule(gap);
        return;
      }
      const msg = messages[idx.current % messages.length];
      if (!msg) return;
      idx.current += 1;
      setCurrent(msg);
      hideTimer = setTimeout(() => setCurrent(null), VISIBLE_MS);
      schedule(gap);
    }

    schedule(variant === "landing" ? 6000 : 12000);
    return () => {
      clearTimeout(nextTimer);
      clearTimeout(hideTimer);
    };
  }, [messages, variant]);

  if (!current) return null;
  const art = ART[current.icon] ?? icons.categories;

  return (
    <div
      className={
        variant === "landing"
          ? "pointer-events-none fixed left-4 right-4 top-[72px] z-30 sm:right-auto sm:top-auto sm:bottom-6 sm:w-[320px]"
          : "pointer-events-none fixed right-3 top-[64px] z-30 w-[min(62vw,240px)] scale-[.92] origin-top-right lg:top-4"
      }
    >
      <div className="pointer-events-auto flex items-start gap-2.5 rounded-[14px] border border-border/60 bg-card/95 p-3 shadow-elevated backdrop-blur animate-in fade-in slide-in-from-left-4 duration-500">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-primary/10">
          <img src={art} alt="" aria-hidden className="h-8 w-8 object-contain drop-shadow-sm motion-safe:animate-[bounce_1.2s_ease-out_1]" />
        </span>
        <p className="pt-1 text-[13px] font-medium leading-snug text-foreground/90">{current.text}</p>
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
