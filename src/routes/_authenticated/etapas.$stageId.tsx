import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Lock, X, Leaf, RefreshCw, Sparkles, Flame } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WordSearch } from "@/components/WordSearch";
import { getStageContent } from "@/lib/stage-content";
import { awardGems } from "@/lib/gems";
import heartCrystal from "@/assets/st-heart-crystal.png";
import chest from "@/assets/st-chest.png";
import robot from "@/assets/st-robot.png";
import caminoFe from "@/assets/st-camino-fe.png";
import heartGem from "@/assets/e3d-heartgem.png.asset.json";
import star3d from "@/assets/e3d-star.png.asset.json";
import brain3d from "@/assets/e3d-brain.png.asset.json";
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

const TOTAL_STEPS = 13;

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
  const [openSteps, setOpenSteps] = useState<number[]>([0]);
  const [earned, setEarned] = useState(0);
  const started = useMemo(() => Date.now(), []);

  const { data } = useQuery({
    queryKey: ["stage", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [stage, progress, stages] = await Promise.all([
        supabase.from("stages").select("*").eq("id", id).maybeSingle(),
        supabase.from("stage_progress").select("*").eq("user_id", user!.id).eq("stage_id", id).maybeSingle(),
        supabase.from("stages").select("id").order("id"),
      ]);
      return { stage: stage.data, progress: progress.data, total: (stages.data ?? []).length || 7 };
    },
  });

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
  const tasks = ((stage.tasks as string[]) ?? []).filter(Boolean);
  const solutionSteps = ((stage.solution_steps as string[]) ?? []).filter(Boolean);
  const stageIndex = id;

  function reward(amount: number, reason: string) {
    setEarned((e) => e + amount);
    awardGems(amount, reason, { stage: id }).then(() => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    });
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
    navigate({ to: "/etapas" });
  }

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const minutes = Math.max(1, Math.round((Date.now() - started) / 60000));

  const shell = (node: React.ReactNode, opts?: { dark?: boolean }) => (
    <StepShell step={step} stageIndex={stageIndex} total={data.total} dark={opts?.dark} onClose={() => navigate({ to: "/etapas" })}>
      {node}
    </StepShell>
  );

  switch (step) {
    case 1:
      return shell(<Step1 stage={stage} onNext={next} />);
    case 2:
      return shell(<Step2 steps={solutionSteps} open={openSteps} setOpen={setOpenSteps} onNext={next} />);
    case 3:
      return shell(<Step3 tasks={tasks} done={doneTasks} setDone={setDoneTasks} reward={reward} onNext={next} />);
    case 4:
      return shell(<Step4 mood={mood} setMood={setMood} notes={notes} setNotes={setNotes} answers={answers} setAnswers={setAnswers} onNext={next} />);
    case 5:
      return shell(<Step5 items={content.quiz} reward={reward} onNext={next} />);
    case 6:
      return shell(<Step6 reward={reward} onNext={next} />, { dark: true });
    case 7:
      return shell(<Step7 words={content.words} stageId={id} onNext={next} />);
    case 8:
      return shell(<Step8 reward={reward} onNext={next} />);
    case 9:
      return shell(<Step9 reward={reward} onNext={next} />, { dark: true });
    case 10:
      return shell(<Step10 reward={reward} onNext={next} />);
    case 11:
      return shell(<Step11 minutes={minutes} tasksDone={doneTasks.length >= Math.max(tasks.length, 1)} onNext={next} />);
    case 12:
      return shell(<Step12 earned={earned} onNext={next} />);
    default:
      return shell(<Step13 stage={stage} stageIndex={stageIndex} total={data.total} onFinish={finish} />);
  }
}

/* ───────────────────────── Shell común ───────────────────────── */

