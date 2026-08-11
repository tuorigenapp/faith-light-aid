import { useQuery } from "@tanstack/react-query";

export type StagePack = {
  cargas: string[];
  words: string[];
  promesas: string[];
  fe: { q: string; options: string[]; correct: number }[];
  bienestar: { q: string; options: string[] }[];
  solutions?: string[];
  tasks?: string[];
};

export function stageVariant(stageId: number) {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)}-e${stageId}`;
}

export function useStagePack(stageId: number, title?: string, focus?: string) {
  const variant = stageVariant(stageId);
  return useQuery<StagePack>({
    queryKey: ["stage-pack", variant],
    staleTime: 1000 * 60 * 60 * 6,
    queryFn: async () => {
      const r = await fetch("/api/stage-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, title, focus, variant }),
      });
      return (await r.json()) as StagePack;
    },
  });
}
