import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StageGameSequence, GAME_ORDER } from "@/components/StageGames";

export const Route = createFileRoute("/gametest")({ component: T });

function T() {
  const [done, setDone] = useState(false);
  return done ? <p>ok</p> : (
    <StageGameSequence games={GAME_ORDER} context={{ good: ["Paz", "Calma", "Valor"], bad: ["Miedo", "Culpa"], mainWord: "Calma" }} onFinish={() => setDone(true)} />
  );
}
