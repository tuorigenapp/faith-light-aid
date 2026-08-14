import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { awardGems , wholeHojas} from "@/lib/gems";
import { getPrograma, UNLOCK_COST, weekOfDay } from "@/lib/programas";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Sparkles, Lock, Check, Play, Pause, Headphones,
  PenLine, Heart, CalendarDays, Leaf, ChevronRight, ShieldCheck,
} from "lucide-react";
import audioAsset from "@/assets/origen-cierre.mp3";
import hojaImg from "@/assets/arbol-mini.png";

export const Route = createFileRoute("/_authenticated/programas/$programaId")({
  head: () => ({
    meta: [
      { title: "Programa de 21 días — ORIGEN" },
      { name: "description", content: "Programa guiado de 21 días con audio, afirmaciones y ejercicios diarios para sanar tu historia." },
      { property: "og:title", content: "Programa de 21 días — ORIGEN" },
      { property: "og:description", content: "Audio guiado, afirmaciones y ejercicios diarios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramaPage,
});

function todayIso() { return new Date().toISOString().slice(0, 10); }

function ProgramaPage() {
  const { programaId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const prog = getPrograma(programaId);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [day, setDay] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState("");

  const { data: state } = useQuery({
    queryKey: ["programa", programaId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_activity")
        .select("activity_type, metadata")
        .eq("user_id", user!.id)
        .in("activity_type", ["programa_dia", "programa_semana"]);
      const rows = (data ?? []).filter((r: any) => r.metadata?.programa === programaId);
      return {
        done: new Set(rows.filter((r: any) => r.activity_type === "programa_dia").map((r: any) => Number(r.metadata?.day))),
        weeks: new Set(rows.filter((r: any) => r.activity_type === "programa_semana").map((r: any) => Number(r.metadata?.week))),
      };
    },
  });

  const done = state?.done ?? new Set<number>();
  const unlockedWeeks = useMemo(() => new Set([1, ...(state?.weeks ?? [])]), [state]);

  if (!prog) {
    return (
      <div className="px-4 py-10 max-w-md mx-auto text-center">
        <h1 className="font-display text-xl font-bold">Programa no disponible</h1>
        <Link to="/visualiza" className="mt-4 inline-flex h-12 items-center rounded-[12px] px-5 btn-primary-gradient text-sm font-semibold">Volver</Link>
      </div>
    );
  }

  const isUnlocked = (d: number) => unlockedWeeks.has(weekOfDay(d));
  const progressPct = Math.round((done.size / 21) * 100);

  async function unlockWeek(w: number) {
    if (!user) return;
    if ((profile?.gems ?? 0) < UNLOCK_COST) {
      toast.error(`Necesitas ${UNLOCK_COST} hojas para abrir la semana ${w}.`);
      navigate({ to: "/premios" });
      return;
    }
    await awardGems(-UNLOCK_COST, `Semana ${w} · ${prog!.title}`);
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      activity_type: "programa_semana",
      activity_date: todayIso(),
      reference_id: crypto.randomUUID(),
      metadata: { programa: programaId, week: w } as never,
    });
    qc.invalidateQueries({ queryKey: ["programa", programaId] });
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success(`Semana ${w} desbloqueada`);
  }

  async function completeDay() {
    if (!user || done.has(day)) return;
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      activity_type: "programa_dia",
      activity_date: todayIso(),
      reference_id: crypto.randomUUID(),
      metadata: { programa: programaId, day, note } as never,
    });
    await awardGems(40, `Día ${day} · ${prog!.title}`);
    qc.invalidateQueries({ queryKey: ["programa", programaId] });
    qc.invalidateQueries({ queryKey: ["profile"] });
    setNote("");
    setStep(2);
  }

  /* ---------------- PASO 1 · Bienvenida ---------------- */
  if (step === 1) {
    return (
      <div className="min-h-dvh px-4 pt-4 pb-28 max-w-[1100px] mx-auto">
        <TopBar to="/visualiza" label="Visualízalo y Vívelo" />
        <section className="relative mt-3 overflow-hidden rounded-[16px] shadow-soft">
          <img src={prog.cover} alt={prog.title} width={1024} height={1024} className="w-full aspect-square object-cover" />
        </section>

        <div className="mt-4 app-card p-5">
          <div className={cn("text-[12px] font-bold uppercase tracking-widest", prog.tint)}>Programa de 21 días</div>
          <h1 className="font-display font-extrabold text-[28px] leading-tight mt-1">{prog.title}</h1>
          <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">{prog.claim}</p>
          <p className="scripture text-[13px] text-muted-foreground/80 mt-3">“{prog.scripture.text}” — {prog.scripture.ref}</p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {prog.pillars.map((p, i) => (
            <div key={p.title} className="app-card p-4 flex gap-3 items-start">
              <div className={cn("w-11 h-11 shrink-0 rounded-[12px] grid place-items-center bg-primary/10", prog.tint)}>
                {[<Heart key="a" className="w-5 h-5" />, <PenLine key="b" className="w-5 h-5" />, <ShieldCheck key="c" className="w-5 h-5" />, <Sparkles key="d" className="w-5 h-5" />][i % 4]}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[16px] leading-tight">{p.title}</div>
                <p className="text-[13px] text-muted-foreground mt-1">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setStep(2)} className="mt-4 w-full h-14 rounded-[12px] btn-primary-gradient text-[17px] font-semibold inline-flex items-center justify-center gap-2 active:scale-[.97] transition">
          <Sparkles className="w-5 h-5" /> Comenzar mi semana 1
        </button>
        <p className="mt-2 text-center text-[12px] text-muted-foreground">Semana 1 incluida · semanas 2 y 3 con {UNLOCK_COST} hojas cada una</p>
      </div>
    );
  }

  /* ---------------- PASO 2 · Los 21 días ---------------- */
  if (step === 2) {
    return (
      <div className="min-h-dvh px-4 pt-4 pb-28 max-w-[1100px] mx-auto">
        <TopBar onBack={() => setStep(1)} label={prog.title} />

        <div className="mt-3 app-card p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-muted-foreground">Tu progreso</div>
              <div className="font-display font-extrabold text-[22px]">{done.size}/21 días</div>
            </div>
            <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-bold text-primary">
              <img src={hojaImg} alt="" width={20} height={20} className="w-5 h-5 object-contain" />
              {wholeHojas(profile?.gems)}
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={cn("h-full bg-gradient-to-r transition-all duration-700", prog.gradient)} style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {[1, 2, 3].map((w) => {
          const open = unlockedWeeks.has(w);
          return (
            <section key={w} className="mt-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <h2 className="font-display font-bold text-[19px] min-w-0 truncate">Semana {w}</h2>
                {!open && (
                  <button onClick={() => unlockWeek(w)} className="shrink-0 h-9 rounded-[10px] bg-primary/10 px-3 text-[13px] font-bold text-primary inline-flex items-center gap-1.5">
                    <Leaf className="w-4 h-4" /> Abrir · {UNLOCK_COST} hojas
                  </button>
                )}
              </div>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {prog.days.slice((w - 1) * 7, w * 7).map((label, i) => {
                  const d = (w - 1) * 7 + i + 1;
                  const complete = done.has(d);
                  return (
                    <button
                      key={d}
                      onClick={() => (open ? (setDay(d), setStep(3)) : unlockWeek(w))}
                      className={cn(
                        "app-card p-4 text-left flex items-center gap-3 active:scale-[.97] transition",
                        !open && "opacity-70",
                        complete && "border-accent-green/40"
                      )}
                    >
                      <div className={cn("w-11 h-11 shrink-0 rounded-[12px] grid place-items-center text-white bg-gradient-to-br", prog.gradient)}>
                        {complete ? <Check className="w-5 h-5" /> : open ? <Play className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={cn("text-[15px] font-semibold leading-tight", !open && "blur-[3px] select-none")}>{label}</div>
                        <div className="text-[12px] text-muted-foreground mt-0.5">
                          {complete ? "Completado · +40 hojas" : open ? "Audio + afirmación + ejercicio" : "Bloqueado"}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  /* ---------------- PASO 3 · Día ---------------- */
  const affirmation = prog.affirmations[(day - 1) % prog.affirmations.length];
  const exercise = prog.exercises[(day - 1) % prog.exercises.length];
  const complete = done.has(day);

  return (
    <div className="min-h-dvh px-4 pt-4 pb-28 max-w-[1100px] mx-auto">
      <TopBar onBack={() => setStep(2)} label={`Día ${day} de 21`} />

      <div className="mt-3 relative overflow-hidden rounded-[16px] shadow-soft">
        <img src={prog.cover} alt="" width={1024} height={1024} loading="lazy" className="h-44 w-full object-cover" />
        <div className={cn("absolute inset-0 bg-gradient-to-t opacity-90", prog.gradient)} style={{ mixBlendMode: "multiply" }} />
        <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
          <div className="text-[12px] font-bold uppercase tracking-widest opacity-90">{prog.subtitle}</div>
          <h1 className="font-display font-extrabold text-[24px] leading-tight mt-1">{prog.days[day - 1]}</h1>
        </div>
      </div>

      {/* Audio */}
      <div className="mt-3 app-card p-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <button
            onClick={() => {
              const el = document.getElementById("prog-audio") as HTMLAudioElement | null;
              if (!el) return;
              if (el.paused) { void el.play(); setPlaying(true); } else { el.pause(); setPlaying(false); }
            }}
            aria-label={playing ? "Pausar audio" : "Reproducir audio"}
            className={cn("w-14 h-14 shrink-0 rounded-full grid place-items-center text-white bg-gradient-to-br shadow-soft active:scale-[.97] transition", prog.gradient)}
          >
            {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <div className="min-w-0">
            <div className="text-[12px] text-muted-foreground font-medium inline-flex items-center gap-1.5"><Headphones className="w-3.5 h-3.5" /> Audio guiado</div>
            <div className="font-semibold text-[16px] truncate">Sesión del día {day}</div>
          </div>
        </div>
        <audio id="prog-audio" src={audioAsset} onEnded={() => setPlaying(false)} className="hidden" />
      </div>

      {/* Afirmación */}
      <div className="mt-3 app-card p-5">
        <div className="text-[12px] font-bold uppercase tracking-widest text-primary">Afirmación de hoy</div>
        <p className="font-display font-bold text-[20px] leading-snug mt-2">“{affirmation}”</p>
      </div>

      {/* Ejercicio */}
      <div className="mt-3 app-card p-5">
        <div className="text-[12px] font-bold uppercase tracking-widest text-accent-pink">Ejercicio práctico</div>
        <p className="text-[15px] mt-2 leading-relaxed">{exercise}</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Escribe aquí lo que sentiste hoy…"
          className="mt-3 w-full rounded-[10px] border-[1.5px] border-border bg-background p-3 text-[15px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
        />
      </div>

      <div className="mt-3 app-card p-4 flex items-center gap-3">
        <CalendarDays className="w-4 h-4 shrink-0 text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">Un día a la vez. Mañana se abre el siguiente paso de tu semana {weekOfDay(day)}.</p>
      </div>

      <button
        onClick={completeDay}
        disabled={complete}
        className={cn(
          "mt-4 w-full h-14 rounded-[12px] text-[17px] font-semibold inline-flex items-center justify-center gap-2 transition active:scale-[.97]",
          complete ? "bg-secondary text-muted-foreground" : "btn-primary-gradient"
        )}
      >
        {complete ? <><Check className="w-5 h-5" /> Día completado</> : <>Completar día · +40 hojas <ArrowRight className="w-5 h-5" /></>}
      </button>
    </div>
  );
}

function TopBar({ onBack, to, label }: { onBack?: () => void; to?: string; label: string }) {
  const inner = (
    <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-muted-foreground">
      <span className="w-11 h-11 rounded-[12px] bg-secondary grid place-items-center"><ArrowLeft className="w-5 h-5" /></span>
      <span className="truncate max-w-[220px]">{label}</span>
    </span>
  );
  if (to) return <Link to={to as never} className="inline-flex">{inner}</Link>;
  return <button onClick={onBack} className="inline-flex">{inner}</button>;
}
