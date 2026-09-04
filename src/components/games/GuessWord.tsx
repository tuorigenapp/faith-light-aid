import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles } from "./engine3d";
import { cn } from "@/lib/utils";
import { useGameLevels, seeded, shuffleSeeded } from "@/lib/game-progress";

/**
 * Adivina la palabra — 3 niveles con varias rondas.
 * Nivel 1: una letra oculta y 3 opciones. Nivel 2: más letras ocultas.
 * Nivel 3: casi toda la palabra oculta y 4 opciones.
 */
export function GuessWord({
  words,
  decoys = ["Miedo", "Culpa", "Prisa", "Rencor", "Vergüenza", "Ruido"],
  storageKey = "adivina",
  onComplete,
  onClose,
  onNext,
}: {
  words: string[];
  decoys?: string[];
  storageKey?: string;
  onComplete?: () => void;
  onClose?: () => void;
  onNext?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const burstRef = useRef<{ spawn: (p: THREE.Vector3, c: number, n: number) => void } | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [won, setWon] = useState(false);

  const levels = useGameLevels(`adivina:${storageKey}`, () => {
    onComplete?.();
    setWon(true);
  });

  const pool = useMemo(() => {
    const clean = Array.from(new Set(words.map((w) => (w ?? "").trim()).filter(Boolean)));
    return clean.length ? clean : ["Paz", "Fe", "Calma", "Perdón"];
  }, [words]);

  const answer = useMemo(() => {
    const list = shuffleSeeded(pool, levels.seed);
    return list[(levels.round - 1) % list.length]!;
  }, [pool, levels.seed, levels.round]);

  /** Palabra con letras ocultas: más difícil en cada nivel. */
  const masked = useMemo(() => {
    const rnd = seeded(levels.seed + 3);
    const chars = answer.split("");
    const letters = chars.map((c, i) => ({ c, i })).filter((x) => /[a-záéíóúñü]/i.test(x.c));
    const hideCount = Math.max(
      1,
      Math.round(letters.length * (levels.level === 1 ? 0.3 : levels.level === 2 ? 0.55 : 0.75)),
    );
    const order = letters
      .map((x) => ({ ...x, k: rnd() }))
      .sort((a, b) => a.k - b.k)
      .slice(0, hideCount);
    const hidden = new Set(order.map((x) => x.i));
    return chars.map((c, i) => (hidden.has(i) ? "_" : c)).join(" ");
  }, [answer, levels.level, levels.seed]);

  const options = useMemo(() => {
    const optCount = levels.level >= 3 ? 4 : 3;
    const others = [...pool.filter((w) => w !== answer), ...decoys];
    const picked = shuffleSeeded(others, levels.seed + 9).slice(0, optCount - 1);
    return shuffleSeeded([answer, ...picked], levels.seed + 17);
  }, [answer, pool, decoys, levels.level, levels.seed]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x2a2160,
      cameraPos: [0, 1.4, 6],
      lookAt: [0, 1.1, 0],
      hemi: [0xffffff, 0x6f68a8],
      sun: 0xfff6e6,
    });
    const { scene } = rig;
    const soft = makeAmbientParticles(scene, {
      count: 26,
      spread: 10,
      height: 6,
      color: 0xffe9b0,
      size: 0.07,
      speed: 0.2,
      up: true,
    });
    const burst = createBurstPool(scene);
    burstRef.current = burst;

    const gem = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 48, 36),
      new THREE.MeshStandardMaterial({
        color: 0x9d7bff,
        roughness: 0.25,
        metalness: 0.1,
        emissive: 0x5b32c9,
        emissiveIntensity: 0.35,
      }),
    );
    gem.position.set(0, 1.2, 0);
    scene.add(gem);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.06, 12, 64),
      new THREE.MeshStandardMaterial({
        color: 0x7be0a8,
        emissive: 0x3fbe8f,
        emissiveIntensity: 0.6,
      }),
    );
    halo.position.copy(gem.position);
    halo.rotation.x = Math.PI / 2.3;
    scene.add(halo);

    rig.onFrame((dt, t) => {
      soft.update(dt, t);
      burst.update(dt);
      gem.position.y = 1.2 + Math.sin(t * 1.2) * 0.1;
      gem.rotation.y += dt * 0.35;
      halo.position.y = gem.position.y;
      halo.rotation.z += dt * 0.25;
    });

    return () => {
      burstRef.current = null;
      rig.dispose();
    };
  }, []);

  function choose(w: string) {
    if (pausedRef.current || won) return;
    if (w !== answer) {
      setWrong(w);
      window.setTimeout(() => setWrong(null), 420);
      return;
    }
    burstRef.current?.spawn(new THREE.Vector3(0, 1.2, 0), 0xffd479, 26);
    levels.clearRound();
  }

  return (
    <GameShell
      title="Adivina la palabra"
      cue="¿Qué palabra falta?"
      progress={{ value: levels.totalDone, max: levels.totalRounds }}
      level={levels.level}
      round={levels.round}
      roundsInLevel={levels.roundsInLevel}
      levelUp={levels.levelUp}
      won={won}
      wonText="Reconoces tu tema del día sin dudar."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
      footer={
        <div className="mx-auto grid max-w-[420px] gap-3">
          {options.map((w) => (
            <button
              key={w}
              onClick={() => choose(w)}
              className={cn(
                "min-h-[58px] w-full rounded-[16px] border-2 bg-white/95 px-5 py-4 text-center font-display text-[18px] font-black text-[#241539] transition active:scale-[.98]",
                wrong === w ? "border-[#F58BCB]" : "border-transparent",
              )}
            >
              {w}
            </button>
          ))}
        </div>
      }
    >
      <div ref={host} className="relative h-full w-full" aria-label="Escena de la palabra">
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 px-6 text-center">
          <p className="font-display text-[30px] font-black uppercase tracking-[0.22em] text-white">
            {masked}
          </p>
        </div>
      </div>
    </GameShell>
  );
}

export default GuessWord;
