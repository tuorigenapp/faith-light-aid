import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles } from "./engine3d";
import { useGameLevels } from "@/lib/game-progress";

/**
 * Pez en el agua — mecánica horizontal en 3 carriles.
 * El pez avanza y tú lo mueves arriba/abajo: atrapa palabras que te hacen bien
 * y esquiva las que te pesan. 3 niveles: más velocidad y más cargas.
 */

function textPlate(text: string, good: boolean) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext("2d")!;
  const r = 40;
  ctx.fillStyle = good ? "#ffffff" : "#2B1440";
  ctx.strokeStyle = good ? "#3FBE8F" : "#F58BCB";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(r, 6);
  ctx.arcTo(c.width - 6, 6, c.width - 6, c.height - 6, r);
  ctx.arcTo(c.width - 6, c.height - 6, 6, c.height - 6, r);
  ctx.arcTo(6, c.height - 6, 6, 6, r);
  ctx.arcTo(6, 6, c.width - 6, 6, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = good ? "#241539" : "#FFE8F6";
  ctx.font = "800 78px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label = text.length > 12 ? text.slice(0, 12) : text;
  ctx.fillText(label.toUpperCase(), c.width / 2, c.height / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), mat);
  return mesh;
}

const LANES = [3.1, 2.0, 0.9];

