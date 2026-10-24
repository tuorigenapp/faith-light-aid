import { subtopicVisual } from "@/lib/visualiza-content";
import { cn } from "@/lib/utils";

export function SubtopicIcon({ title, category, className }: { title: string; category?: string; className?: string }) {
  const visual = subtopicVisual(title, category);
  return <span aria-hidden="true" className={cn("grid h-16 w-16 shrink-0 place-items-center rounded-[12px] text-3xl", visual.tone, className)}>{visual.emoji}</span>;
}