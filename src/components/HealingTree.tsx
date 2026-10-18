import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { awardGems, formatHojas } from "@/lib/gems";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function todayIso() { return new Date().toISOString().slice(0, 10); }

export function HealingTree({ bannerImage }: { bannerImage?: string } = {}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [shaking, setShaking] = useState(false);
  const [reward, setReward] = useState<number | null>(null);

  const { data: shakenToday, refetch } = useQuery({
    queryKey: ["shake_tree", user?.id, todayIso()],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("daily_activity")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("activity_type", "shake_tree")
        .eq("activity_date", todayIso());
      return (count ?? 0) > 0;
    },
  });

  useEffect(() => {
    if (reward === null) return;
    const t = setTimeout(() => setReward(null), 2600);
    return () => clearTimeout(t);
  }, [reward]);

  async function shake() {
    if (!user || shakenToday || shaking) return;
    setShaking(true);
    const amount = 10 + Math.floor(Math.random() * 21); // 10-30
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      activity_type: "shake_tree",
      activity_date: todayIso(),
      reference_id: crypto.randomUUID(),
      metadata: { amount } as never,
    });
    await awardGems(amount, "Árbol de Sanación diario");
    setReward(amount);
    qc.invalidateQueries({ queryKey: ["profile"] });
    setTimeout(() => { setShaking(false); refetch(); }, 900);
  }

  if (bannerImage) {
    return (
      <section className="relative min-h-[170px] rounded-[22px] overflow-hidden shadow-[0_8px_30px_rgba(69,37,142,.12)]">
        <img src={bannerImage} alt="" loading="lazy" className={cn("absolute inset-0 h-full w-full object-cover object-left origin-bottom-left", shaking && "animate-[shake_0.6s_ease-in-out]")} />
        <div className="absolute inset-0 bg-gradient-to-l from-[#FFFCFF] via-[#FFFCFF]/80 to-transparent" />
        {shaking && (
          <>
            <span className="absolute left-[18%] top-6 text-2xl animate-[fall_1s_ease-in]">🍃</span>
            <span className="absolute left-[30%] top-10 text-xl animate-[fall_1.2s_ease-in]">🍃</span>
            <span className="absolute left-[8%] top-12 text-lg animate-[fall_0.9s_ease-in]">🍃</span>
          </>
        )}
        {reward !== null && (
          <div className="absolute top-3 left-3 rounded-full bg-success text-white text-xs font-bold px-3 py-1 shadow-glow">
            +{reward >= 100 ? Math.floor(reward / 100) + " hojas" : "progreso"} 🍃
          </div>
        )}
        <div className="relative ml-auto p-5 max-w-[60%]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#25B9A9]">Árbol de Sanación</span>
          <h3 className="mt-1 font-display font-bold text-[18px] leading-tight text-[#211C32]">{shakenToday ? "Ya recogiste hoy" : "Agita el árbol y gana hojas"}</h3>
          <p className="mt-1 text-[12.5px] text-[#45405a]">{shakenToday ? "Vuelve mañana para nuevas hojas." : "Cada día una lluvia de hojas para tu camino."}</p>
          <button onClick={shake} disabled={!!shakenToday || shaking}
            className={cn("mt-3 inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13px] font-bold transition active:scale-[.97]",
              shakenToday ? "bg-secondary text-muted-foreground" : "bg-gradient-to-r from-[#7950F5] to-[#9d7bff] text-white shadow-[0_4px_14px_rgba(121,80,245,.3)]")}>
            {shakenToday ? "Vuelve mañana" : "Agitar hoy"} <Sparkles className="w-4 h-4" />
          </button>
        </div>
        <style>{`
          @keyframes shake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-1.5deg)} 75%{transform:rotate(1.5deg)} }
          @keyframes fall { 0%{transform:translateY(0);opacity:0} 30%{opacity:1} 100%{transform:translateY(90px) rotate(180deg);opacity:0} }
        `}</style>
      </section>
    );
  }

  return (
    <div className="hero-card relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary">Árbol de Sanación</div>
          <h3 className="font-display font-bold text-[19px] leading-tight mt-1">
            {shakenToday ? "Ya recogiste hoy 🍃" : "Agita el árbol y gana hojas"}
          </h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            {shakenToday ? "Vuelve mañana para nuevas hojas de sanación." : "Cada día una lluvia de hojas para tu camino."}
          </p>
        </div>
      </div>

      <div className="relative mt-3 grid place-items-center h-36">
        <button
          onClick={shake}
          disabled={!!shakenToday || shaking}
          aria-label="Agitar árbol"
          className={cn(
            "relative transition-transform origin-bottom",
            shaking && "animate-[shake_0.6s_ease-in-out]",
            !shakenToday && "active:scale-95"
          )}
        >
          <svg width="120" height="130" viewBox="0 0 120 130" fill="none">
            <rect x="54" y="80" width="12" height="45" rx="4" fill="#8B5E3C" />
            <circle cx="60" cy="55" r="42" fill="url(#leaf)" />
            <circle cx="40" cy="42" r="22" fill="url(#leaf)" />
            <circle cx="82" cy="45" r="24" fill="url(#leaf)" />
            <defs>
              <radialGradient id="leaf" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#7DDDA8" />
                <stop offset="100%" stopColor="#3FBE8F" />
              </radialGradient>
            </defs>
          </svg>
          {shaking && (
            <>
              <span className="absolute left-1/2 top-8 -translate-x-1/2 text-2xl animate-[fall_1s_ease-in]">🍃</span>
              <span className="absolute left-4 top-16 text-xl animate-[fall_1.1s_ease-in]">🍃</span>
              <span className="absolute right-4 top-14 text-xl animate-[fall_1.2s_ease-in]">🍃</span>
              <span className="absolute left-10 top-20 text-lg animate-[fall_0.9s_ease-in]">🍃</span>
            </>
          )}
        </button>

        {reward !== null && (
          <div className="absolute top-2 right-2 rounded-full bg-success text-white text-xs font-bold px-3 py-1 shadow-glow animate-in fade-in slide-in-from-top-2">
            +{reward >= 100 ? Math.floor(reward / 100) + " hojas" : "progreso"} 🍃
          </div>
        )}
      </div>

      <button
        onClick={shake}
        disabled={!!shakenToday || shaking}
        className={cn(
          "mt-2 w-full h-12 rounded-[14px] font-semibold text-sm inline-flex items-center justify-center gap-2 transition",
          shakenToday
            ? "bg-secondary text-muted-foreground"
            : "btn-primary-gradient"
        )}
      >
        <Sparkles className="w-4 h-4" />
        {shakenToday ? "Vuelve mañana" : "Agitar hoy"}
      </button>

      <style>{`
        @keyframes shake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
        @keyframes fall { 0%{transform:translateY(0);opacity:0} 30%{opacity:1} 100%{transform:translateY(90px) rotate(180deg);opacity:0} }
      `}</style>
    </div>
  );
}
