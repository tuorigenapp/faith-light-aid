import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles } from "./engine3d";

/**
 * Dardo en el aro — sencillo: la mira se mueve despacio, tocas y el dardo vuela.
 * Diana grande y separada del fondo, guía de trayectoria y área válida generosa.
 */
const REQUIRED = 3;

export function DartThrow({
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
      cameraPos: [0, 2.6, 8.4],
      lookAt: [0, 2.6, -4],
      hemi: [0xffffff, 0x6f68a8],
      sun: 0xfff6e6,
    });
    const { scene } = rig;
    const dust = makeAmbientParticles(scene, { count: 24, spread: 12, height: 7, color: 0xffe9b0, size: 0.07, speed: 0.2, up: true });
    const burst = createBurstPool(scene);

    // Diana grande, limpia y con profundidad ligera
    const board = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 64),
      new THREE.MeshStandardMaterial({ color: 0xf6f2ff, roughness: 0.5 }),
    );
    board.add(base);
    const mid = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 64),
      new THREE.MeshStandardMaterial({ color: 0x9d7bff, roughness: 0.45 }),
    );
    mid.position.z = 0.02;
    board.add(mid);
    const center = new THREE.Mesh(
      new THREE.CircleGeometry(0.85, 48),
      new THREE.MeshStandardMaterial({ color: 0x7be0a8, emissive: 0x3fbe8f, emissiveIntensity: 0.5, roughness: 0.4 }),
    );
    center.position.z = 0.04;
    board.add(center);
    board.position.set(0, 2.9, -5);
    scene.add(board);

    // Dardo simple y reconocible
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

    // Mira lenta y grande
    const reticle = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.07, 12, 40),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe9b0, emissiveIntensity: 0.9 }),
    );
    scene.add(reticle);

    // Guía de trayectoria (puntos suaves)
    const guide: THREE.Mesh[] = [];
    const guideMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    for (let i = 0; i < 7; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), guideMat);
      scene.add(dot);
      guide.push(dot);
    }

    let flying = false;
    let local = 0;
    let aimX = 0;
    let aimY = 0;
    let travel = 0;
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();

    throwRef.current = () => {
      if (pausedRef.current || flying || doneRef.current) return;
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
      center.scale.setScalar(1 + Math.sin(t * 2) * 0.03);

      if (!flying) {
        // dificultad baja: recorrido lento y corto
        const speed = 0.55 + local * 0.12;
        aimX = Math.sin(t * speed) * 0.9;
        aimY = Math.cos(t * speed * 0.7) * 0.4;
      }
      reticle.position.set(board.position.x + aimX, board.position.y + aimY, board.position.z + 0.25);
      reticle.rotation.z += dt * 0.8;

      // Guía visual desde el dardo hasta la mira
      guide.forEach((dot, i) => {
        const k = (i + 1) / (guide.length + 1);
        dot.visible = !flying;
        dot.position.set(
          THREE.MathUtils.lerp(rest.x, reticle.position.x, k),
          THREE.MathUtils.lerp(rest.y, reticle.position.y, k) + Math.sin(k * Math.PI) * 0.55,
          THREE.MathUtils.lerp(rest.z, reticle.position.z, k),
        );
      });

      if (flying) {
        travel = Math.min(1, travel + dt * 1.8);
        dart.position.lerpVectors(from, to, travel);
        dart.position.y += Math.sin(travel * Math.PI) * 0.5;
        dart.rotation.z += dt * 8;
        if (travel >= 1) {
          flying = false;
          const d = Math.hypot(aimX, aimY);
          if (d < 1.9) {
            burst.spawn(dart.position.clone(), 0xffd479, 30);
            local += 1;
            setHits(local);
            if (local >= REQUIRED && !doneRef.current) {
              doneRef.current = true;
              onComplete?.();
              setWon(true);
            }
          } else {
            burst.spawn(dart.position.clone(), 0xf58bcb, 12);
          }
          setTimeout(() => dart.position.copy(rest), 300);
        }
      } else {
        dart.position.y = rest.y + Math.sin(t * 2) * 0.05;
        dart.rotation.set(0, 0, 0);
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
      title="Dardo en el aro"
      cue="Toca cuando la mira esté en el centro"
      progress={{ value: hits, max: REQUIRED }}
      won={won}
      wonText="Enfoque en el centro: así se toman decisiones firmes."
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
      <div ref={host} className="h-full w-full" aria-label="Escena del dardo y la diana" />
    </GameShell>
  );
}

export default DartThrow;
