import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { awardGems } from "@/lib/gems";
import { Brain, Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { key: string; label: string };
type Quiz = {
  question: string;
  options: Option[];
  correct_key: string;
  explanation: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function DailyQuiz() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const { data: quiz } = useQuery({
    queryKey: ["daily_quiz", todayIso()],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_quizzes")
        .select("question, options, correct_key, explanation")
        .eq("day", todayIso())
        .maybeSingle();
      return data as unknown as Quiz | null;
    },
  });

  const { data: done } = useQuery({
    queryKey: ["daily_quiz_done", user?.id, todayIso()],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_activity")
        .select("metadata")
        .eq("user_id", user!.id)
        .eq("activity_type", "quiz_done")
        .eq("activity_date", todayIso())
        .maybeSingle();
      return data ?? null;
    },
  });

  const alreadyDone = !!done;
  const previousPick = (done?.metadata as { key?: string } | null)?.key ?? null;
  const showAnswer = revealed || alreadyDone;
  const currentPick = picked ?? previousPick;

  async function pick(opt: Option) {
    if (!user || !quiz || alreadyDone || picked) return;
    setPicked(opt.key);
    setRevealed(true);
    const correct = opt.key === quiz.correct_key;
    const amount = correct ? 15 : 5;
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      activity_type: "quiz_done",
      activity_date: todayIso(),
      reference_id: opt.key,
      metadata: { key: opt.key, correct } as never,
    });
    await awardGems(amount, correct ? "Quiz diario acertado" : "Quiz diario intentado");
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["daily_quiz_done"] });
  }

  if (!quiz) return null;

  return (
    <div className="app-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-[#7C5CFF]/15 grid place-items-center">
          <Brain className="w-4 h-4 text-[#7C5CFF]" />
        </div>
        <span className="text-[11px] uppercase tracking-widest font-bold text-primary">Quiz de hoy</span>
        <span className="ml-auto text-[10px] font-bold text-[#7C5CFF] bg-[#7C5CFF]/10 rounded-full px-2 py-0.5">
          +15 💎
        </span>
      </div>
      <h3 className="font-display font-bold text-[17px] leading-snug mb-4">{quiz.question}</h3>

      <div className="space-y-2">
        {quiz.options.map((o) => {
          const isPicked = currentPick === o.key;
          const isCorrect = o.key === quiz.correct_key;
          const state = !showAnswer
            ? "idle"
            : isCorrect
            ? "correct"
            : isPicked
            ? "wrong"
            : "muted";
          return (
            <button
              key={o.key}
              onClick={() => pick(o)}
              disabled={alreadyDone || !!picked}
              className={cn(
                "w-full text-left rounded-2xl border-2 px-4 py-3 text-[14px] font-medium transition flex items-center gap-3",
                state === "idle" && "border-[#F1ECFF] bg-white hover:border-[#7C5CFF]/40 active:scale-[0.99]",
                state === "correct" && "border-[#3FBE8F] bg-[#3FBE8F]/10 text-[#1e7a53]",
                state === "wrong" && "border-[#F5566B] bg-[#F5566B]/10 text-[#a12a3a]",
                state === "muted" && "border-[#F1ECFF] bg-white opacity-60",
              )}
            >
              <span className="flex-1">{o.label}</span>
              {state === "correct" && <Check className="w-4 h-4" />}
              {state === "wrong" && <X className="w-4 h-4" />}
            </button>
          );
        })}
      </div>

      {showAnswer && (
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#F1ECFF] to-[#E8F4FF] p-4 border border-[#7C5CFF]/15">
          <div className="flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Explicación
          </div>
          <p className="text-[13px] leading-relaxed text-foreground/90">{quiz.explanation}</p>
        </div>
      )}

      {alreadyDone && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Ya respondiste hoy. Vuelve mañana por un nuevo quiz.
        </p>
      )}
    </div>
  );
}
