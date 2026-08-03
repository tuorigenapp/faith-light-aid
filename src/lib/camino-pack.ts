import { useQuery } from "@tanstack/react-query";

export type CaminoPack = {
  leccion: string;
  soluciones: string[];
  tareas: string[];
  afirmacion: string;
  oracion: string;
  resumen: string;
  cargas: string[];
  words: string[];
  promesas: string[];
  fe: { q: string; options: string[]; correct: number }[];
  bienestar: { q: string; options: string[] }[];
  emociones: { cargas: string[]; sanas: string[] };
};

export function caminoVariant(camino: string, day: number) {
  return `${new Date().toISOString().slice(0, 10)}-${camino}-d${day}`;
}

export function useCaminoPack(args: {
  camino: string;
  caminoTitle: string;
  day: number;
  dayTitle: string;
  focus: string;
}) {
  const variant = caminoVariant(args.camino, args.day);
  return useQuery<CaminoPack>({
    queryKey: ["camino-pack", variant],
    staleTime: 1000 * 60 * 60 * 6,
    queryFn: async () => {
      const r = await fetch("/api/camino-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...args, variant }),
      });
      return (await r.json()) as CaminoPack;
    },
  });
}
