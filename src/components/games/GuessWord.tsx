import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles } from "./engine3d";
import { cn } from "@/lib/utils";

/**
 * Adivina la palabra — 3D selectivo (una sola pieza suave que respira) + UI 2D.
 * Las opciones son tarjetas grandes, separadas y fáciles de tocar.
 */
export function GuessWord({
  words,
  onComplete,
  onClose,
  onNext,
}: {
  words: string[];
  onComplete?: () => void;
  onClose?: () => void;
  onNext?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const burstRef = useRef<{ spawn: (p: THREE.Vector3, c: number, n: number) => void } | null>(null);
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const doneRef = useRef(false);

  const clean = useMemo(() => words.map((w) => w.trim()).filter(Boolean), [words]);
  const rounds = Math.min(4, Math.max(1, clean.length));
  const answer = clean.length ? clean[round % clean.length]! : "Paz";
  const options = useMemo(() => {
    const pool = [answer, ...clean.filter((w) => w !== answer)].slice(0, 3);
    const fill = ["Miedo", "Culpa", "Prisa"];
    while (pool.length < 3) pool.push(fill[pool.length % 3]!);
    return pool.map((w, i) => ({ w, k: (i * 7 + round * 5) % 11 })).sort((a, b) => a.k - b.k).map((x) => x.w);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, round]);

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
    const soft = makeAmbientParticles(scene, { count: 26, spread: 10, height: 6, color: 0xffe9b0, size: 0.07, speed: 0.2, up: true });
    const burst = createBurstPool(scene);
    burstRef.current = burst;

    // Única pieza 3D: forma suave y orgánica
    const gem = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 48, 36),
      new THREE.MeshStandardMaterial({ color: 0x9d7bff, roughness: 0.25, metalness: 0.1, emissive: 0x5b32c9, emissiveIntensity: 0.35 }),
    );
    gem.position.set(0, 1.2, 0);
    scene.add(gem);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.06, 12, 64),
      new THREE.MeshStandardMaterial({ color: 0x7be0a8, emissive: 0x3fbe8f, emissiveIntensity: 0.6 }),
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
    if (pausedRef.current || doneRef.current) return;
    if (w !== answer) {
      setWrong(w);
      setTimeout(() => setWrong(null), 420);
      return;
    }
    burstRef.current?.spawn(new THREE.Vector3(0, 1.2, 0), 0xffd479, 26);
    if (round + 1 >= rounds) {
      doneRef.current = true;
      onComplete?.();
      setWon(true);
      return;
    }
    setRound((r) => r + 1);
  }

  return (
    <GameShell
      title="Adivina la palabra"
      cue={`¿Cuál es "${answer}"?`}
      progress={{ value: round, max: rounds }}
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
                "min-h-[60px] w-full rounded-[16px] border-2 bg-white/95 px-5 py-4 text-center font-display text-[19px] font-black text-[#241539] transition active:scale-[.98]",
                wrong === w ? "border-[#F58BCB] animate-[shake_.4s_ease-in-out]" : "border-transparent",
              )}
            >
              {w}
            </button>
          ))}
        </div>
      }
    >
      <div ref={host} className="h-full w-full" aria-label="Escena de la palabra del día" />
    </GameShell>
  );
}

export default GuessWord;
