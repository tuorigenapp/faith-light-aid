import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles } from "./engine3d";
import { useGameLevels } from "@/lib/game-progress";

/**
 * Dardo en el aro — 3 niveles con varias rondas.
 * Apuntar → tocar → lanzar. La mira se mueve más rápido y la diana se hace
 * más pequeña en cada nivel, con guía de trayectoria siempre visible.
 */
export function DartThrow({
  storageKey = "dardo",
  onComplete,
  onClose,
  onNext,
}: {
  storageKey?: string;
  onComplete?: () => void;
  onClose?: () => void;
  onNext?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const throwRef = useRef<(() => void) | null>(null);
  const [hits, setHits] = useState(0);
  const [won, setWon] = useState(false);

  const levels = useGameLevels(`dardo:${storageKey}`, () => {
    onComplete?.();
    setWon(true);
  });

  const needed = levels.level; // 1 · 2 · 3 aciertos por ronda
  const cfg = useRef({ aimSpeed: 0.8, radius: 1.0, needed: 1 });
  cfg.current.aimSpeed = 0.55 + levels.level * 0.4;
  cfg.current.radius = 1.15 - levels.level * 0.2;
  cfg.current.needed = needed;

  const roundRef = useRef<() => void>(() => {});
  roundRef.current = () => levels.clearRound();

  useEffect(() => setHits(0), [levels.level, levels.round]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x2a2160,
      cameraPos: [0, 2.6, 8.4],
      lookAt: [0, 2.6, -4],
      hemi: [0xffffff, 0x6f68a8],
      sun: 0xfff6e6,
    });
    const { scene } = rig;
    const dust = makeAmbientParticles(scene, { count: 24, spread: 12, height: 7, color: 0xffe9b0, size: 0.07, speed: 0.2, up: true });
    const burst = createBurstPool(scene);

    const board = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CircleGeometry(2.5, 64), new THREE.MeshStandardMaterial({ color: 0xf6f2ff, roughness: 0.5 }));
    board.add(base);
    const mid = new THREE.Mesh(new THREE.CircleGeometry(1.7, 64), new THREE.MeshStandardMaterial({ color: 0x9d7bff, roughness: 0.45 }));
    mid.position.z = 0.02;
    board.add(mid);
    const center = new THREE.Mesh(
      new THREE.CircleGeometry(1, 48),
      new THREE.MeshStandardMaterial({ color: 0x7be0a8, emissive: 0x3fbe8f, emissiveIntensity: 0.5, roughness: 0.4 }),
    );
    center.position.z = 0.04;
    board.add(center);
    board.position.set(0, 2.9, -5);
    scene.add(board);

    const dart = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.07, 0.7, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xf3ecff, roughness: 0.35 }),
    );
    shaft.rotation.x = Math.PI / 2;
    dart.add(shaft);
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.34, 20),
      new THREE.MeshStandardMaterial({ color: 0xffd479, metalness: 0.3, roughness: 0.3 }),
    );
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.55;
    dart.add(tip);
    scene.add(dart);
    const rest = new THREE.Vector3(0, 1.5, 3.2);
    dart.position.copy(rest);

    const reticle = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.07, 12, 40),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe9b0, emissiveIntensity: 0.9 }),
    );
    scene.add(reticle);

    const guide: THREE.Mesh[] = [];
    const guideMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    for (let i = 0; i < 7; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), guideMat);
      scene.add(dot);
      guide.push(dot);
    }

    let flying = false;
    let travel = 0;
    let aimX = 0;
    let aimY = 0;
    let localHits = 0;
    let closing = false;
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();

    throwRef.current = () => {
      if (pausedRef.current || flying || closing) return;
      flying = true;
      travel = 0;
      from.copy(rest);
      to.set(board.position.x + aimX, board.position.y + aimY, board.position.z + 0.2);
    };
    const cv = rig.renderer.domElement;
    const tap = () => throwRef.current?.();
    cv.addEventListener("pointerdown", tap);

    rig.onFrame((dt, t) => {
      dust.update(dt, t);
      burst.update(dt);
      center.scale.setScalar((cfg.current.radius / 1.0) * (1 + Math.sin(t * 2) * 0.03));

      if (!flying) {
        const s = cfg.current.aimSpeed;
        aimX = Math.sin(t * s) * 1.55;
        aimY = Math.cos(t * s * 0.8) * 1.05;
        reticle.position.set(board.position.x + aimX, board.position.y + aimY, board.position.z + 0.25);
        dart.position.copy(rest);
        dart.position.y = rest.y + Math.sin(t * 2) * 0.05;
        guide.forEach((dot, i) => {
          const p = (i + 1) / (guide.length + 1);
          dot.position.set(
            THREE.MathUtils.lerp(rest.x, reticle.position.x, p),
            THREE.MathUtils.lerp(rest.y, reticle.position.y, p) + Math.sin(p * Math.PI) * 0.7,
            THREE.MathUtils.lerp(rest.z, reticle.position.z, p),
          );
          dot.visible = true;
        });
        return;
      }

      guide.forEach((d) => (d.visible = false));
      travel += dt * 2.1;
      const p = Math.min(1, travel);
      dart.position.set(
        THREE.MathUtils.lerp(from.x, to.x, p),
        THREE.MathUtils.lerp(from.y, to.y, p) + Math.sin(p * Math.PI) * 0.5,
        THREE.MathUtils.lerp(from.z, to.z, p),
      );
      if (p >= 1) {
        flying = false;
        travel = 0;
        const dist = Math.hypot(dart.position.x - board.position.x, dart.position.y - board.position.y);
        if (dist <= cfg.current.radius) {
          burst.spawn(dart.position.clone(), 0x7be0a8, 26);
          localHits += 1;
          setHits(localHits);
          if (localHits >= cfg.current.needed && !closing) {
            closing = true;
            window.setTimeout(() => roundRef.current(), 500);
          }
        } else {
          burst.spawn(dart.position.clone(), 0xf58bcb, 14);
        }
        dart.position.copy(rest);
      }
    });

    return () => {
      cv.removeEventListener("pointerdown", tap);
      throwRef.current = null;
      rig.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels.level]);

  return (
    <GameShell
      title="Dardo en el aro"
      cue="Apunta con calma y suelta"
      progress={{ value: levels.totalDone, max: levels.totalRounds }}
      level={levels.level}
      round={levels.round}
      roundsInLevel={levels.roundsInLevel}
      levelUp={levels.levelUp}
      won={won}
      wonText="Apuntaste a lo que quieres, no a lo que temes."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
      footer={
        <div className="mx-auto max-w-[420px]">
          <p className="text-center text-[12px] font-bold text-white/70">
            Aciertos {hits}/{levels.level}
          </p>
          <button
            onClick={() => throwRef.current?.()}
            className="mt-3 h-[56px] w-full rounded-full bg-white text-[17px] font-black text-[#241539] transition active:scale-[.98]"
          >
            Lanzar el dardo
          </button>
        </div>
      }
    >
      <div ref={host} className="h-full w-full" aria-label="Diana en 3D" />
    </GameShell>
  );
}

export default DartThrow;
