import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles } from "./engine3d";

/**
 * Bola de pimpón — mecánica de un toque: el marcador se mueve sobre los vasos,
 * tocas y la bola vuela con arco. Vasos grandes, separados y bien visibles.
 */
const REQUIRED = 3;

export function PingPongToss({
  onComplete,
  onClose,
  onNext,
}: {
  onComplete?: () => void;
  onClose?: () => void;
  onNext?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const throwRef = useRef<(() => void) | null>(null);
  const [hits, setHits] = useState(0);
  const [won, setWon] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x2a2160,
      cameraPos: [0, 3, 8],
      lookAt: [0, 1.6, -2.5],
      hemi: [0xffffff, 0x6f68a8],
      sun: 0xfff6e6,
    });
    const { scene } = rig;
    const dust = makeAmbientParticles(scene, { count: 22, spread: 12, height: 6, color: 0xffe9b0, size: 0.07, speed: 0.2, up: true });
    const burst = createBurstPool(scene);

    const table = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.3, 7, 4, 2, 4),
      new THREE.MeshStandardMaterial({ color: 0x3f8f76, roughness: 0.55 }),
    );
    table.position.set(0, 0.9, -2);
    table.receiveShadow = true;
    scene.add(table);

    // Tres vasos grandes y separados
    type Cup = { group: THREE.Group; x: number; filled: boolean };
    const cups: Cup[] = [];
    [-2.4, 0, 2.4].forEach((x) => {
      const group = new THREE.Group();
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.45, 1.15, 32, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xf58bcb, roughness: 0.35, side: THREE.DoubleSide }),
      );
      cup.castShadow = true;
      group.add(cup);
      group.position.set(x, 1.65, -3.6);
      scene.add(group);
      cups.push({ group, x, filled: false });
    });

    // Marcador que recorre los vasos
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.07, 12, 40),
      new THREE.MeshStandardMaterial({ color: 0x7be0a8, emissive: 0x3fbe8f, emissiveIntensity: 0.9 }),
    );
    marker.rotation.x = Math.PI / 2;
    scene.add(marker);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 18),
      new THREE.MeshStandardMaterial({ color: 0xfff6d8, roughness: 0.25 }),
    );
    ball.castShadow = true;
    scene.add(ball);
    const rest = new THREE.Vector3(0, 1.9, 2.6);
    ball.position.copy(rest);

    let markerX = 0;
    let flying = false;
    let travel = 0;
    let local = 0;
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();

    throwRef.current = () => {
      if (pausedRef.current || flying || doneRef.current) return;
      flying = true;
      travel = 0;
      from.copy(rest);
      to.set(markerX, 1.7, -3.6);
    };
    const cv = rig.renderer.domElement;
    const tap = () => throwRef.current?.();
    cv.addEventListener("pointerdown", tap);

    rig.onFrame((dt, t) => {
      dust.update(dt, t);
      burst.update(dt);

      if (!flying) markerX = Math.sin(t * (0.8 + local * 0.15)) * 2.6;
      marker.position.set(markerX, 1.15, -3.6);
      cups.forEach((c) => {
        const near = Math.abs(markerX - c.x) < 0.8;
        c.group.position.y = 1.65 + (near ? Math.sin(t * 6) * 0.05 : 0);
      });

      if (flying) {
        travel = Math.min(1, travel + dt * 1.6);
        ball.position.lerpVectors(from, to, travel);
        ball.position.y += Math.sin(travel * Math.PI) * 1.5;
        ball.rotation.x += dt * 8;
        if (travel >= 1) {
          flying = false;
          const cup = cups.find((c) => Math.abs(c.x - to.x) < 0.95 && !c.filled);
          if (cup) {
            cup.filled = true;
            (cup.group.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({
              color: 0x7be0a8,
              roughness: 0.35,
              side: THREE.DoubleSide,
            });
            burst.spawn(cup.group.position.clone().setY(2.1), 0x7be0a8, 28);
            local += 1;
            setHits(local);
            if (local >= REQUIRED && !doneRef.current) {
              doneRef.current = true;
              onComplete?.();
              setWon(true);
            } else if (cups.every((c) => c.filled)) {
              cups.forEach((c) => {
                c.filled = false;
                (c.group.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                  color: 0xf58bcb,
                  roughness: 0.35,
                  side: THREE.DoubleSide,
                });
              });
            }
          } else {
            burst.spawn(ball.position.clone(), 0xf58bcb, 10);
          }
          setTimeout(() => ball.position.copy(rest), 280);
        }
      } else {
        ball.position.copy(rest);
        ball.position.y = rest.y + Math.sin(t * 2.2) * 0.05;
      }
    });

    return () => {
      throwRef.current = null;
      cv.removeEventListener("pointerdown", tap);
      rig.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameShell
      title="Bola de pimpón"
      cue="Toca cuando el aro esté sobre un vaso"
      progress={{ value: hits, max: REQUIRED }}
      won={won}
      wonText="Puntería y calma: la constancia también se entrena."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
      footer={
        <button
          onClick={() => throwRef.current?.()}
          className="mx-auto flex h-[56px] w-full max-w-[420px] items-center justify-center rounded-[16px] bg-white text-[17px] font-black text-[#241539] active:scale-[.98]"
        >
          Lanzar
        </button>
      }
    >
      <div ref={host} className="h-full w-full" aria-label="Escena de la bola de pimpón" />
    </GameShell>
  );
}

export default PingPongToss;
