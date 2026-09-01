import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Leaf, RefreshCw, Sparkles } from "lucide-react";
import { GAMES, MAX_LEVEL } from "@/components/games/DailyGames";
import { MIN_PLAYS, useGamePlays } from "@/lib/game-plays";
import { dailyWords } from "@/lib/daily-challenge";
import { awardLeaf, HOJA_POINTS } from "@/lib/gems";
import { celebrate } from "@/lib/celebrate";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/juegos/$gameId")({
  loader: ({ params }) => {
    const game = GAMES.find((g) => g.id === params.gameId);
    if (!game) throw notFound();
    return { title: game.title, desc: game.desc };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Juego no disponible — ORÍGEN" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.title} — Juegos de ORÍGEN`;
    return {
      meta: [
        { title },
        { name: "description", content: `${loaderData.desc}. Cinco partidas liberan tu hoja de sanación del día.` },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: GamePage,
  notFoundComponent: GameNotFound,
});

function GameNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-[26px] font-extrabold">Ese juego ya no está aquí</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Elige otro de la lista y sigue sumando tu hoja de hoy.
        </p>
        <Link
          to="/juegos"
          className="btn-primary-gradient mt-4 inline-flex min-h-[52px] items-center rounded-[12px] px-6 text-[15.5px] font-semibold text-primary-foreground"
        >
          Ver los juegos
        </Link>
      </div>
    </main>
  );
}

function GamePage() {
  const { gameId } = Route.useParams();
  const game = GAMES.find((g) => g.id === gameId)!;
  const qc = useQueryClient();
  const plays = useGamePlays(gameId);

  const [level, setLevel] = useState(1);
  const [runId, setRunId] = useState(0);
  const [won, setWon] = useState(false);
  const [granted, setGranted] = useState<number | null>(null);

  useEffect(() => {
    const raw = Number(localStorage.getItem(`origen_game_level_${gameId}`) ?? "1");
    setLevel(Number.isFinite(raw) && raw >= 1 ? Math.min(raw, MAX_LEVEL) : 1);
  }, [gameId]);

  const words = useMemo(() => dailyWords(gameId, level, 10), [gameId, level]);

  async function handleWin(_gems: number, learned: string[] = []) {
    if (won) return;
    setWon(true);
    celebrate();
    const next = plays.addPlay(learned);
    const lvl = Math.min(MAX_LEVEL, level + 1);
    localStorage.setItem(`origen_game_level_${gameId}`, String(lvl));

    if (next.plays >= MIN_PLAYS && !next.awarded) {
      const r = await awardLeaf("juegos", "medium", game.title, { game: gameId, level });
      plays.markAwarded();
      setGranted(r.granted);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (r.granted > 0)
        toast.success(`+${(r.granted / HOJA_POINTS).toFixed(3)} hojas · ${game.title}`);
      else
        toast.info("Hoy ya llegaste a tu tope de hojas. Tus partidas y tu nivel quedan guardados.");
    } else {
      toast.success(
        next.plays >= MIN_PLAYS
          ? "Partida ganada. Tu hoja de hoy ya estaba liberada."
          : `Partida ${next.plays} de ${MIN_PLAYS}. Te faltan ${MIN_PLAYS - next.plays}.`,
      );
    }
  }

  function nextRound() {
    setWon(false);
    setGranted(null);
    setLevel((l) => Math.min(MAX_LEVEL, l + 1));
    setRunId((r) => r + 1);
  }

  const pct = Math.min(100, Math.round((plays.plays / MIN_PLAYS) * 100));

  return (
    <main className="min-h-dvh bg-background pb-24">
      <header className="px-5 pt-5">
        <Link
          to="/juegos"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Juegos del día
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <span
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br text-white",
              game.tint,
            )}
          >
            {game.icon}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-[24px] font-extrabold leading-[1.15]">{game.title}</h1>
            <p className="text-[13.5px] leading-snug text-muted-foreground">{game.desc}</p>
          </div>
        </div>
      </header>

      <section className="mt-4 px-5">
        <div className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-widest text-primary">
              Nivel {level}
            </span>
            <span className="text-[12.5px] font-bold text-muted-foreground">
              {plays.plays}/{MIN_PLAYS} partidas de hoy
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/12">
            <div
              className="h-full bg-brand-gradient transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-[12.5px] leading-snug text-muted-foreground">
            {plays.unlocked
              ? "Ya liberaste tu hoja de sanación de hoy. Puedes seguir jugando por gusto."
              : `Gana ${MIN_PLAYS} partidas para liberar tu hoja de hoy. Sin reloj: solo concéntrate.`}
          </p>
        </div>
      </section>

      <section className="mt-4 px-5">
        <div className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
          <div key={`${gameId}-${level}-${runId}`}>
            {game.render({ words, level, onWin: handleWin })}
          </div>
        </div>

        {won && (
          <div className="mt-3 rounded-[16px] bg-[#3FBE8F]/12 p-4">
            <p className="flex items-center gap-2 text-[13.5px] font-bold text-[#2F9C74]">
              <Sparkles className="h-4 w-4" />
              {granted && granted > 0
                ? `Sumaste ${(granted / HOJA_POINTS).toFixed(3)} hojas de sanación.`
                : plays.unlocked
                  ? "Partida ganada. Tu hoja de hoy ya está liberada."
                  : `Partida ganada. Te faltan ${plays.remaining} para tu hoja de hoy.`}
            </p>
            <button
              onClick={nextRound}
              className="btn-primary-gradient mt-3 inline-flex min-h-[48px] items-center gap-1.5 rounded-[12px] px-5 text-[14.5px] font-bold text-primary-foreground transition active:scale-[.97]"
            >
              Jugar nivel {Math.min(MAX_LEVEL, level + 1)} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {!won && (
          <button
            onClick={() => setRunId((r) => r + 1)}
            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reiniciar esta partida
          </button>
        )}
      </section>

      <section className="mt-5 px-5">
        <h2 className="font-display text-[16px] font-bold">Lo que acertaste hoy</h2>
        <div className="hairline-brand my-2" />
        {plays.learned.length ? (
          <div className="flex flex-wrap gap-2">
            {plays.learned.map((w) => (
              <span
                key={w}
                className="inline-flex items-center gap-1 rounded-full bg-[#3FBE8F]/15 px-3 py-1.5 text-[12px] font-bold text-[#2F9C74]"
              >
                <Check className="h-3.5 h-3.5 w-3.5" /> {w}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-[16px] border border-dashed border-primary/30 p-4 text-center">
            <Leaf className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 text-[13px] font-semibold">Tu lista empieza con la primera partida</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Aquí van quedando las palabras que acertaste y memorizaste hoy.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
