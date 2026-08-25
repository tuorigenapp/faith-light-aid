import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles } from "./engine3d";

/**
 * Pez en el agua — 3D donde aporta: el pez, el objetivo y la sensación de agua.
 * Un solo objetivo visible a la vez, cerca, con luz propia. Cámara que acompaña.
 */
const REQUIRED = 4;

export function FishInWater({
  good,
  onComplete,
  onClose,
  onNext,
}: {
  good: string[];
  bad?: string[];
  onComplete?: () => void;
  onClose?: () => void;
  onNext?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const dirRef = useRef(new THREE.Vector2(0, 0));
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [label, setLabel] = useState(good[0] ?? "Paz");
  const doneRef = useRef(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const words = good.map((w) => w.trim()).filter(Boolean);
    const rig = createRig(el, {
      bg: 0x1f6f9e,
      fog: [16, 42],
      cameraPos: [0, 3.2, 9],
      lookAt: [0, 2, 0],
      hemi: [0xd9f6ff, 0x2f7ea8],
      sun: 0xffffff,
    });
    const { scene } = rig;

    const bed = new THREE.Mesh(
      new THREE.CircleGeometry(20, 48),
      new THREE.MeshStandardMaterial({ color: 0x2b8bb8, roughness: 0.95 }),
    );
    bed.rotation.x = -Math.PI / 2;
    bed.receiveShadow = true;
    scene.add(bed);

    // Plantas suaves, pocas y lejanas (fondo secundario)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const h = 1.6 + (i % 3) * 0.5;
      const plant = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.22, h, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0x49c99a, roughness: 0.7 }),
      );
      plant.position.set(Math.cos(a) * 11, h / 2, Math.sin(a) * 11);
      scene.add(plant);
    }

    const bubbles = makeAmbientParticles(scene, { count: 45, spread: 18, height: 7, color: 0xeafcff, size: 0.09, speed: 0.5, up: true });
    const burst = createBurstPool(scene);

    // Pez con formas redondeadas
    const fish = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(0.62, 32, 24);
    bodyGeo.scale(1.5, 0.9, 0.85);
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0xffb347, roughness: 0.3 }));
    body.castShadow = true;
    fish.add(body);
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0xff8f4d, roughness: 0.4 }),
    );
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -1.1;
    fish.add(tail);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      eye.position.set(0.62, 0.2, 0.28 * s);
      fish.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshStandardMaterial({ color: 0x123043 }));
      pupil.position.set(0.72, 0.2, 0.3 * s);
      fish.add(pupil);
    }
    fish.position.set(0, 2.4, 3);
    scene.add(fish);

    // Objetivo único, grande y luminoso
    const targetGroup = new THREE.Group();
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 32, 24),
      new THREE.MeshStandardMaterial({ color: 0x7be0a8, emissive: 0x3fbe8f, emissiveIntensity: 0.9, roughness: 0.25 }),
    );
    targetGroup.add(orb);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.07, 12, 48),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xd9fff0, emissiveIntensity: 0.7, transparent: true, opacity: 0.8 }),
    );
    ring.rotation.x = Math.PI / 2;
    targetGroup.add(ring);
    scene.add(targetGroup);

    let idx = 0;
    function placeTarget() {
      const a = Math.random() * Math.PI * 2;
      const r = 4.2;
      targetGroup.position.set(
        THREE.MathUtils.clamp(fish.position.x + Math.cos(a) * r, -6, 6),
        2 + Math.random() * 1.6,
        THREE.MathUtils.clamp(fish.position.z + Math.sin(a) * r, -5, 4),
      );
      if (words.length) setLabel(words[idx % words.length]!);
    }
    placeTarget();

    let local = 0;

    rig.onFrame((dt, t) => {
      bubbles.update(dt, t);
      burst.update(dt);

      const d = dirRef.current;
      const move = new THREE.Vector3(d.x * 3.6, -d.y * 1.6, d.y * 3.2);
      fish.position.addScaledVector(move, dt);
      fish.position.x = THREE.MathUtils.clamp(fish.position.x, -7, 7);
      fish.position.y = THREE.MathUtils.clamp(fish.position.y, 1.1, 5);
      fish.position.z = THREE.MathUtils.clamp(fish.position.z, -6, 5);
      if (move.lengthSq() > 0.01) {
        fish.rotation.y = THREE.MathUtils.lerp(fish.rotation.y, Math.atan2(-move.z, move.x), Math.min(1, dt * 5));
      }
      tail.rotation.y = Math.sin(t * 10) * 0.4;
      body.rotation.z = Math.sin(t * 2.4) * 0.05;

      const dist = fish.position.distanceTo(targetGroup.position);
      const near = dist < 2.6;
      targetGroup.position.y += Math.sin(t * 1.4) * dt * 0.3;
      targetGroup.rotation.y += dt * 0.6;
      ring.scale.setScalar(near ? 1.1 + Math.sin(t * 6) * 0.08 : 1);
      (orb.material as THREE.MeshStandardMaterial).emissiveIntensity = near ? 1.5 : 0.9;

      if (dist < 1.5) {
        burst.spawn(targetGroup.position.clone(), 0x7be0a8, 28);
        local += 1;
        idx += 1;
        setScore(local);
        if (local >= REQUIRED && !doneRef.current) {
          doneRef.current = true;
          onComplete?.();
          setWon(true);
        } else {
          placeTarget();
        }
      }

      // Cámara que acompaña con suavidad
      rig.camera.position.lerp(
        new THREE.Vector3(fish.position.x * 0.5, fish.position.y + 1.6, fish.position.z + 6.4),
        Math.min(1, dt * 2.2),
      );
      rig.camera.lookAt(fish.position.x, fish.position.y, fish.position.z - 1);
    });

    return () => rig.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameShell
      title="Pez en el agua"
      cue={`Lleva el pez hasta "${label}"`}
      progress={{ value: score, max: REQUIRED }}
      dpad={(x, y) => dirRef.current.set(x, y)}
      won={won}
      wonText="Fuiste hacia lo que te hace bien, con calma."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
    >
      <div ref={host} className="h-full w-full" aria-label="Escena acuática del pez" />
    </GameShell>
  );
}

export default FishInWater;