export function FishInWater({
  good,
  bad,
  storageKey = "pez",
  onComplete,
  onClose,
  onNext,
}: {
  good: string[];
  bad: string[];
  storageKey?: string;
  onComplete?: () => void;
  onClose?: () => void;
  onNext?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const laneRef = useRef(1);
  const [caught, setCaught] = useState(0);
  const [miss, setMiss] = useState(0);
  const [won, setWon] = useState(false);

  const levels = useGameLevels(`pez:${storageKey}`, () => {
    onComplete?.();
    setWon(true);
  });

  const goodWords = useMemo(() => {
    const g = good.map((w) => (w ?? "").trim()).filter(Boolean);
    return g.length ? g : ["Paz", "Calma", "Fe", "Perdón"];
  }, [good]);
  const badWords = useMemo(() => {
    const b = bad.map((w) => (w ?? "").trim()).filter(Boolean);
    return b.length ? b : ["Miedo", "Culpa", "Prisa", "Rencor"];
  }, [bad]);

  const need = 2 + levels.level; // 3 · 4 · 5 palabras por ronda
  const cfg = useRef({ speed: 3.2, badRate: 0.3, need });
  cfg.current.speed = 3 + levels.level * 0.9;
  cfg.current.badRate = 0.25 + levels.level * 0.1;
  cfg.current.need = need;

  const roundRef = useRef<() => void>(() => {});
  roundRef.current = () => levels.clearRound();

  useEffect(() => {
    setCaught(0);
    setMiss(0);
  }, [levels.level, levels.round]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x1f6f9e,
      cameraPos: [0, 2.2, 8.6],
      lookAt: [0, 2.1, 0],
      hemi: [0xd9f6ff, 0x2f7ea8],
      sun: 0xffffff,
    });
    const { scene } = rig;

    const bed = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 24),
      new THREE.MeshStandardMaterial({ color: 0x2b8bb8, roughness: 0.95 }),
    );
    bed.position.set(0, 2, -6);
    scene.add(bed);
    const bubbles = makeAmbientParticles(scene, { count: 40, spread: 16, height: 7, color: 0xeafcff, size: 0.09, speed: 0.5, up: true });
    const burst = createBurstPool(scene);

    // Pez con formas suaves
    const fish = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(0.6, 32, 24);
    bodyGeo.scale(1.5, 0.9, 0.85);
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0xffb347, roughness: 0.3 }));
    fish.add(body);
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0xff8f4d, roughness: 0.4 }),
    );
    tail.rotation.z = -Math.PI / 2;
    tail.position.x = -1.05;
    fish.add(tail);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      eye.position.set(0.6, 0.2, 0.26 * s);
      fish.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshStandardMaterial({ color: 0x123043 }));
      pupil.position.set(0.7, 0.2, 0.28 * s);
      fish.add(pupil);
    }
    fish.position.set(-3.6, LANES[1]!, 0);
    scene.add(fish);

    type Plate = { mesh: THREE.Mesh; good: boolean; lane: number; hit: boolean };
    const plates: Plate[] = [];
    let spawnIn = 0.6;
    let gi = 0;
    let bi = 0;
    let localCaught = 0;
    let closing = false;

    function spawn() {
      const isBad = Math.random() < cfg.current.badRate;
      const word = isBad ? badWords[bi++ % badWords.length]! : goodWords[gi++ % goodWords.length]!;
      const lane = Math.floor(Math.random() * LANES.length);
      const mesh = textPlate(word, !isBad);
      mesh.position.set(9, LANES[lane]!, 0);
      scene.add(mesh);
      plates.push({ mesh, good: !isBad, lane, hit: false });
    }

    rig.onFrame((dt, t) => {
      bubbles.update(dt, t);
      burst.update(dt);
      if (pausedRef.current) return;

      // Pez: carril suave + aleteo
      const targetY = LANES[laneRef.current]!;
      fish.position.y = THREE.MathUtils.lerp(fish.position.y, targetY, Math.min(1, dt * 6));
      fish.position.x = -3.6 + Math.sin(t * 1.6) * 0.15;
      tail.rotation.y = Math.sin(t * 11) * 0.4;
      body.rotation.z = Math.sin(t * 2.4) * 0.05;

      spawnIn -= dt;
      if (spawnIn <= 0 && !closing) {
        spawn();
        spawnIn = Math.max(0.5, 1.35 - levelSpeedBonus());
      }

      for (let i = plates.length - 1; i >= 0; i--) {
        const p = plates[i]!;
        p.mesh.position.x -= cfg.current.speed * dt;
        p.mesh.rotation.z = Math.sin(t * 2 + i) * 0.04;
        const dx = Math.abs(p.mesh.position.x - fish.position.x);
        const sameLane = Math.abs(p.mesh.position.y - fish.position.y) < 0.7;
        if (!p.hit && dx < 1.15 && sameLane) {
          p.hit = true;
          if (p.good) {
            burst.spawn(p.mesh.position.clone(), 0x7be0a8, 22);
            localCaught += 1;
            setCaught(localCaught);
            if (localCaught >= cfg.current.need && !closing) {
              closing = true;
              window.setTimeout(() => roundRef.current(), 500);
            }
          } else {
            burst.spawn(p.mesh.position.clone(), 0xf58bcb, 16);
            setMiss((m) => m + 1);
          }
          scene.remove(p.mesh);
          plates.splice(i, 1);
          continue;
        }
        if (p.mesh.position.x < -9) {
          scene.remove(p.mesh);
          plates.splice(i, 1);
        }
      }
    });

    function levelSpeedBonus() {
      return (cfg.current.speed - 3) * 0.18;
    }

    return () => {
      for (const p of plates) scene.remove(p.mesh);
      rig.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameShell
      title="Pez en el agua"
      cue="Atrapa lo que te hace bien · esquiva lo que te pesa"
      progress={{ value: levels.totalDone, max: levels.totalRounds }}
      level={levels.level}
      round={levels.round}
      roundsInLevel={levels.roundsInLevel}
      levelUp={levels.levelUp}
      won={won}
      wonText="Fuiste hacia lo que te hace bien, con calma."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
      footer={
        <div className="mx-auto flex max-w-[420px] items-center gap-3">
          <span className="flex-1 rounded-[14px] bg-white/12 px-4 py-3 text-center text-[13px] font-black text-white backdrop-blur-md">
            Atrapadas {caught}/{2 + levels.level}
          </span>
          <span className="flex-1 rounded-[14px] bg-white/12 px-4 py-3 text-center text-[13px] font-black text-white/75 backdrop-blur-md">
            Cargas tocadas {miss}
          </span>
        </div>
      }
      dpad={(x, y) => {
        if (y < 0) laneRef.current = Math.max(0, laneRef.current - 1);
        if (y > 0) laneRef.current = Math.min(LANES.length - 1, laneRef.current + 1);
        if (x !== 0) laneRef.current = laneRef.current; // el pez avanza solo
      }}
    >
      <div ref={host} className="h-full w-full" aria-label="Pez que avanza atrapando palabras" />
    </GameShell>
  );
}

export default FishInWater;
