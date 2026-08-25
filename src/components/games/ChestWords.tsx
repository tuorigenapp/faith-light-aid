import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles } from "./engine3d";
import { cn } from "@/lib/utils";
import { useGameLevels, shuffleSeeded } from "@/lib/game-progress";

/**
 * Palabras en el cofre — 3 niveles, varias rondas.
 * 3D solo para el cofre; las palabras son tarjetas 2D grandes y separadas.
 */
export function ChestWords({
  correct,
  decoys = [],
  storageKey = "cofre",
  onComplete,
  onClose,
  onNext,
}: {
  correct: string[];
  decoys?: string[];
  storageKey?: string;
  onComplete?: () => void;
  onClose?: () => void;
  onNext?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const popRef = useRef<(() => void) | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [won, setWon] = useState(false);

  const levels = useGameLevels(`cofre:${storageKey}`, () => {
    onComplete?.();
    setWon(true);
  });

  const good = useMemo(
    () => Array.from(new Set(correct.map((w) => (w ?? "").trim()).filter(Boolean))),
    [correct],
  );
  const bad = useMemo(
    () => Array.from(new Set(decoys.map((w) => (w ?? "").trim()).filter(Boolean))),
    [decoys],
  );

  /** Objetivo de la ronda: crece con el nivel. */
  const targets = useMemo(() => {
    const pool = good.length ? good : ["Paz"];
    const need = Math.min(pool.length, 1 + levels.level);
    return shuffleSeeded(pool, levels.seed).slice(0, need);
  }, [good, levels.level, levels.seed]);

  const cards = useMemo(() => {
    const fillers = bad.length ? bad : ["Miedo", "Culpa", "Prisa", "Vergüenza"];
    const noise = shuffleSeeded(fillers, levels.seed + 5).slice(0, 1 + levels.level);
    const others = good.filter((w) => !targets.includes(w)).slice(0, levels.level);
    return shuffleSeeded(
      [
        ...targets.map((w) => ({ w, ok: true })),
        ...noise.map((w) => ({ w, ok: false })),
        ...others.map((w) => ({ w, ok: false })),
      ],
      levels.seed + 11,
    );
  }, [targets, bad, good, levels.level, levels.seed]);

  useEffect(() => setTaken([]), [levels.level, levels.round]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x2a2160,
      cameraPos: [0, 2.3, 6.2],
      lookAt: [0, 1, 0],
      hemi: [0xffffff, 0x6f68a8],
      sun: 0xfff3dc,
    });
    const { scene } = rig;
    const dust = makeAmbientParticles(scene, { count: 30, spread: 9, height: 5.5, color: 0xffe9b0, size: 0.07, speed: 0.22, up: true });
    const burst = createBurstPool(scene);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(6, 48),
      new THREE.MeshStandardMaterial({ color: 0x3b3282, roughness: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const chest = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.3, 1.7, 4, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0xa8763f, roughness: 0.5 }),
    );
    box.position.y = 0.65;
    box.castShadow = true;
    chest.add(box);
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 2.6, 32, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xc08a4c, roughness: 0.45 }),
    );
    lid.rotation.z = Math.PI / 2;
    lid.position.y = 1.3;
    lid.castShadow = true;
    chest.add(lid);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 32, 24),
      new THREE.MeshStandardMaterial({ color: 0xffd479, emissive: 0xffb347, emissiveIntensity: 1, transparent: true, opacity: 0.5 }),
    );
    glow.position.y = 1.2;
    chest.add(glow);
    scene.add(chest);

    let pop = 0;
    popRef.current = () => {
      pop = 0.4;
      burst.spawn(new THREE.Vector3(0, 1.5, 0), 0x7be0a8, 24);
    };

    rig.onFrame((dt, t) => {
      dust.update(dt, t);
      burst.update(dt);
      if (pop > 0) pop -= dt;
      const k = pop > 0 ? 1 + pop * 0.35 : 1;
      chest.scale.setScalar(THREE.MathUtils.lerp(chest.scale.x, k, Math.min(1, dt * 8)));
      lid.rotation.x = Math.sin(t * 1.2) * 0.05 - (pop > 0 ? 0.25 : 0);
      glow.scale.setScalar(1 + Math.sin(t * 2.2) * 0.07);
      chest.position.y = Math.sin(t * 1.1) * 0.05;
      chest.rotation.y = Math.sin(t * 0.4) * 0.12;
    });

    return () => {
      popRef.current = null;
      rig.dispose();
    };
  }, []);

  function tap(w: string, ok: boolean) {
    if (pausedRef.current || won || taken.includes(w)) return;
    if (!ok) {
      setWrong(w);
      window.setTimeout(() => setWrong(null), 420);
      return;
    }
    popRef.current?.();
    const next = [...taken, w];
    setTaken(next);
    if (next.length >= targets.length) window.setTimeout(() => levels.clearRound(), 420);
  }

  return (
    <GameShell
      title="Palabras en el cofre"
      cue={`Guarda: ${targets.join(" · ")}`}
      progress={{ value: levels.totalDone, max: levels.totalRounds }}
      level={levels.level}
      round={levels.round}
      roundsInLevel={levels.roundsInLevel}
      levelUp={levels.levelUp}
      won={won}
      wonText="Esas palabras ya son tuyas: guardadas en tu cofre."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
      footer={
        <div className="mx-auto grid max-w-[420px] grid-cols-2 gap-3">
          {cards.map((c) => {
            const done = taken.includes(c.w);
            return (
              <button
                key={c.w}
                onClick={() => tap(c.w, c.ok)}
                disabled={done}
                className={cn(
                  "min-h-[56px] rounded-[16px] border-2 px-3 py-3 text-center font-display text-[16px] font-black transition active:scale-[.98]",
                  done
                    ? "border-[#7BE0A8]/50 bg-[#7BE0A8]/20 text-white/60"
                    : wrong === c.w
                      ? "border-[#F58BCB] bg-white/95 text-[#241539]"
                      : "border-transparent bg-white/95 text-[#241539]",
                )}
              >
                {c.w}
              </button>
            );
          })}
        </div>
      }
    >
      <div ref={host} className="h-full w-full" aria-label="Cofre 3D de palabras" />
    </GameShell>
  );
}

export default ChestWords;
