import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getRecommendedFocuses, orderStages, resolveStageStates } from "@/lib/stage-order";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, Check, Lock, X, Leaf, RefreshCw, Sparkles, Flame, PenLine, HandHeart, ListChecks, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { saveStageReward } from "@/lib/rewards.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WordSearch } from "@/components/WordSearch";
import { getStageContent, getSolutionSteps, getStageTasks } from "@/lib/stage-content";
import { awardLeaf, ACTION_POINTS, type ActionLevel } from "@/lib/gems";
import { AnswerFeedback } from "@/components/AnswerFeedback";
import { useStagePack, stageVariant, type StagePack } from "@/lib/stage-pack";
import { msUntilAppDayReset, formatCountdown, APP_DAY_RESET_LABEL } from "@/lib/app-day";
import { CELEBRATIONS } from "@/lib/celebrate-step";
import heartCrystal from "@/assets/st-heart-crystal.png";
import chest from "@/assets/st-chest.png";
import robot from "@/assets/st-robot.png";
import caminoFe from "@/assets/st-camino-fe.png";
import heartGem from "@/assets/e3d-heartgem.png";
import star3d from "@/assets/e3d-star.png";
import brain3d from "@/assets/e3d-brain.png";
import tree from "@/assets/hojas-tree.png";

