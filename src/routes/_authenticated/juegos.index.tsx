import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Leaf } from "lucide-react";
import { GAMES, GameCard } from "@/components/games/DailyGames";
import { MIN_PLAYS } from "@/lib/game-plays";

export const Route = createFileRoute("/_authenticated/juegos")({
  head: () => ({
    meta: [
      { title: "Juegos del día — ORÍGEN" },
      {
        name: "description",
        content:
          "Diez juegos mentales de ORÍGEN. Cinco partidas en cualquiera libera tu hoja de sanación del día, sin límite de tiempo.",
      },
      { property: "og:title", content: "Juegos del día — ORÍGEN" },
      {
        property: "og:description",
        content: "Diez juegos mentales para concentrarte y liberar tu hoja de sanación del día.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JuegosIndex,
});

function JuegosIndex() {
  return (
    <main className="min-h-dvh bg-background pb-24">
      <header className="px-5 pt-5">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
        <h1 className="mt-3 font-display text-[30px] font-extrabold leading-[1.15]">
          Juegos del día
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
          Cada juego tiene su propia sección, tres niveles y palabras nuevas cada día. Con{" "}
          {MIN_PLAYS} partidas ganadas liberas tu hoja de sanación, sin reloj en contra.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[12px] font-bold text-primary">
          <Leaf className="h-3.5 w-3.5" /> {GAMES.length} juegos disponibles
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 px-5">
        {GAMES.map((g, i) => (
          <GameCard key={g.id} game={g} index={i} />
        ))}
      </section>
    </main>
  );
}