function StepShell({ step, stageIndex, total, dark, onClose, children }: {
  step: number; stageIndex: number; total: number; dark?: boolean; onClose: () => void; children: React.ReactNode;
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
          <span className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-accent-pink to-primary text-white grid place-items-center font-display font-extrabold text-[15px] shadow-soft">{step}</span>
          <span className={cn("text-center text-[12px] font-bold", dark ? "text-white/75" : "text-primary")}>Etapa {stageIndex} de {total}</span>
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

function Hojas({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] font-extrabold text-[#3FBE8F] shrink-0">+{n} <Leaf className="w-3.5 h-3.5" /></span>
  );
}

/* ───────────────────────── 1 · Lección ───────────────────────── */

function Step1({ stage, onNext }: { stage: any; onNext: () => void }) {
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
          <div key={m.t} className="rounded-[16px] bg-white p-3 text-center shadow-soft">
            <div className="text-[26px] leading-none">{m.emoji}</div>
            <div className="mt-1.5 text-[12px] font-bold leading-snug">{m.t}</div>
          </div>
        ))}
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

function Step2({ steps, open, setOpen, onNext }: { steps: string[]; open: number[]; setOpen: (v: number[]) => void; onNext: () => void }) {
  const list = steps.length ? steps : [
    "Reconoce la herida. Acepta lo que pasó sin negarlo.",
    "Comprende el origen. Entiende cómo esa herida se formó.",
    "Perdona y suelta. Decide liberar el dolor y el rencor.",
    "Declara la verdad. Habla la verdad de Dios sobre tu vida.",
    "Ora por sanidad. Entrega la situación a Dios.",
    "Agradece y descansa. Confía en que Dios ya está obrando.",
  ];
  const maxOpen = Math.max(...open, 0);
  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Soluciones paso a paso 🚀</h1>
      <div className="mt-5 space-y-3">
        {list.map((s, i) => {
          const [title, ...rest] = s.split(/[.·:]\s*/);
          const desc = rest.join(". ");
          const unlocked = i <= maxOpen;
          const done = open.includes(i) && i < maxOpen;
          const current = i === maxOpen;
          return (
            <button
              key={i}
              disabled={!unlocked}
              onClick={() => setOpen(Array.from(new Set([...open, i + 1])))}
              className={cn(
                "w-full text-left rounded-[16px] bg-white p-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 shadow-soft transition active:scale-[.98]",
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
              {done ? <Check className="w-5 h-5 shrink-0 text-[#3FBE8F]" /> : unlocked ? <span className="w-5 shrink-0" /> : <Lock className="w-4 h-4 shrink-0 text-muted-foreground" />}
            </button>
          );
        })}
      </div>
      <Cta onClick={onNext}>Continuar con el paso 3</Cta>
    </div>
  );
}

/* ───────────────────── 3 · Tareas espirituales ───────────────────── */

function Step3({ tasks, done, setDone, reward, onNext }: { tasks: string[]; done: number[]; setDone: (v: number[]) => void; reward: (n: number, r: string) => void; onNext: () => void }) {
  const list = tasks.length ? tasks : [
    "Escribe una carta de liberación (no se la entregas)",
    "Identifica 1 herida emocional y llévala a oración",
    "Ora la oración de sanidad del alma",
    "Declara en voz alta 3 verdades de Dios sobre ti",
    "Escucha la oración guiada de sanidad",
    "Respiración consciente 3 minutos con la presencia de Dios",
  ];
  const EMOJIS = ["📝", "⭐", "🙏", "📖", "🎧", "💜"];
  const all = done.length >= list.length;

  function toggle(i: number) {
    if (done.includes(i)) return setDone(done.filter((x) => x !== i));
    setDone([...done, i]);
    reward(25, "stage_task");
  }

  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Tareas espirituales 📋</h1>
      <p className="text-center text-[13px] text-muted-foreground mt-1">¡Completa todas y recibe tu recompensa!</p>

      <div className="mt-5 space-y-2.5">
        {list.map((t, i) => (
          <button key={i} onClick={() => toggle(i)} className="w-full text-left rounded-[16px] bg-white p-3.5 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2.5 shadow-soft transition active:scale-[.98]">
            <span className="w-9 h-9 shrink-0 rounded-[10px] bg-primary/8 grid place-items-center text-[18px]">{EMOJIS[i % EMOJIS.length]}</span>
            <span className={cn("min-w-0 text-[13.5px] leading-snug font-medium", done.includes(i) && "text-muted-foreground line-through")}>{t}</span>
            <Hojas n={25} />
            <span className={cn("w-6 h-6 shrink-0 rounded-full grid place-items-center border-2", done.includes(i) ? "bg-[#3FBE8F] border-[#3FBE8F] text-white" : "border-primary/25")}>
              {done.includes(i) && <Check className="w-3.5 h-3.5" />}
            </span>
          </button>
        ))}
      </div>

      {all && (
        <div className="relative mt-4 overflow-hidden rounded-[16px] p-4 pr-28 text-white" style={{ background: "linear-gradient(135deg,#7C5CFF 0%,#A855F7 55%,#F58BCB 100%)", animation: "scale-in .35s ease-out both" }}>
          <div className="font-display font-extrabold text-[19px]">¡Excelente! 🎉</div>
          <p className="text-[12.5px] text-white/85 mt-1">Has completado todas las tareas</p>
          <p className="font-display font-extrabold text-[20px] mt-2 leading-tight">+150 hojas<br />de sanación 🌿</p>
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

      <div className="mt-5 rounded-[16px] bg-white p-4 shadow-soft">
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
        <div key={f.key} className="mt-3 rounded-[16px] bg-white p-4 shadow-soft">
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

function Step5({ items, reward, onNext }: { items: { q: string; options: string[]; correct: number; tip: string }[]; reward: (n: number, r: string) => void; onNext: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const it = items[i];
  const letters = ["A", "B", "C", "D"];
  const last = i >= items.length - 1;

  function pick(oi: number) {
    if (picked !== null) return;
    setPicked(oi);
    if (oi === it.correct) reward(20, "stage_quiz_correct");
  }

  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Mini quiz 🧠</h1>
      <p className="text-center text-[12.5px] text-muted-foreground mt-1">Pregunta {i + 1} de {items.length}</p>

      <p className="mt-5 font-display font-extrabold text-[19px] leading-tight">{it.q}</p>

      <div className="mt-4 space-y-2.5">
        {it.options.map((op, oi) => {
          const isCorrect = oi === it.correct;
          const revealed = picked !== null;
          return (
            <button key={oi} onClick={() => pick(oi)}
              className={cn("w-full text-left rounded-[12px] bg-white p-3.5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 shadow-soft text-[13.5px] font-medium transition active:scale-[.98]",
                revealed && isCorrect && "bg-[#3FBE8F] text-white",
                revealed && !isCorrect && picked === oi && "bg-[#F87171]/15 text-[#B91C1C]",
                revealed && !isCorrect && picked !== oi && "opacity-60")}>
              <span className={cn("w-6 h-6 shrink-0 rounded-full grid place-items-center text-[11px] font-extrabold",
                revealed && isCorrect ? "bg-white/25 text-white" : "bg-primary/10 text-primary")}>{letters[oi]}</span>
              <span className="min-w-0">{op}</span>
              {revealed && isCorrect && <Check className="w-4 h-4 shrink-0" />}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="relative mt-4 overflow-hidden rounded-[16px] bg-primary/8 p-4 pl-24" style={{ animation: "scale-in .3s ease-out both" }}>
          <img src={robot} alt="" aria-hidden width={1024} height={1024} loading="lazy" className="pointer-events-none absolute left-0 bottom-0 w-20 object-contain" />
          <div className="text-[13px] font-extrabold text-[#3FBE8F]">{picked === it.correct ? "¡Correcto! 🎉" : "Casi… mira esto 💜"}</div>
          <p className="text-[12.5px] leading-snug mt-1">{it.tip}</p>
          {picked === it.correct && <p className="mt-1.5 font-extrabold text-[13px] text-[#3FBE8F] inline-flex items-center gap-1">+20 hojas <Leaf className="w-3.5 h-3.5" /></p>}
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

const CARGAS = ["Culpa", "Rencor", "Tristeza", "Dolor", "Enojo"];

function Step6({ reward, onNext }: { reward: (n: number, r: string) => void; onNext: () => void }) {
  const [freed, setFreed] = useState<string[]>([]);
  const done = freed.length === CARGAS.length;

  function free(c: string) {
    if (freed.includes(c)) return;
    const next = [...freed, c];
    setFreed(next);
    if (next.length === CARGAS.length) reward(30, "stage_game_cargas");
  }

  return (
    <div className="text-white">
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Juego interactivo 🎮</h1>
      <p className="text-center text-[13px] text-white/75 mt-1">Toca las cargas para soltarlas en el cofre de liberación</p>

      <div className="relative mt-6 min-h-[300px]">
        {CARGAS.map((c, i) => {
          const pos = [
            { left: "6%", top: "12%" }, { left: "48%", top: "0%" }, { left: "62%", top: "22%" },
            { left: "2%", top: "42%" }, { left: "64%", top: "50%" },
          ][i];
          const gone = freed.includes(c);
          return (
            <button
              key={c}
              onClick={() => free(c)}
              className={cn("absolute rounded-full bg-white/95 text-foreground px-4 py-2.5 text-[13px] font-bold shadow-soft transition-all duration-500 active:scale-95",
                gone && "opacity-0 translate-y-32 scale-50 pointer-events-none")}
              style={{ ...pos, animation: gone ? undefined : "fade-in 2.6s ease-in-out infinite alternate" }}
            >
              {c}
            </button>
          );
        })}
        <img src={chest} alt="Cofre de liberación" width={1024} height={1024} className="absolute left-1/2 bottom-0 -translate-x-1/2 w-44 object-contain drop-shadow-2xl" />
      </div>

      <div className="mt-4 rounded-[16px] bg-white/10 border border-white/15 backdrop-blur p-4">
        <p className="text-[13.5px] font-bold">{done ? "¡Muy bien! Has liberado todas las cargas 🎉" : "¡Muy bien! Sigue así, tu corazón se hace ligero"}</p>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-[#3FBE8F] transition-all duration-500" style={{ width: `${(freed.length / CARGAS.length) * 100}%` }} />
          </div>
          <span className="text-[12px] font-bold shrink-0">{freed.length}/{CARGAS.length} liberadas</span>
        </div>
        {done && <p className="mt-2 text-[13px] font-extrabold text-[#7DE8C0] inline-flex items-center gap-1">+30 hojas <Leaf className="w-3.5 h-3.5" /></p>}
      </div>

      <Cta onClick={onNext} disabled={!done}>Continuar</Cta>
    </div>
  );
}

/* ───────────────────── 7 · Sopa de letras ───────────────────── */

function Step7({ words, stageId, onNext }: { words: string[]; stageId: number; onNext: () => void }) {
  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Sopa de letras espiritual 🔍</h1>
      <p className="text-center text-[13px] text-muted-foreground mt-1">Encuentra las palabras que te ayudarán a sanar.</p>
      <div className="mt-4"><WordSearch words={words} storageKey={`stage-${stageId}`} /></div>
      <div className="relative mt-3 overflow-hidden rounded-[16px] bg-[#3FBE8F]/10 p-4 pr-24">
        <p className="text-[13.5px] font-bold">¡Excelente! Cada palabra que encuentras se graba en tu memoria.</p>
        <p className="mt-1 font-extrabold text-[14px] text-[#2F9A73] inline-flex items-center gap-1">+30 hojas <Leaf className="w-4 h-4" /></p>
        <img src={tree} alt="" aria-hidden width={512} height={512} loading="lazy" className="pointer-events-none absolute right-0 bottom-0 w-20 object-contain" />
      </div>
      <Cta onClick={onNext}>Continuar</Cta>
    </div>
  );
}

/* ───────────────── 8 · Memoria de promesas ───────────────── */

const PROMESAS = ["Dios me ama", "No temas, yo estoy contigo", "Eres mi hijo amado"];

function Step8({ reward, onNext }: { reward: (n: number, r: string) => void; onNext: () => void }) {
  const [cards, setCards] = useState(() => shuffleCards());
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const done = found.length === PROMESAS.length;

  function shuffleCards() {
    const list = PROMESAS.flatMap((p, i) => [{ id: i * 2, pair: i, text: p }, { id: i * 2 + 1, pair: i, text: p }]);
    return list.sort(() => Math.random() - 0.5);
  }

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
          if (nf.length === PROMESAS.length) reward(30, "stage_memory_pairs");
        }
        setOpen([]);
      }, same ? 320 : 720);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h1 className="font-display font-extrabold text-[24px] leading-tight">Juego: Memoria de promesas 🌸</h1>
        <button onClick={() => { setCards(shuffleCards()); setOpen([]); setFound([]); }} aria-label="Reiniciar juego"
          className="w-11 h-11 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center active:scale-95 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[13px] text-muted-foreground mt-1">Encuentra los pares de promesas de Dios.</p>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {cards.map((c, idx) => {
          const shown = open.includes(idx) || found.includes(c.pair);
          return (
            <button key={idx} onClick={() => tap(idx, c.pair)}
              className={cn("min-h-[92px] rounded-[16px] p-2.5 text-[11.5px] font-bold leading-snug grid place-items-center text-center transition active:scale-[.97] shadow-soft",
                found.includes(c.pair) ? "bg-accent-pink/15 border-2 border-accent-pink" : shown ? "bg-primary/10 border-2 border-primary" : "bg-primary/5 border border-primary/15 text-primary/40")}>
              {shown ? <span>{c.text}</span> : <span className="text-[24px]">❓</span>}
            </button>
          );
        })}
      </div>

      {done && (
        <div className="relative mt-4 overflow-hidden rounded-[16px] bg-accent-pink/12 p-4 pr-24" style={{ animation: "scale-in .3s ease-out both" }}>
          <p className="font-display font-extrabold text-[17px] text-primary">¡Excelente! ✨</p>
          <p className="text-[13px] mt-1">Has encontrado todos los pares.</p>
          <p className="mt-1 font-extrabold text-[14px] text-[#2F9A73] inline-flex items-center gap-1">+30 hojas <Leaf className="w-4 h-4" /></p>
          <img src={brain3d.url} alt="" aria-hidden width={512} height={512} loading="lazy" className="pointer-events-none absolute right-1 bottom-0 w-20 object-contain" />
        </div>
      )}

      <Cta onClick={onNext} disabled={!done}>Continuar</Cta>
    </div>
  );
}

/* ───────────────────── 9 · Camino de fe ───────────────────── */

const FE_QS = [
  { q: "¿Quién sana las heridas del alma?", options: ["Yo mismo", "Dios", "El tiempo"], correct: 1 },
  { q: "¿Qué necesita una herida para sanar?", options: ["Ser negada", "Ser reconocida", "Ser olvidada"], correct: 1 },
  { q: "¿Qué haces con lo que no puedes controlar?", options: ["Lo entrego", "Lo cargo", "Lo repito"], correct: 0 },
];

function Step9({ reward, onNext }: { reward: (n: number, r: string) => void; onNext: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const it = FE_QS[i];
  const last = i >= FE_QS.length - 1;
  const letters = ["A", "B", "C"];

  return (
    <div className="text-white">
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Camino de fe 🌈</h1>
      <p className="text-center text-[13px] text-white/75 mt-1">Responde correctamente y avanza por el camino</p>

      <div className="relative mt-4 overflow-hidden rounded-[16px]">
        <img src={caminoFe} alt="Camino de fe hacia la luz" width={768} height={1024} className="w-full h-[230px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#150C24]/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {FE_QS.map((_, k) => (
            <span key={k} className={cn("w-3 h-3 rounded-full border-2 border-white/60", k <= i ? "bg-gold" : "bg-white/20")} />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[16px] bg-white/10 border border-white/15 backdrop-blur p-4">
        <p className="text-[12px] font-bold text-white/70">Pregunta {i + 1}:</p>
        <p className="font-display font-extrabold text-[17px] mt-1 leading-tight">{it.q}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {it.options.map((op, oi) => (
            <button key={oi} disabled={picked !== null}
              onClick={() => { setPicked(oi); if (oi === it.correct) reward(15, "stage_camino_fe"); }}
              className={cn("h-10 rounded-full px-4 text-[13px] font-semibold transition active:scale-95 inline-flex items-center gap-1.5",
                picked === null ? "bg-white/12 text-white" : oi === it.correct ? "bg-[#3FBE8F] text-white" : picked === oi ? "bg-white/12 text-white/50" : "bg-white/8 text-white/40")}>
              <span className="opacity-70">{letters[oi]}</span> {op}
            </button>
          ))}
        </div>
        {picked !== null && (
          <p className={cn("mt-3 text-[13px] font-bold", picked === it.correct ? "text-[#7DE8C0]" : "text-white/70")}>
            {picked === it.correct ? "¡Correcto! Avanzas al siguiente paso." : "Respira. La verdad es que Dios sana lo que le entregas."}
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

function Step10({ reward, onNext }: { reward: (n: number, r: string) => void; onNext: () => void }) {
  const [placed, setPlaced] = useState<Record<number, "pesan" | "sanan">>({});
  const pool = EMO.map((_, i) => i).filter((i) => placed[i] === undefined);
  const done = pool.length === 0;

  function place(i: number, g: "pesan" | "sanan") {
    const next = { ...placed, [i]: g };
    setPlaced(next);
    if (Object.keys(next).length === EMO.length) reward(25, "stage_classify");
  }

  const [sel, setSel] = useState<number | null>(null);

  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Clasifica tus emociones 🎯</h1>
      <p className="text-center text-[13px] text-muted-foreground mt-1">Toca una emoción y colócala donde corresponde.</p>

      <div className="mt-4 min-h-[64px] rounded-[16px] bg-white p-3 flex flex-wrap justify-center gap-2.5 shadow-soft">
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
                <span key={i} className="w-10 h-10 rounded-[10px] bg-white grid place-items-center text-[20px] shadow-soft">{x.e}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {done && (
        <div className="relative mt-4 overflow-hidden rounded-[16px] bg-primary/8 p-4 pr-24" style={{ animation: "scale-in .3s ease-out both" }}>
          <p className="text-[13.5px] font-bold">¡Muy bien! Reconoces y eliges lo que te acerca a la sanidad.</p>
          <p className="mt-1 font-extrabold text-[14px] text-[#2F9A73] inline-flex items-center gap-1">+25 hojas <Leaf className="w-4 h-4" /></p>
          <img src={star3d.url} alt="" aria-hidden width={512} height={512} loading="lazy" className="pointer-events-none absolute right-1 bottom-0 w-20 object-contain" />
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

      <div className="mt-3 rounded-[16px] bg-white p-2 shadow-soft">
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

function Step12({ earned, onNext }: { earned: number; onNext: () => void }) {
  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">Recompensa del día 🏆</h1>

      <div className="relative mt-4 grid place-items-center rounded-[16px] min-h-[210px] overflow-hidden" style={{ background: "radial-gradient(70% 70% at 50% 45%, #F3E4FF 0%, #EADAFB 60%, #FBF3FF 100%)" }}>
        <img src={heartGem.url} alt="Gema del corazón que sana" width={512} height={512} className="w-[52%] max-w-[190px] object-contain" style={{ animation: "scale-in .5s ease-out both" }} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { top: "🌿", big: `+${Math.max(earned, 500)}`, label: "Hojas de sanación" },
          { top: "⭐", big: "+120", label: "XP" },
          { top: "🛡️", big: "Insignia", label: "Corazón que sana" },
        ].map((c) => (
          <div key={c.label} className="rounded-[16px] bg-white p-3 text-center shadow-soft">
            <div className="text-[24px] leading-none">{c.top}</div>
            <div className="mt-1 font-display font-extrabold text-[15px] leading-tight">{c.big}</div>
            <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <Cta onClick={onNext}>Continuar</Cta>
    </div>
  );
}

/* ───────────────────── 13 · Día completado ───────────────────── */

function Step13({ stage, stageIndex, total, onFinish }: { stage: any; stageIndex: number; total: number; onFinish: () => void }) {
  return (
    <div>
      <h1 className="font-display font-extrabold text-[26px] leading-tight text-center">¡Etapa {stageIndex} completada! 🎉</h1>
      <p className="text-center text-[13px] text-muted-foreground mt-1">Mañana desbloquearás la siguiente parada de tu camino</p>

      <div className="relative mt-4 overflow-hidden rounded-[16px] bg-white p-4 pr-28 shadow-soft">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FF7A3C]/10 px-3 py-1.5">
          <Flame className="w-4 h-4 text-[#FF7A3C]" />
          <span className="text-[12.5px] font-extrabold">Racha activa</span>
        </div>
        <p className="font-display font-extrabold text-[19px] mt-3 leading-tight">{stageIndex} de {total} etapas<br />completadas</p>
        <div className="mt-3 flex items-center gap-1.5 max-w-[190px]">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={cn("h-2.5 w-2.5 rounded-full", i < stageIndex ? "bg-primary" : "bg-primary/15")} />
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