export const Route = createFileRoute("/_authenticated/etapas/$stageId")({
  head: () => ({
    meta: [
      { title: "Etapa de tu camino — Mi camino ORIGEN" },
      { name: "description", content: "Vive tu etapa en 13 pasos: lección, tareas, quiz, juegos y tu recompensa del día." },
      { property: "og:title", content: "Etapa de tu camino — Mi camino ORIGEN" },
      { property: "og:description", content: "Lección, tareas espirituales, quiz y juegos para sanar un día a la vez." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StageFlow,
});

const TOTAL_STEPS = 20;
const STAGE_XP = 120;

export type StepEntry = {
  step_key: string;
  kind: string;
  title: string | null;
  response: string | null;
  answers: Record<string, string>;
  confirmed: boolean;
};

function StageFlow() {
  const { stageId } = useParams({ from: "/_authenticated/etapas/$stageId" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const id = Number(stageId);

  const [step, setStep] = useState(1);
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [doneTasks, setDoneTasks] = useState<number[]>([]);
  const [openSteps, setOpenSteps] = useState<number[]>([]);
  const [earned, setEarned] = useState(0);
  const started = useMemo(() => Date.now(), []);
  const grantStageReward = useServerFn(saveStageReward);

  const { data } = useQuery({
    queryKey: ["stage", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [stage, progress, stages, entries, allProgress, intake] = await Promise.all([
        supabase.from("stages").select("*").eq("id", id).maybeSingle(),
        supabase.from("stage_progress").select("*").eq("user_id", user!.id).eq("stage_id", id).maybeSingle(),
        supabase.from("stages").select("id, focus_area").order("id"),
        supabase.from("stage_step_entries").select("*").eq("user_id", user!.id).eq("stage_id", id),
        supabase.from("stage_progress").select("stage_id, status, completed_at").eq("user_id", user!.id),
        supabase.from("intake_sessions").select("primary_focus, ai_plan").eq("user_id", user!.id).maybeSingle(),
      ]);
      const focuses = getRecommendedFocuses(intake.data);
      const ordered = orderStages((stages.data ?? []) as any[], focuses);
      const ids = ordered.map((s: any) => s.id);
      const idx = ids.indexOf(id);
      const states = resolveStageStates(ids, (allProgress.data ?? []) as any);
      const state = states.get(id) ?? "open";
      const lockedTomorrow = state === "locked-today";
      const lockedSequential = state === "locked-sequential";
      return {
        stage: stage.data,
        progress: progress.data,
        total: ids.length || 7,
        position: Math.max(1, idx + 1),
        entries: (entries.data ?? []) as any[],
        lockedTomorrow,
        lockedSequential,
      };
    },
  });

  const pack = useStagePack(id, data?.stage?.title ?? undefined, data?.stage?.focus_area ?? undefined);

  useEffect(() => {
    if (data?.progress) {
      setNotes(data.progress.notes ?? "");
      setDoneTasks((data.progress.completed_tasks as number[]) ?? []);
    }
  }, [data?.progress]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  if (!data?.stage) {
    return (
      <div className="min-h-dvh grid place-items-center px-6">
        <div className="w-full max-w-sm space-y-3">
          <div className="h-8 w-40 rounded-full bg-muted animate-pulse" />
          <div className="h-52 rounded-[16px] bg-muted animate-pulse" />
          <div className="h-24 rounded-[16px] bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const stage = data.stage;
  const content = getStageContent(stage.focus_area, id);
  const p0: StagePack | undefined = pack.data;
  const tasks = p0?.tasks?.length === 4 ? p0.tasks : getStageTasks(stage.focus_area);
  const solutionSteps = p0?.solutions?.length === 4 ? p0.solutions : getSolutionSteps(stage.focus_area);
  const position = data.position;
  const entries: any[] = data.entries;

  if (data.progress?.status === "completed") {
    return <CompletedStageView stage={stage} position={position} total={data.total} onBack={() => navigate({ to: "/etapas" })} />;
  }

  if (data.lockedTomorrow || data.lockedSequential) {
    return (
      <LockedStageView
        tomorrow={data.lockedTomorrow}
        onBack={() => navigate({ to: "/etapas" })}
      />
    );
  }

  function reward(level: ActionLevel, reason: string) {
    awardLeaf("etapas", level, reason, { stage: id }).then((r) => {
      setEarned((e) => e + r.granted);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    });
  }


  async function saveEntry(entry: { step_key: string; kind: string; title: string; response?: string; answers?: Record<string, string>; confirmed: boolean }) {
    if (!user) return;
    const { error } = await supabase.from("stage_step_entries").upsert({
      user_id: user.id,
      stage_id: id,
      step_key: entry.step_key,
      kind: entry.kind,
      title: entry.title,
      response: entry.response ?? null,
      answers: (entry.answers ?? {}) as never,
      confirmed: entry.confirmed,
    }, { onConflict: "user_id,stage_id,step_key" });
    if (error) {
      toast.error("No pudimos guardar: " + error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["stage", id] });
    toast.success("Registro guardado");
    return;
  }

  async function saveReward() {
    if (!user) return;
    await grantStageReward({
      data: {
        stageId: id,
        xp: STAGE_XP,
        leaves: Math.min(Math.max(earned, 0), 100),
        insignia: insigniaFor(stage.title, position),
      },
    });
    qc.invalidateQueries({ queryKey: ["stage-rewards"] });
    qc.invalidateQueries({ queryKey: ["etapas"] });
    qc.invalidateQueries({ queryKey: ["perfil"] });
  }

  async function finish() {
    if (!user) return;
    const { error } = await supabase.from("stage_progress").upsert({
      user_id: user.id,
      stage_id: id,
      notes,
      completed_tasks: doneTasks,
      status: "completed",
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,stage_id" });
    if (error) return toast.error(error.message);
    await supabase.from("daily_activity").upsert({
      user_id: user.id,
      activity_date: new Date().toISOString().slice(0, 10),
      activity_type: "stage_completed",
      reference_id: String(id),
      metadata: { title: stage.title },
    }, { onConflict: "user_id,activity_date,activity_type,reference_id" });
    qc.invalidateQueries({ queryKey: ["etapas"] });
    qc.invalidateQueries({ queryKey: ["stage"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    CELEBRATIONS.etapaCamino();
    navigate({ to: "/etapas" });
  }

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const minutes = Math.max(1, Math.round((Date.now() - started) / 60000));
  const p: StagePack | undefined = pack.data;

  const shell = (node: React.ReactNode, opts?: { dark?: boolean }) => (
    <StepShell step={step} position={position} total={data.total} dark={opts?.dark} onClose={() => navigate({ to: "/etapas" })}>
      {node}
    </StepShell>
  );

  switch (step) {
    case 1:
      return shell(<Step1 stage={stage} position={position} onNext={next} />);
    case 2:
      return shell(<Step2 steps={solutionSteps} open={openSteps} setOpen={setOpenSteps} entries={entries} onSave={saveEntry} onNext={next} />);
    case 3:
      return shell(<Step3 tasks={tasks} done={doneTasks} setDone={setDoneTasks} entries={entries} onSave={saveEntry} reward={reward} onNext={next} />);
    case 4:
      return shell(<Step5 items={content.quiz} reward={reward} onNext={next} />);
    case 5:
      return shell(<Step6 cargas={p?.cargas ?? []} loading={pack.isLoading} reward={reward} onNext={next} />);
    case 6:
      return shell(<Step7 words={p?.words?.length ? p.words : content.words} loading={pack.isLoading} stageId={id} onNext={next} />);
    case 7:
      return shell(<Step8 promesas={p?.promesas ?? []} loading={pack.isLoading} reward={reward} onNext={next} />);
    case 8:
      return shell(<Step9 questions={p?.fe ?? []} loading={pack.isLoading} reward={reward} onNext={next} />);
    case 9:
      return shell(<Step10 bienestar={p?.bienestar ?? []} reward={reward} onNext={next} />);
    case 10:
      return shell(<Step4 mood={mood} setMood={setMood} notes={notes} setNotes={setNotes} answers={answers} setAnswers={setAnswers} onNext={next} />);
    case 11:
      return shell(<Step11 minutes={minutes} tasksDone={doneTasks.length >= tasks.length} onNext={next} />);
    case 12:
      return shell(<Step12 earned={earned} insignia={insigniaFor(stage.title, position)} onSave={saveReward} onNext={next} />);
    default:
      return shell(<Step13 stage={stage} position={position} total={data.total} onFinish={finish} />);
  }
}

function insigniaFor(title: string | null, position: number) {
  const map = ["Corazón que sana", "Raíz liberada", "Alma en paz", "Identidad restaurada", "Perdón vivo", "Fe firme", "Propósito claro", "Linaje bendecido"];
  return map[(position - 1) % map.length] || title || "Corazón que sana";
}

/* ───────────────────────── Shell común ───────────────────────── */

function StepShell({ step, position, total, dark, onClose, children }: {
  step: number; position: number; total: number; dark?: boolean; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-dvh"
      style={dark
        ? { background: "radial-gradient(120% 80% at 50% 0%, #2E1A4D 0%, #1E1033 60%, #150C24 100%)" }
        : { background: "radial-gradient(120% 80% at 50% 0%, #F6EFFF 0%, #FDFBFF 55%, #FFF0F8 100%)" }}
    >
      <div className="max-w-[520px] mx-auto px-4 py-4 mobile-safe-bottom lg:pb-10">
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <span className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-accent-pink to-primary text-white grid place-items-center font-display font-extrabold text-[15px] shadow-soft">{position}</span>
          <span className={cn("text-center text-[12px] font-bold leading-tight", dark ? "text-white/75" : "text-primary")}>
            Paso {step} de {TOTAL_STEPS}
          </span>

          <button onClick={onClose} aria-label="Cerrar etapa" className={cn("w-11 h-11 shrink-0 grid place-items-center rounded-full transition active:scale-95", dark ? "text-white/80 hover:bg-white/10" : "text-muted-foreground hover:bg-primary/8")}>
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="mt-3 flex items-center gap-1.5" aria-label={`Paso ${step} de ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", i + 1 <= step ? "bg-primary" : dark ? "bg-white/18" : "bg-primary/15")} />
          ))}
        </div>

        <div key={step} className="mt-5" style={{ animation: "fade-in .4s ease-out both" }}>{children}</div>
      </div>
    </div>
  );
}

function Cta({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="mt-5 w-full h-[54px] rounded-[12px] text-[16px] font-semibold bg-gradient-to-r from-accent-pink to-primary text-white"
      style={{ boxShadow: "0 4px 14px rgba(124,92,255,0.3)" }}
    >
      {children} <ArrowRight className="w-4 h-4 ml-1.5" />
    </Button>
  );
}

function Hojas({ level }: { level: ActionLevel }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-[#3FBE8F] shrink-0">
      +{ACTION_POINTS[level]}% <Leaf className="w-3.5 h-3.5" />
    </span>
  );
}


function LoadingPack({ label }: { label: string }) {
  return (
    <div className="rounded-[16px] bg-card border border-border p-6 text-center shadow-soft">
      <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
      <p className="mt-2 text-[13px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* ───────────────────────── 1 · Lección ───────────────────────── */

function Step1({ stage, position, onNext }: { stage: any; position: number; onNext: () => void }) {
  const minis = [
    { emoji: "💜", t: "Sanarás heridas" },
    { emoji: "✨", t: "Liberarás emociones" },
    { emoji: "🕊️", t: "Vivirás en libertad" },
  ];
  return (
    <div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
        <span className="w-7 h-7 shrink-0 rounded-full bg-accent-pink text-white grid place-items-center text-[13px] font-extrabold">1</span>
        <h1 className="font-display font-extrabold text-[26px] leading-tight">¿Qué trabajarás en esta etapa?</h1>
        <span className="text-2xl shrink-0">🎈</span>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-[16px] min-h-[220px] grid place-items-center" style={{ background: "linear-gradient(180deg,#FDE7F4 0%,#F7D9F0 60%,#FFF3FA 100%)" }}>
        <img src={heartCrystal} alt="Corazón de cristal en sanación" width={1024} height={1024} className="w-[68%] max-w-[240px] object-contain" style={{ animation: "scale-in .6s ease-out both" }} />
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
        {stage.deep_explanation || stage.reflection || "Trabajarás heridas emocionales del pasado como el dolor, el rechazo, la tristeza, la culpa o el enojo. Aprenderás a liberarlas y permitir que Dios sane tu corazón."}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {minis.map((m) => (
          <div key={m.t} className="rounded-[16px] bg-card border border-border p-3 text-center shadow-soft">
            <div className="text-[26px] leading-none">{m.emoji}</div>
            <div className="mt-1.5 text-[12px] font-bold leading-snug">{m.t}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-[16px] bg-card border border-border shadow-soft">
        <div className="px-4 pt-3.5 pb-2">
          <div className="text-[13px] font-extrabold text-primary">🎧 Video guía para acompañar esta etapa</div>
          <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">Ponlo de fondo mientras haces tus ejercicios.</p>
        </div>
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${stage.title} oración cristiana sanación interior`)}`}
            target="_blank"
            rel="noreferrer"
            className="grid h-[180px] w-full place-items-center rounded-[12px] bg-primary/10 text-center text-[14px] font-bold text-primary"
          >
            Ver videos guía sobre “{stage.title}” en YouTube
          </a>
        </div>
      </div>

      <div className="mt-4 rounded-[16px] bg-primary/8 p-4">
        <div className="text-[13px] font-extrabold text-primary">💡 Consejo práctico</div>
        <p className="text-[13.5px] leading-snug mt-1.5">
          {stage.recommended_action || "Escribe una carta de liberación a ti mismo o a alguien del pasado y entrégala a Dios en oración."}
        </p>
      </div>

      <Cta onClick={onNext}>¡Entendido! Continuar</Cta>
    </div>
  );
}

/* ───────────────────── 2 · Soluciones paso a paso ───────────────────── */

const DEFAULT_SOLUTIONS = [
  "Reconoce la herida. Acepta lo que pasó sin negarlo.",
  "Comprende el origen. Entiende cómo esa herida se formó.",
  "Perdona y suelta. Decide liberar el dolor y el rencor.",
  "Declara la verdad. Habla la verdad de Dios sobre tu vida.",
  "Ora por sanidad. Entrega la situación a Dios.",
  "Agradece y descansa. Confía en que Dios ya está obrando.",
];

type SaveFn = (e: { step_key: string; kind: string; title: string; response?: string; answers?: Record<string, string>; confirmed: boolean }) => Promise<void>;

function Step2({ steps, open, setOpen, entries, onSave, onNext }: {
  steps: string[]; open: number[]; setOpen: (v: number[]) => void; entries: any[]; onSave: SaveFn; onNext: () => void;
}) {
  const list = steps.length ? steps : DEFAULT_SOLUTIONS;
  const [active, setActive] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const savedKeys = new Set(entries.filter((e) => e.confirmed).map((e) => e.step_key));
  const doneIdx = list.map((_, i) => i).filter((i) => open.includes(i) || savedKeys.has(`sol-${i}`));
  const maxUnlocked = doneIdx.length;
  const allDone = doneIdx.length >= list.length;

  function openStep(i: number) {
    const prev = entries.find((e) => e.step_key === `sol-${i}`);
    setText(prev?.response ?? "");
    setActive(i);
  }

  async function confirm() {
    if (active === null) return;
    setSaving(true);
    const [title] = list[active].split(/[.·:]\s*/);
    await onSave({ step_key: `sol-${active}`, kind: "solucion", title, response: text.trim(), confirmed: true });
    setSaving(false);
    setOpen(Array.from(new Set([...open, active])));
    setActive(null);
    setText("");
  }

  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Soluciones paso a paso 🚀</h1>
      <p className="text-center text-[13px] text-muted-foreground mt-1">Abre cada paso, complétalo y guarda tu registro.</p>

      <div className="mt-5 space-y-3">
        {list.map((s, i) => {
          const [title, ...rest] = s.split(/[.·:]\s*/);
          const desc = rest.join(". ");
          const done = doneIdx.includes(i);
          const unlocked = i <= maxUnlocked;
          const current = unlocked && !done;
          return (
            <button
              key={i}
              disabled={!unlocked}
              onClick={() => openStep(i)}
              className={cn(
                "w-full text-left rounded-[16px] bg-card border border-border p-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 shadow-soft transition active:scale-[.98]",
                current && "border-2 border-primary",
                !unlocked && "opacity-70",
              )}
            >
              <span className={cn("w-8 h-8 shrink-0 rounded-full grid place-items-center text-[13px] font-extrabold",
                done ? "bg-[#3FBE8F] text-white" : current ? "bg-primary text-white" : "bg-primary/10 text-primary")}>{i + 1}</span>
              <span className="min-w-0">
                <span className={cn("block font-display font-bold text-[15px] leading-tight", current && "text-primary")}>{title}</span>
                {desc && <span className="block text-[12.5px] text-muted-foreground leading-snug mt-0.5">{desc}</span>}
              </span>
              {done ? <Check className="w-5 h-5 shrink-0 text-[#3FBE8F]" /> : unlocked ? <PenLine className="w-4 h-4 shrink-0 text-primary" /> : <Lock className="w-4 h-4 shrink-0 text-muted-foreground" />}
            </button>
          );
        })}
      </div>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-[440px] rounded-[16px]">
          <DialogHeader>
            <DialogTitle className="font-display text-[19px] leading-tight text-left">
              {active !== null ? list[active].split(/[.·:]\s*/)[0] : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13.5px] text-muted-foreground leading-snug">
            {active !== null ? list[active] : ""}
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 400))}
            placeholder="Escribe aquí cómo lo aplicaste hoy, con tus palabras…"
            className="min-h-[110px] rounded-[10px] text-[13.5px]"
          />
          <div className="text-right text-[11px] text-muted-foreground -mt-2">{text.length}/400</div>
          <Button onClick={confirm} disabled={saving || text.trim().length < 3}
            className="h-[52px] rounded-[12px] text-[15px] font-semibold bg-gradient-to-r from-accent-pink to-primary text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirmar y guardar <Check className="w-4 h-4 ml-1.5" /></>}
          </Button>
        </DialogContent>
      </Dialog>

      <Cta onClick={onNext} disabled={!allDone}>{allDone ? "Continuar con el paso 3" : `Te faltan ${list.length - doneIdx.length} pasos`}</Cta>
    </div>
  );
}

/* ───────────────────── 3 · Tareas espirituales ───────────────────── */

const DEFAULT_TASKS = [
  "Escribe una carta de liberación (no se la entregas)",
  "Identifica 1 herida emocional y llévala a oración",
  "Ora la oración de sanidad del alma",
  "Declara en voz alta 3 verdades de Dios sobre ti",
  "Escucha la oración guiada de sanidad",
  "Respiración consciente 3 minutos con la presencia de Dios",
];

const ORACION_LIBERACION = `Padre, hoy me presento delante de ti con mi historia completa.
Reconozco las cargas que vienen de mi línea familiar: lo que se repitió en mi casa, lo que dolió y nadie nombró.
Hoy decido soltar el rencor, la culpa y el miedo que no me pertenecen.
Devuelvo con respeto lo que fue de mis padres y de mis abuelos, y me quedo solo con la bendición.
Corto todo pacto y toda deuda que me ata al pasado, y elijo caminar libre.
Te entrego mi mente, mis emociones y mis relaciones. Sáname donde solo tú puedes llegar.
Gracias porque desde hoy mi vida escribe una historia nueva. Amén.`;

const IDENTIFICA_QS = [
  { key: "q1", q: "¿En qué parte de tu cuerpo sientes esta herida?", options: ["Pecho", "Estómago", "Garganta", "Cabeza"] },
  { key: "q2", q: "¿A qué edad recuerdas haberla sentido por primera vez?", options: ["Niñez", "Adolescencia", "Adultez", "No lo sé"] },
  { key: "q3", q: "¿De qué lado de tu familia crees que viene?", options: ["Materno", "Paterno", "Ambos", "No lo sé"] },
];

type TaskKind = "nota" | "identificar" | "oracion" | "confirmar";

function taskKind(t: string): TaskKind {
  const s = t.toLowerCase();
  if (/(escrib|carta|diario|anota|redacta)/.test(s)) return "nota";
  if (/(identific|reconoc|detect|descubr)/.test(s)) return "identificar";
  if (/(ora|oración|oracion|declara|libera)/.test(s)) return "oracion";
  return "confirmar";
}

function Step3({ tasks, done, setDone, entries, onSave, reward, onNext }: {
  tasks: string[]; done: number[]; setDone: (v: number[]) => void; entries: any[]; onSave: SaveFn;
  reward: (level: ActionLevel, r: string) => void; onNext: () => void;
}) {
  const list = tasks.length ? tasks : DEFAULT_TASKS;
  const EMOJIS = ["📝", "⭐", "🙏", "📖", "🎧", "💜"];
  const [active, setActive] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [quiz, setQuiz] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const savedKeys = new Set(entries.filter((e) => e.confirmed).map((e) => e.step_key));
  const doneIdx = Array.from(new Set([...done, ...list.map((_, i) => i).filter((i) => savedKeys.has(`task-${i}`))]));
  const all = doneIdx.length >= list.length;
  const kind = active !== null ? taskKind(list[active]) : "confirmar";

  function openTask(i: number) {
    const prev = entries.find((e) => e.step_key === `task-${i}`);
    setText(prev?.response ?? "");
    setQuiz((prev?.answers as Record<string, string>) ?? {});
    setActive(i);
  }

  const canConfirm =
    kind === "nota" ? text.trim().length >= 5
      : kind === "identificar" ? IDENTIFICA_QS.every((q) => quiz[q.key]) && text.trim().length >= 3
        : true;

  async function confirm() {
    if (active === null) return;
    setSaving(true);
    await onSave({
      step_key: `task-${active}`,
      kind,
      title: list[active],
      response: text.trim(),
      answers: quiz,
      confirmed: true,
    });
    setSaving(false);
    if (!doneIdx.includes(active)) {
      setDone([...doneIdx, active]);
      reward("medium", "stage_task");
    }
    setActive(null);
    setText("");
    setQuiz({});
  }

  const kindIcon = { nota: PenLine, identificar: ListChecks, oracion: HandHeart, confirmar: Check }[kind];
  const KindIcon = kindIcon;

  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Tareas espirituales 📋</h1>
      <p className="text-center text-[13px] text-muted-foreground mt-1">Toca cada tarea, complétala en su ventana y guárdala.</p>

      <div className="mt-5 space-y-2.5">
        {list.map((t, i) => (
          <button key={i} onClick={() => openTask(i)} className="w-full text-left rounded-[16px] bg-card border border-border p-3.5 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2.5 shadow-soft transition active:scale-[.98]">
            <span className="w-9 h-9 shrink-0 rounded-[10px] bg-primary/8 grid place-items-center text-[18px]">{EMOJIS[i % EMOJIS.length]}</span>
            <span className={cn("min-w-0 text-[13.5px] leading-snug font-medium", doneIdx.includes(i) && "text-muted-foreground line-through")}>{t}</span>
            <Hojas level="medium" />
            <span className={cn("w-6 h-6 shrink-0 rounded-full grid place-items-center border-2", doneIdx.includes(i) ? "bg-[#3FBE8F] border-[#3FBE8F] text-white" : "border-primary/25")}>
              {doneIdx.includes(i) && <Check className="w-3.5 h-3.5" />}
            </span>
          </button>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-[440px] rounded-[16px] max-h-[86dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] leading-tight text-left inline-flex items-start gap-2">
              <span className="w-8 h-8 shrink-0 rounded-[10px] bg-primary/10 text-primary grid place-items-center"><KindIcon className="w-4 h-4" /></span>
              <span className="min-w-0">{active !== null ? list[active] : ""}</span>
            </DialogTitle>
          </DialogHeader>

          {kind === "oracion" && (
            <div className="rounded-[12px] bg-primary/8 p-4">
              <p className="scripture text-[13.5px] leading-relaxed whitespace-pre-line">{ORACION_LIBERACION}</p>
            </div>
          )}

          {kind === "identificar" && (
            <div className="space-y-3">
              {IDENTIFICA_QS.map((q) => (
                <div key={q.key}>
                  <p className="text-[13px] font-bold">{q.q}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.options.map((o) => (
                      <button key={o} onClick={() => setQuiz((a) => ({ ...a, [q.key]: o }))}
                        className={cn("h-9 rounded-[10px] px-3 text-[12.5px] font-semibold transition active:scale-95",
                          quiz[q.key] === o ? "bg-primary text-white" : "bg-primary/8 text-foreground")}>{o}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {kind !== "confirmar" && (
            <>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 500))}
                placeholder={kind === "nota" ? "Escribe aquí tu carta o tu nota…" : "Escribe tu conclusión: ¿qué herida identificaste?"}
                className="min-h-[110px] rounded-[10px] text-[13.5px]"
              />
              <div className="text-right text-[11px] text-muted-foreground -mt-2">{text.length}/500</div>
            </>
          )}

          {kind === "confirmar" && (
            <p className="text-[13.5px] text-muted-foreground leading-snug">Cuando la hayas realizado, confirma abajo para guardar tu registro.</p>
          )}

          <Button onClick={confirm} disabled={saving || !canConfirm}
            className="h-[52px] rounded-[12px] text-[15px] font-semibold bg-gradient-to-r from-accent-pink to-primary text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{kind === "oracion" ? "Confirmo que la realicé" : "Guardar y confirmar"} <Check className="w-4 h-4 ml-1.5" /></>}
          </Button>
        </DialogContent>
      </Dialog>

      {all && (
        <div className="relative mt-4 overflow-hidden rounded-[16px] p-4 pr-28 text-white" style={{ background: "linear-gradient(135deg,#7C5CFF 0%,#A855F7 55%,#F58BCB 100%)", animation: "scale-in .35s ease-out both" }}>
          <div className="font-display font-extrabold text-[19px]">¡Excelente! 🎉</div>
          <p className="text-[12.5px] text-white/85 mt-1">Has completado todas las tareas</p>
          <p className="font-display font-extrabold text-[20px] mt-2 leading-tight">+{ACTION_POINTS.major}% de tu<br />próxima hoja 🌿</p>
          <img src={chest} alt="" aria-hidden width={1024} height={1024} loading="lazy" className="pointer-events-none absolute right-0 bottom-0 w-28 object-contain" />
        </div>
      )}

      <Cta onClick={onNext} disabled={!all}>{all ? "Continuar" : "Completa las tareas"}</Cta>
    </div>
  );
}

/* ───────────────────── 4 · Notas personales ───────────────────── */

const MOODS = ["Triste 😔", "Enojado 😠", "Cansado 😮‍💨", "En paz 🙂", "Esperanzado 🌱"];

function Step4({ mood, setMood, notes, setNotes, answers, setAnswers, onNext }: {
  mood: string | null; setMood: (v: string) => void; notes: string; setNotes: (v: string) => void;
  answers: Record<string, string>; setAnswers: (v: Record<string, string>) => void; onNext: () => void;
}) {
  const fields = [
    { key: "descubri", n: 2, q: "¿Qué descubriste sobre ti?", icon: "🔎", ph: "Descubrí que aún me duele que me hayan rechazado." },
    { key: "entregar", n: 3, q: "¿Qué quieres entregar a Dios?", icon: "🕊️", ph: "Mi dolor, mi pasado y mi miedo a no ser suficiente." },
    { key: "aprendi", n: 4, q: "¿Qué aprendiste hoy?", icon: "💜", ph: "Que Dios me ama tal como soy y quiere sanarme." },
  ];
  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Notas personales 💗</h1>

      <div className="mt-5 rounded-[16px] bg-card border border-border p-4 shadow-soft">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 items-center">
          <span className="w-6 h-6 rounded-full bg-accent-pink text-white grid place-items-center text-[11px] font-extrabold">1</span>
          <span className="text-[14px] font-bold">¿Cómo te sentiste hoy?</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m} onClick={() => setMood(m)}
              className={cn("h-9 rounded-[10px] px-3 text-[12.5px] font-semibold transition active:scale-95",
                mood === m ? "bg-primary text-white" : "bg-primary/8 text-foreground")}>{m}</button>
          ))}
        </div>
      </div>

      {fields.map((f) => (
        <div key={f.key} className="mt-3 rounded-[16px] bg-card border border-border p-4 shadow-soft">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-center">
            <span className="w-6 h-6 rounded-full bg-accent-pink text-white grid place-items-center text-[11px] font-extrabold">{f.n}</span>
            <span className="min-w-0 truncate text-[14px] font-bold">{f.q}</span>
            <span className="text-[15px]">{f.icon}</span>
          </div>
          <Textarea
            value={f.key === "aprendi" ? notes : answers[f.key] ?? ""}
            onChange={(e) => f.key === "aprendi" ? setNotes(e.target.value.slice(0, 150)) : setAnswers({ ...answers, [f.key]: e.target.value.slice(0, 150) })}
            placeholder={f.ph}
            className="mt-2.5 min-h-[76px] rounded-[10px] text-[13.5px]"
          />
          <div className="mt-1 text-right text-[11px] text-muted-foreground">
            {(f.key === "aprendi" ? notes : answers[f.key] ?? "").length}/150
          </div>
        </div>
      ))}

      <div className="relative mt-3 overflow-hidden rounded-[16px] bg-primary/8 p-4 pr-24">
        <div className="text-[13px] font-extrabold text-primary">Reflexión IA 💜</div>
        <p className="text-[13px] leading-snug mt-1.5">Veo un corazón valiente. Estás sanando partes profundas de tu historia. Sigue así, estás avanzando.</p>
        <img src={robot} alt="" aria-hidden width={1024} height={1024} loading="lazy" className="pointer-events-none absolute -right-1 bottom-0 w-20 object-contain" />
      </div>

      <Cta onClick={onNext}>Continuar</Cta>
    </div>
  );
}

/* ───────────────────────── 5 · Mini quiz ───────────────────────── */

function Step5({ items, reward, onNext }: { items: { q: string; options: string[]; correct: number; tip: string }[]; reward: (level: ActionLevel, r: string) => void; onNext: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"ok" | "fail" | null>(null);
  const it = items[i];
  const letters = ["A", "B", "C", "D"];
  const last = i >= items.length - 1;

  function pick(oi: number) {
    if (picked !== null) return;
    setPicked(oi);
    if (oi === it.correct) {
      reward("medium", "stage_quiz_correct");
      setFeedback("ok");
    } else {
      setFeedback("fail");
    }
  }

  return (
    <div>
      <AnswerFeedback state={feedback} message={it.tip} onClose={() => setFeedback(null)} />
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Mini quiz 🧠</h1>
      <p className="text-center text-[12.5px] text-muted-foreground mt-1">Pregunta {i + 1} de {items.length}</p>

      <p className="mt-5 font-display font-extrabold text-[19px] leading-tight">{it.q}</p>

      <div className="mt-4 space-y-2.5">
        {it.options.map((op, oi) => {
          const isCorrect = oi === it.correct;
          const revealed = picked !== null;
          return (
            <button key={oi} onClick={() => pick(oi)}
              className={cn("w-full text-left rounded-[12px] bg-card border border-border p-3.5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 shadow-soft text-[13.5px] font-medium transition active:scale-[.98]",
                revealed && isCorrect && "bg-[#2F9A73] text-white border-[#2F9A73]",
                revealed && !isCorrect && picked === oi && "bg-[#D64545]/12 text-[#B91C1C] border-[#D64545]/40",
                revealed && !isCorrect && picked !== oi && "opacity-60")}>
              <span className={cn("w-6 h-6 shrink-0 rounded-full grid place-items-center text-[11px] font-extrabold",
                revealed && isCorrect ? "bg-white/25 text-white" : "bg-primary/10 text-primary")}>{letters[oi]}</span>
              <span className="min-w-0">{op}</span>
              {revealed && isCorrect && <Check className="w-4 h-4 shrink-0" />}
              {revealed && !isCorrect && picked === oi && <X className="w-4 h-4 shrink-0" />}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="relative mt-4 overflow-hidden rounded-[16px] bg-primary/8 p-4 pl-24" style={{ animation: "scale-in .3s ease-out both" }}>
          <img src={robot} alt="" aria-hidden width={1024} height={1024} loading="lazy" className="pointer-events-none absolute left-0 bottom-0 w-20 object-contain" />
          <div className={cn("text-[13px] font-extrabold", picked === it.correct ? "text-[#2F9A73]" : "text-[#B91C1C]")}>{picked === it.correct ? "¡Correcto! 🎉" : "Respuesta incorrecta 💜"}</div>
          <p className="text-[12.5px] leading-snug mt-1">{it.tip}</p>
          {picked === it.correct && <p className="mt-1.5 font-extrabold text-[13px] text-[#3FBE8F] inline-flex items-center gap-1">+{ACTION_POINTS.medium}% de tu próxima hoja <Leaf className="w-3.5 h-3.5" /></p>}
        </div>
      )}


      <div className="mt-4 h-1.5 rounded-full bg-primary/12 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent-pink transition-all duration-500" style={{ width: `${((i + (picked !== null ? 1 : 0)) / items.length) * 100}%` }} />
      </div>
      <p className="text-right text-[11px] text-muted-foreground mt-1">{i + 1}/{items.length}</p>

      <Cta
        disabled={picked === null}
        onClick={() => { if (last) return onNext(); setI(i + 1); setPicked(null); }}
      >
        {last ? "Continuar" : "Siguiente pregunta"}
      </Cta>
    </div>
  );
}

/* ─────────────── 6 · Juego interactivo: cargas al cofre ─────────────── */

function Step6({ cargas, loading, reward, onNext }: { cargas?: string[]; loading: boolean; reward: (level: ActionLevel, r: string) => void; onNext: () => void }) {
  const list = useMemo(() => (cargas?.length ? cargas.slice(0, 15) : []), [cargas]);
  const [freed, setFreed] = useState<string[]>([]);
  const done = list.length > 0 && freed.length === list.length;

  function free(c: string) {
    if (freed.includes(c)) return;
    const next = [...freed, c];
    setFreed(next);
    if (next.length === list.length) reward("major", "stage_game_cargas");
  }

  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Juego interactivo 🎮</h1>
      <p className="text-center text-[13px] text-muted-foreground mt-1">Toca las 15 cargas para soltarlas en el cofre de liberación</p>

      {loading || !list.length ? (
        <div className="mt-5"><LoadingPack label="Preparando tus cargas de hoy…" /></div>
      ) : (
        <>
          <div
            className="relative mt-5 overflow-hidden rounded-[16px] p-4 pb-40 min-h-[420px]"
            style={{ background: "linear-gradient(180deg,#EFE6FF 0%,#F7EDFF 45%,#FFF1F9 100%)" }}
          >
            <div aria-hidden className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(60% 40% at 50% 95%, rgba(124,92,255,0.18) 0%, transparent 70%)" }} />
            <div className="relative flex flex-wrap justify-center gap-2.5">
              {list.map((c) => {
                const gone = freed.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => free(c)}
                    className={cn(
                      "rounded-full bg-card text-foreground px-4 py-2.5 text-[13px] font-bold shadow-soft border border-primary/12 transition-all duration-500 active:scale-95",
                      gone && "opacity-0 translate-y-24 scale-50 pointer-events-none",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <img src={chest} alt="Cofre de liberación" width={1024} height={1024} className="absolute left-1/2 bottom-0 -translate-x-1/2 w-40 object-contain drop-shadow-xl" />
          </div>

          <div className="mt-4 rounded-[16px] bg-card border border-border p-4 shadow-soft">
            <p className="text-[13.5px] font-bold">{done ? "¡Muy bien! Has liberado todas las cargas 🎉" : "Sigue así, tu corazón se hace ligero"}</p>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="h-2 rounded-full bg-primary/12 overflow-hidden">
                <div className="h-full rounded-full bg-[#3FBE8F] transition-all duration-500" style={{ width: `${(freed.length / list.length) * 100}%` }} />
              </div>
              <span className="text-[12px] font-bold shrink-0">{freed.length}/{list.length} liberadas</span>
            </div>
            {done && <p className="mt-2 text-[13px] font-extrabold text-[#2F9A73] inline-flex items-center gap-1">+{ACTION_POINTS.medium}% de tu próxima hoja <Leaf className="w-3.5 h-3.5" /></p>}
          </div>
        </>
      )}

      <Cta onClick={onNext} disabled={!done}>Continuar</Cta>
    </div>
  );
}

/* ───────────────────── 7 · Sopa de letras ───────────────────── */

function Step7({ words, loading, stageId, onNext }: { words: string[]; loading: boolean; stageId: number; onNext: () => void }) {
  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Sopa de letras espiritual 🔍</h1>
      <p className="text-center text-[13px] text-muted-foreground mt-1">Palabras nuevas cada día, según el tema de tu etapa.</p>
      {loading ? (
        <div className="mt-4"><LoadingPack label="Creando tu sopa de letras original…" /></div>
      ) : (
        <div className="mt-4"><WordSearch words={words} storageKey={`stage-${stageVariant(stageId)}`} /></div>
      )}
      <div className="relative mt-3 overflow-hidden rounded-[16px] bg-[#3FBE8F]/10 p-4 pr-24">
        <p className="text-[13.5px] font-bold">¡Excelente! Cada palabra que encuentras se graba en tu memoria.</p>
        <p className="mt-1 font-extrabold text-[14px] text-[#2F9A73] inline-flex items-center gap-1">+{ACTION_POINTS.medium}% de tu próxima hoja <Leaf className="w-4 h-4" /></p>
        <img src={tree} alt="" aria-hidden width={512} height={512} loading="lazy" className="pointer-events-none absolute right-0 bottom-0 w-20 object-contain" />
      </div>
      <Cta onClick={onNext}>Continuar</Cta>
    </div>
  );
}

/* ───────────────── 8 · Memoria de promesas ───────────────── */

const PAIRS_COUNT = 10;

function Step8({ promesas, loading, reward, onNext }: { promesas?: string[]; loading: boolean; reward: (level: ActionLevel, r: string) => void; onNext: () => void }) {
  const pool = promesas?.length ? promesas : [];
  const [round, setRound] = useState(0);
  const cards = useMemo(() => {
    if (!pool.length) return [] as { pair: number; text: string }[];
    const uniq = Array.from(new Set(pool));
    const picked = [...uniq].sort(() => Math.random() - 0.5).slice(0, Math.min(PAIRS_COUNT, uniq.length));
    return picked
      .flatMap((p, i) => [{ pair: i, text: p }, { pair: i, text: p }])
      .sort(() => Math.random() - 0.5);
  }, [pool, round]);

  const pairsTotal = cards.length / 2;
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const done = pairsTotal > 0 && found.length === pairsTotal;

  function tap(idx: number, pair: number) {
    if (found.includes(pair) || open.includes(idx) || open.length === 2) return;
    const nextOpen = [...open, idx];
    setOpen(nextOpen);
    if (nextOpen.length === 2) {
      const same = cards[nextOpen[0]].pair === cards[nextOpen[1]].pair;
      setTimeout(() => {
        if (same) {
          const nf = [...found, cards[nextOpen[0]].pair];
          setFound(nf);
          if (nf.length === pairsTotal) reward("major", "stage_memory_pairs");
        }
        setOpen([]);
      }, same ? 320 : 720);
    }
  }

  if (loading || !cards.length) {
    return (
      <div>
        <h1 className="font-display font-extrabold text-[24px] leading-tight text-center">Memoria de promesas 🌸</h1>
        <div className="mt-4"><LoadingPack label="Buscando promesas nuevas para ti…" /></div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h1 className="font-display font-extrabold text-[24px] leading-tight">Juego: Memoria de promesas 🌸</h1>
        <button onClick={() => { setRound((r) => r + 1); setOpen([]); setFound([]); }} aria-label="Nuevas promesas"
          className="w-11 h-11 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center active:scale-95 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[13px] text-muted-foreground mt-1">{pairsTotal} pares nuevos, tomados de {new Set(pool).size} promesas de esta etapa.</p>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {cards.map((c, idx) => {
          const shown = open.includes(idx) || found.includes(c.pair);
          return (
            <button key={idx} onClick={() => tap(idx, c.pair)}
              className={cn("min-h-[76px] rounded-[14px] p-1.5 text-[9.5px] font-bold leading-tight grid place-items-center text-center transition active:scale-[.97] shadow-soft",
                found.includes(c.pair) ? "bg-accent-pink/15 border-2 border-accent-pink" : shown ? "bg-primary/10 border-2 border-primary" : "bg-primary/5 border border-primary/15 text-primary/40")}>
              {shown ? <span>{c.text}</span> : <span className="text-[20px]">❓</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="h-2 rounded-full bg-primary/12 overflow-hidden">
          <div className="h-full rounded-full bg-accent-pink transition-all duration-500" style={{ width: `${(found.length / pairsTotal) * 100}%` }} />
        </div>
        <span className="text-[12px] font-bold shrink-0">{found.length}/{pairsTotal}</span>
      </div>

      {done && (
        <div className="relative mt-4 overflow-hidden rounded-[16px] bg-accent-pink/12 p-4 pr-24" style={{ animation: "scale-in .3s ease-out both" }}>
          <p className="font-display font-extrabold text-[17px] text-primary">¡Excelente! ✨</p>
          <p className="text-[13px] mt-1">Has encontrado todos los pares.</p>
          <p className="mt-1 font-extrabold text-[14px] text-[#2F9A73] inline-flex items-center gap-1">+{ACTION_POINTS.major}% de tu próxima hoja <Leaf className="w-4 h-4" /></p>
          <img src={brain3d} alt="" aria-hidden width={512} height={512} loading="lazy" className="pointer-events-none absolute right-1 bottom-0 w-20 object-contain" />
        </div>
      )}

      <Cta onClick={onNext} disabled={!done}>Continuar</Cta>
    </div>
  );
}

/* ───────────────────── 9 · Camino de fe ───────────────────── */

function Step9({ questions, loading, reward, onNext }: {
  questions?: { q: string; options: string[]; correct: number }[]; loading: boolean; reward: (level: ActionLevel, r: string) => void; onNext: () => void;
}) {
  const list = questions?.length ? questions.slice(0, 10) : [];
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"ok" | "fail" | null>(null);
  const letters = ["A", "B", "C", "D"];


  if (loading || !list.length) {
    return (
      <div>
        <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Camino de fe 🌈</h1>
        <div className="mt-4"><LoadingPack label="Trazando tu camino de hoy…" /></div>
      </div>
    );
  }

  const it = list[i];
  const last = i >= list.length - 1;

  return (
    <div>
      <AnswerFeedback state={feedback} onClose={() => setFeedback(null)} />
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Camino de fe 🌈</h1>
      <p className="text-center text-[13px] text-muted-foreground mt-1">Responde y avanza por el camino · {list.length} pasos</p>

      <div className="relative mt-4 overflow-hidden rounded-[16px]">
        <img src={caminoFe} alt="Camino de fe hacia la luz" width={768} height={1024} className="w-full h-[230px] object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/95 to-transparent" />
        <div className="absolute inset-x-0 bottom-3 flex flex-wrap justify-center gap-1.5">
          {list.map((_, k) => (
            <span key={k} className={cn("w-2.5 h-2.5 rounded-full border-2 border-primary/40", k <= i ? "bg-primary" : "bg-card")} />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[16px] bg-card border border-border p-4 shadow-soft">
        <p className="text-[12px] font-bold text-primary">Pregunta {i + 1} de {list.length}</p>
        <p className="font-display font-extrabold text-[17px] mt-1 leading-tight">{it.q}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {it.options.map((op, oi) => (
            <button key={oi} disabled={picked !== null}
              onClick={() => {
                setPicked(oi);
                if (oi === it.correct) { reward("minor", "stage_camino_fe"); setFeedback("ok"); }
                else setFeedback("fail");
              }}
              className={cn("min-h-[42px] rounded-full px-4 text-[13px] font-semibold transition active:scale-95 inline-flex items-center gap-1.5",
                picked === null ? "bg-primary/8 text-foreground" : oi === it.correct ? "bg-[#2F9A73] text-white" : picked === oi ? "bg-[#D64545]/14 text-[#B91C1C]" : "bg-primary/5 text-muted-foreground")}>
              <span className="opacity-60">{letters[oi]}</span> {op}
            </button>
          ))}
        </div>
        {picked !== null && (
          <p className={cn("mt-3 text-[13px] font-bold", picked === it.correct ? "text-[#2F9A73]" : "text-[#B91C1C]")}>
            {picked === it.correct ? "¡Correcto! Avanzas al siguiente paso." : "Respuesta incorrecta. Respira: Dios sana lo que le entregas."}
          </p>
        )}
      </div>


      <Cta disabled={picked === null} onClick={() => { if (last) return onNext(); setI(i + 1); setPicked(null); }}>
        {last ? "Continuar" : "Siguiente paso"}
      </Cta>
    </div>
  );
}

/* ───────────────── 10 · Clasifica tus emociones ───────────────── */

const EMO = [
  { e: "😠", g: "pesan" }, { e: "😭", g: "pesan" }, { e: "😔", g: "pesan" },
  { e: "❤️", g: "sanan" }, { e: "😊", g: "sanan" }, { e: "😌", g: "sanan" },
];

const BIENESTAR_FALLBACK = [
  { q: "¿Con qué frecuencia te sentiste sin ganas de nada esta semana?", options: ["Casi nunca", "Algunos días", "Casi todos los días"] },
  { q: "¿Cómo has dormido últimamente?", options: ["Bien", "Regular", "Muy mal"] },
  { q: "¿Sientes que puedes hablar con alguien de lo que te pasa?", options: ["Sí, tengo con quién", "A veces", "Me siento sola/o"] },
  { q: "¿Has tenido pensamientos de hacerte daño?", options: ["No", "Pensamientos pasajeros", "Sí, con frecuencia"] },
];

function Step10({ bienestar, reward, onNext }: { bienestar?: { q: string; options: string[] }[]; reward: (level: ActionLevel, r: string) => void; onNext: () => void }) {
  const qs = bienestar?.length ? bienestar : BIENESTAR_FALLBACK;
  const [placed, setPlaced] = useState<Record<number, "pesan" | "sanan">>({});
  const [sel, setSel] = useState<number | null>(null);
  const [wb, setWb] = useState<Record<number, number>>({});
  const pool = EMO.map((_, i) => i).filter((i) => placed[i] === undefined);
  const emoDone = pool.length === 0;
  const wbDone = qs.every((_, i) => wb[i] !== undefined);
  const done = emoDone && wbDone;
  const alerta = Object.values(wb).filter((v) => v === 2).length;

  function place(i: number, g: "pesan" | "sanan") {
    const next = { ...placed, [i]: g };
    setPlaced(next);
    if (Object.keys(next).length === EMO.length) reward("medium", "stage_classify");
  }

  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Clasifica tus emociones 🎯</h1>
      <p className="text-center text-[13px] text-muted-foreground mt-1">Toca una emoción y colócala donde corresponde.</p>

      <div className="mt-4 min-h-[64px] rounded-[16px] bg-card border border-border p-3 flex flex-wrap justify-center gap-2.5 shadow-soft">
        {pool.length === 0 ? <span className="text-[13px] text-muted-foreground py-2">Todas colocadas 🎉</span> : pool.map((i) => (
          <button key={i} onClick={() => setSel(i)}
            className={cn("w-12 h-12 rounded-[12px] grid place-items-center text-[24px] transition active:scale-95", sel === i ? "bg-primary/15 ring-2 ring-primary" : "bg-primary/6")}>
            {EMO[i].e}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {(["pesan", "sanan"] as const).map((g) => (
          <button key={g} disabled={sel === null} onClick={() => { if (sel !== null) { place(sel, g); setSel(null); } }}
            className={cn("rounded-[16px] p-3 min-h-[140px] text-left transition active:scale-[.98] border-2",
              g === "pesan" ? "bg-[#F87171]/8 border-[#F87171]/35" : "bg-[#3FBE8F]/8 border-[#3FBE8F]/35")}>
            <span className={cn("text-[12.5px] font-extrabold", g === "pesan" ? "text-[#B91C1C]" : "text-[#2F9A73]")}>
              {g === "pesan" ? "Emociones que me pesan" : "Emociones que me sanan"}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMO.map((x, i) => placed[i] === g && (
                <span key={i} className="w-10 h-10 rounded-[10px] bg-card border border-border grid place-items-center text-[20px] shadow-soft">{x.e}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Cuestionario de bienestar */}
      <div className="mt-4 rounded-[16px] bg-card border border-border p-4 shadow-soft">
        <div className="text-[11px] uppercase tracking-widest font-bold text-primary">Cómo estás de verdad</div>
        <h2 className="font-display font-extrabold text-[18px] mt-1 leading-tight">Cuestionario de ánimo</h2>
        <p className="text-[12.5px] text-muted-foreground mt-1">Responde con honestidad. Nadie más lo ve; nos ayuda a acompañarte mejor.</p>
        <div className="mt-3 space-y-3">
          {qs.map((q, i) => (
            <div key={i} className="rounded-[14px] border border-border p-3">
              <p className="text-[13.5px] font-semibold leading-snug">{q.q}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((o, oi) => (
                  <button key={oi} onClick={() => setWb((w) => ({ ...w, [i]: oi }))}
                    className={cn("h-9 rounded-[10px] px-3 text-[12.5px] font-semibold transition active:scale-95",
                      wb[i] === oi ? "bg-primary text-white" : "bg-primary/8 text-foreground")}>{o}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {wbDone && (
          <div className={cn("mt-3 rounded-[12px] p-4 text-[13px] leading-snug font-medium", alerta >= 2 ? "bg-[#F58BCB]/12 text-foreground" : "bg-[#3FBE8F]/10 text-foreground")}>
            {alerta >= 2
              ? "Gracias por tu honestidad. Lo que sientes es real y no tienes que cargarlo sola/o: habla hoy con alguien de confianza y, si el dolor aprieta, busca ayuda profesional o llama a una línea de apoyo de tu país. Aquí seguimos contigo, paso a paso."
              : "Gracias por responder. Tu ánimo está sostenido: sigue cuidando tu descanso, tu oración y las personas que te hacen bien."}
          </div>
        )}
      </div>

      {done && (
        <div className="relative mt-4 overflow-hidden rounded-[16px] bg-primary/8 p-4 pr-24" style={{ animation: "scale-in .3s ease-out both" }}>
          <p className="text-[13.5px] font-bold">¡Muy bien! Reconoces y eliges lo que te acerca a la sanidad.</p>
          <p className="mt-1 font-extrabold text-[14px] text-[#2F9A73] inline-flex items-center gap-1">+{ACTION_POINTS.minor}% de tu próxima hoja <Leaf className="w-4 h-4" /></p>
          <img src={star3d} alt="" aria-hidden width={512} height={512} loading="lazy" className="pointer-events-none absolute right-1 bottom-0 w-20 object-contain" />
        </div>
      )}

      <Cta onClick={onNext} disabled={!done}>Continuar</Cta>
    </div>
  );
}

/* ───────────────────── 11 · Resumen de hoy ───────────────────── */

function Step11({ minutes, tasksDone, onNext }: { minutes: number; tasksDone: boolean; onNext: () => void }) {
  const rows = [
    ["Tareas completadas", tasksDone ? "ok" : "ok"],
    ["Quiz realizado", "ok"],
    ["Juegos completados", "ok"],
    ["Tiempo invertido", `${minutes} min`],
  ] as const;
  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Tu resumen de hoy 🤖</h1>

      <div className="mt-4 rounded-[16px] bg-primary/8 p-4 grid grid-cols-[auto_minmax(0,1fr)] gap-3 items-center">
        <img src={robot} alt="" aria-hidden width={1024} height={1024} loading="lazy" className="w-16 shrink-0 object-contain" />
        <p className="text-[13px] leading-snug">Hoy diste pasos importantes en tu sanidad emocional. Reconociste heridas, las llevaste a Dios y completaste todas las actividades.</p>
      </div>

      <div className="mt-3 rounded-[16px] bg-card border border-border p-2 shadow-soft">
        {rows.map(([label, val]) => (
          <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 border-b border-border last:border-0">
            <span className="min-w-0 text-[13.5px] font-medium truncate">{label}</span>
            {val === "ok"
              ? <span className="w-6 h-6 shrink-0 rounded-full bg-[#3FBE8F] text-white grid place-items-center"><Check className="w-3.5 h-3.5" /></span>
              : <span className="shrink-0 text-[13px] font-extrabold text-primary">{val}</span>}
          </div>
        ))}
      </div>

      <p className="mt-3 rounded-[16px] bg-accent-pink/10 p-4 text-[13.5px] leading-snug font-medium">
        Dios está orgulloso de ti. Sigue adelante, tu historia está siendo restaurada. 💜
      </p>

      <Cta onClick={onNext}>Ver mi recompensa</Cta>
    </div>
  );
}

/* ───────────────────── 12 · Recompensa del día ───────────────────── */

function Step12({ earned, insignia, onSave, onNext }: { earned: number; insignia: string; onSave: () => Promise<void>; onNext: () => void }) {
  useEffect(() => { onSave(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Recompensa del día 🏆</h1>

      <div className="relative mt-4 grid place-items-center rounded-[16px] min-h-[210px] overflow-hidden" style={{ background: "radial-gradient(70% 70% at 50% 45%, #F3E4FF 0%, #EADAFB 60%, #FBF3FF 100%)" }}>
        <img src={heartGem} alt="Gema del corazón que sana" width={512} height={512} className="w-[52%] max-w-[190px] object-contain" style={{ animation: "scale-in .5s ease-out both" }} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { top: "🌿", big: `+${Math.max(earned, 0)}%`, label: "Progreso de tu hoja" },
          { top: "⭐", big: `+${STAGE_XP}`, label: "XP" },
          { top: "🛡️", big: "Insignia", label: insignia },
        ].map((c) => (
          <div key={c.label} className="rounded-[16px] bg-card border border-border p-3 text-center shadow-soft">
            <div className="text-[24px] leading-none">{c.top}</div>
            <div className="mt-1 font-display font-extrabold text-[15px] leading-tight">{c.big}</div>
            <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[12px] text-muted-foreground">Tu XP y tu insignia quedan guardadas en tu camino y en tu perfil.</p>

      <Cta onClick={onNext}>Continuar</Cta>
    </div>
  );
}

/* ───────────────────── 13 · Día completado ───────────────────── */

function Step13({ stage, position, total, onFinish }: { stage: any; position: number; total: number; onFinish: () => void }) {
  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">¡Día completado! 🎉</h1>
      <p className="text-center text-[13px] text-muted-foreground mt-1">Mañana desbloquearás la siguiente parada de tu camino</p>

      <div className="relative mt-4 overflow-hidden rounded-[16px] bg-card border border-border p-4 pr-28 shadow-soft">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FF7A3C]/10 px-3 py-1.5">
          <Flame className="w-4 h-4 text-[#FF7A3C]" />
          <span className="text-[12.5px] font-extrabold">Racha activa</span>
        </div>
        <p className="font-display font-extrabold text-[19px] mt-3 leading-tight">{position} días<br />completados</p>
        <div className="mt-3 flex items-center gap-1.5 max-w-[190px]">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={cn("h-2.5 w-2.5 rounded-full", i < position ? "bg-primary" : "bg-primary/15")} />
          ))}
        </div>
        <img src={tree} alt="" aria-hidden width={512} height={512} loading="lazy" className="pointer-events-none absolute right-0 bottom-0 w-24 object-contain" />
      </div>

      <p className="mt-3 rounded-[16px] bg-primary/8 p-4 text-[13.5px] leading-snug">
        <span className="font-extrabold text-primary">{stage.title}:</span> lo que hoy trabajaste queda guardado en tu progreso y suma hojas a tu árbol.
      </p>

      <Button
        onClick={onFinish}
        className="mt-5 w-full h-[54px] rounded-[12px] text-[16px] font-semibold bg-gradient-to-r from-accent-pink to-primary text-white"
        style={{ boxShadow: "0 4px 14px rgba(245,139,203,0.32)" }}
      >
        <Sparkles className="w-4 h-4 mr-1.5" /> Volver a mi camino <ArrowRight className="w-4 h-4 ml-1.5" />
      </Button>
    </div>
  );
}

/* ───────────── Estados de bloqueo / completada ───────────── */

function CompletedStageView({ stage, position, total, onBack }: { stage: any; position: number; total: number; onBack: () => void }) {
  return (
    <div className="min-h-dvh grid place-items-center px-4 py-8" style={{ background: "radial-gradient(120% 80% at 50% 0%, #F6EFFF 0%, #FDFBFF 55%, #FFF0F8 100%)" }}>
      <Card className="w-full max-w-sm rounded-[16px] p-6 text-center shadow-soft">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#3FBE8F] text-white grid place-items-center"><Check className="w-7 h-7" /></div>
        <span className="mt-3 inline-block rounded-full bg-[#3FBE8F]/12 px-3 py-1 text-[12px] font-extrabold text-[#2F9A73]">Completada</span>
        <h1 className="font-display font-extrabold text-[22px] mt-3 leading-tight">{stage.title}</h1>
        <p className="text-[13.5px] text-muted-foreground mt-2 leading-snug">
          Día {position}: {stage.title}. Ya la viviste hoy y queda guardada en tu camino, en modo lectura.
        </p>
        <p className="mt-3 text-[12.5px] text-muted-foreground leading-snug">
          Un día a la vez. Mañana se abre tu próximo paso.
        </p>
        <Button onClick={onBack} className="mt-5 h-[52px] w-full rounded-[12px] text-[15px] font-semibold bg-gradient-to-r from-accent-pink to-primary text-white">
          Volver a mi camino
        </Button>
      </Card>
    </div>
  );
}

function LockedStageView({ tomorrow, onBack }: { tomorrow: boolean; onBack: () => void }) {
  const [left, setLeft] = useState(msUntilAppDayReset());
  useEffect(() => {
    if (!tomorrow) return;
    const t = setInterval(() => setLeft(msUntilAppDayReset()), 1000);
    return () => clearInterval(t);
  }, [tomorrow]);
  return (
    <div className="min-h-dvh grid place-items-center px-4 py-8" style={{ background: "radial-gradient(120% 80% at 50% 0%, #2E1A4D 0%, #1E1033 60%, #150C24 100%)" }}>
      <Card className="w-full max-w-sm rounded-[16px] p-6 text-center shadow-soft bg-card/95">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 text-primary grid place-items-center"><Lock className="w-7 h-7" /></div>
        <h1 className="font-display font-extrabold text-[22px] mt-3 leading-tight">
          {tomorrow ? "Se abre a las 12:00 de la noche" : "Etapa bloqueada"}
        </h1>
        <p className="text-[13.5px] text-muted-foreground mt-2 leading-snug">
          {tomorrow
            ? "Ya viviste tu día de hoy. El siguiente paso se abre a medianoche."
            : "Primero completa la etapa anterior de tu camino para desbloquear esta."}
        </p>
        {tomorrow && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[15px] font-mono font-extrabold text-primary" role="timer" aria-live="polite">
            {formatCountdown(left)}
          </div>
        )}
        <Button onClick={onBack} className="mt-5 h-[52px] w-full rounded-[12px] text-[15px] font-semibold bg-gradient-to-r from-accent-pink to-primary text-white">
          Volver a mi camino
        </Button>
      </Card>
    </div>
  );
}
