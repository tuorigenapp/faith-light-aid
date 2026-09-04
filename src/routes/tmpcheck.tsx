import { createFileRoute } from "@tanstack/react-router";
import { GAMES } from "@/components/games/DailyGames";

export const Route = createFileRoute("/tmpcheck")({
  ssr: false,
  component: Check,
});

function Check() {
  const ids = ["bloques", "aros", "globo"];
  return (
    <main className="mx-auto max-w-[420px] p-4">
      {GAMES.filter((g) => ids.includes(g.id)).map((g) => (
        <section key={g.id} className="mb-6">
          <h2 className="font-display text-[17px] font-bold">{g.title}</h2>
          {g.render({ words: ["PAZ", "AMOR", "CALMA", "VALOR"], level: 1, onWin: () => {} })}
        </section>
      ))}
    </main>
  );
}
