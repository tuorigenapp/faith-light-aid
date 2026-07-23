import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Check, Brain, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { awardGems } from "@/lib/gems";

export type QuizItem = { q: string; options: string[]; correct: number; tip: string };

export function StageQuiz({ items, storageKey, gemsPerCorrect = 15 }: { items: QuizItem[]; storageKey: string; gemsPerCorrect?: number }) {
  const queryClient = useQueryClient();
  const initial = (() => {
    if (typeof window === "undefined") return {} as Record<number, number>;
    try { return JSON.parse(localStorage.getItem(`quiz:${storageKey}`) || "{}"); } catch { return {}; }
  })();
  const [answers, setAnswers] = useState<Record<number, number>>(initial);
  const [awardedIdx, setAwardedIdx] = useState<Set<number>>(new Set(Object.keys(initial).map(Number)));

  useEffect(() => {
    try { localStorage.setItem(`quiz:${storageKey}`, JSON.stringify(answers)); } catch {}
  }, [answers]);

  function pick(qi: number, oi: number) {
    if (answers[qi] !== undefined) return;
    setAnswers((a) => ({ ...a, [qi]: oi }));
    if (items[qi].correct === oi && !awardedIdx.has(qi)) {
      setAwardedIdx((s) => new Set(s).add(qi));
      awardGems(gemsPerCorrect, "stage_quiz_correct", { key: storageKey, qi }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      });
    }
  }

  return (
    <Card className="p-5 rounded-[1.7rem] shadow-soft">
      <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
        <Brain className="w-4 h-4" /> Quiz de reflexión
      </div>
      <p className="text-xs text-muted-foreground mb-4">Cada acierto te suma hojas de sanación. Piensa desde el corazón.</p>
      <div className="space-y-5">
        {items.map((it, qi) => {
          const chosen = answers[qi];
          return (
            <div key={qi}>
              <p className="font-display font-bold text-[15px] mb-2">{qi + 1}. {it.q}</p>
              <div className="space-y-2">
                {it.options.map((op, oi) => {
                  const isChosen = chosen === oi;
                  const isCorrect = it.correct === oi;
                  const revealed = chosen !== undefined;
                  return (
                    <button
                      key={oi}
                      onClick={() => pick(qi, oi)}
                      className={cn(
                        "w-full text-left p-3 rounded-2xl border text-sm transition-all flex items-center gap-2",
                        !revealed && "border-border hover:border-primary hover:bg-primary/5",
                        revealed && isCorrect && "border-primary bg-primary/10 text-primary font-bold",
                        revealed && isChosen && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                        revealed && !isChosen && !isCorrect && "opacity-60 border-border"
                      )}
                    >
                      {revealed && isCorrect && <Check className="w-4 h-4 shrink-0" />}
                      {revealed && isChosen && !isCorrect && <X className="w-4 h-4 shrink-0" />}
                      <span>{op}</span>
                    </button>
                  );
                })}
              </div>
              {chosen !== undefined && (
                <div className="mt-2 p-3 rounded-2xl bg-secondary text-xs leading-relaxed">
                  <span className="font-bold text-primary">Reflexión:</span> {it.tip}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
