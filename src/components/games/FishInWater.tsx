import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles } from "./engine3d";

/**
 * Pez en el agua — mundo acuático 3D vivo.
 * El pez nada solo (idle autónomo), el agua se mueve, hay plantas, burbujas
 * y luz submarina. El jugador lo guía con el control para atrapar las
 * palabras sanas y esquivar las que pesan (contenido dado por la IA).
 */
const REQUIRED = 6;

type Orb = { mesh: THREE.Mesh; good: boolean; drift: number; phase: number };

export function FishInWater({
  good,
  bad,
  onComplete,
  onClose,
  onNext,
}: {
  good: string[];
  bad: string[];
  onComplete?: () => void;
  onClose?: () => void;
  onNext?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const dirRef = useRef(new THREE.Vector2(0, 0));
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x073b5e,
      fog: [10, 34],
      cameraPos: [0, 4.6, 11],
      lookAt: [0, 1.6, 0],
      hemi: [0x9fe4ff, 0x02243d],
      sun: 0xbdf0ff,
    });
    const { scene } = rig;

    // Lecho marino
    const bed = new THREE.Mesh(
      new THREE.CircleGeometry(14, 48),
      new THREE.MeshStandardMaterial({ color: 0x0d5c86, roughness: 0.95 }),
    );
    bed.rotation.x = -Math.PI / 2;
    bed.receiveShadow = true;
    scene.add(bed);

    // Superficie del agua animada
    const waterGeo = new THREE.PlaneGeometry(30, 30, 40, 40);
    const water = new THREE.Mesh(
      waterGeo,
      new THREE.MeshStandardMaterial({ color: 0x2ea6d8, transparent: true, opacity: 0.32, roughness: 0.2, side: THREE.DoubleSide }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 6.4;
    scene.add(water);
    const basePos = Float32Array.from((waterGeo.getAttribute("position") as THREE.BufferAttribute).array);

    // Plantas acuáticas con movimiento propio
    const plants: THREE.Mesh[] = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 6 + (i % 5);
      const h = 1.4 + (i % 4) * 0.7;
      const plant = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, h, 8),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0x27b18a : 0x3fbe8f, roughness: 0.7, flatShading: true }),
      );
      plant.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      plant.castShadow = true;
      scene.add(plant);
      plants.push(plant);
    }

    const bubbles = makeAmbientParticles(scene, { count: 130, spread: 22, height: 6.4, color: 0xd8f6ff, size: 0.11, speed: 0.9, up: true });
    const burst = createBurstPool(scene);

    // Pez 3D
    const fish = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffb347, roughness: 0.3 });
    const bodyGeo = new THREE.SphereGeometry(0.5, 22, 16);
    bodyGeo.scale(1.5, 0.85, 0.75);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    fish.add(body);
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 0.7, 10),
      new THREE.MeshStandardMaterial({ color: 0xff8f4d, roughness: 0.4 }),
    );
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -0.95;
    fish.add(tail);
    for (const s of [-1, 1]) {
      const fin = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd479, roughness: 0.4 }),
      );
      fin.position.set(0.05, 0.05, 0.42 * s);
      fin.rotation.x = (Math.PI / 2) * s;
      fish.add(fin);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      eye.position.set(0.52, 0.16, 0.24 * s);
      fish.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0x102033 }));
      pupil.position.set(0.6, 0.16, 0.26 * s);
      fish.add(pupil);
    }
    fish.position.set(0, 2.4, 2);
    scene.add(fish);

    // Orbes de palabras
    const orbs: Orb[] = [];
    const goodWords = good.length ? good : ["Paz"];
    const badWords = bad.length ? bad : ["Miedo"];
    function spawnOrb() {
      if (orbs.length > 9) return;
      const isGood = Math.random() > 0.38;
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.42, 1),
        new THREE.MeshStandardMaterial({
          color: isGood ? 0x3fbe8f : 0xf58bcb,
          emissive: isGood ? 0x136b4d : 0x8a2f66,
          emissiveIntensity: 0.65,
          roughness: 0.3,
          flatShading: true,
        }),
      );
      mesh.position.set((Math.random() - 0.5) * 12, 1.2 + Math.random() * 4, -6 + Math.random() * 10);
      mesh.castShadow = true;
      scene.add(mesh);
      orbs.push({ mesh, good: isGood, drift: (Math.random() - 0.5) * 0.8, phase: Math.random() * 6.28 });
      // mantiene la referencia semántica del contenido de la IA
      mesh.userData.label = isGood
        ? goodWords[orbs.length % goodWords.length]
        : badWords[orbs.length % badWords.length];
    }
    for (let i = 0; i < 6; i++) spawnOrb();

    let local = 0;
    let spawnTimer = 0;
    let hurt = 0;

    rig.onFrame((dt, t) => {
      bubbles.update(dt, t);
      burst.update(dt);

      // Agua ondulante
      const p = waterGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const x = basePos[i * 3]!;
        const y = basePos[i * 3 + 1]!;
        p.setZ(i, Math.sin(x * 0.5 + t * 1.4) * 0.28 + Math.cos(y * 0.4 + t) * 0.22);
      }
      p.needsUpdate = true;

      plants.forEach((pl, i) => {
        pl.rotation.z = Math.sin(t * 1.1 + i) * 0.18;
      });

      // Pez: nada solo + control del jugador
      const d = dirRef.current;
      const auto = new THREE.Vector3(Math.sin(t * 0.7) * 0.5, Math.sin(t * 0.9) * 0.25, Math.cos(t * 0.5) * 0.4);
      const move = new THREE.Vector3(d.x * 3.4, -d.y * 2.1, d.y * 2.4).add(auto);
      fish.position.addScaledVector(move, dt);
      fish.position.x = THREE.MathUtils.clamp(fish.position.x, -7, 7);
      fish.position.y = THREE.MathUtils.clamp(fish.position.y, 0.9, 5.6);
      fish.position.z = THREE.MathUtils.clamp(fish.position.z, -7, 6);
      fish.rotation.y = THREE.MathUtils.lerp(fish.rotation.y, Math.atan2(move.z, move.x) * -1, Math.min(1, dt * 4));
      tail.rotation.y = Math.sin(t * 12) * 0.45;
      body.rotation.z = Math.sin(t * 3) * 0.06;
      if (hurt > 0) {
        hurt -= dt;
        bodyMat.color.lerp(new THREE.Color(0xf58bcb), 0.2);
      } else {
        bodyMat.color.lerp(new THREE.Color(0xffb347), 0.1);
      }

      // Orbes con vida propia
      spawnTimer += dt;
      if (spawnTimer > 1.1) {
        spawnTimer = 0;
        spawnOrb();
      }
      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i]!;
        o.mesh.rotation.y += dt * 1.2;
        o.mesh.position.x += Math.sin(t + o.phase) * dt * o.drift;
        o.mesh.position.y += Math.sin(t * 1.4 + o.phase) * dt * 0.5;
        if (o.mesh.position.distanceTo(fish.position) < 0.85) {
          burst.spawn(o.mesh.position.clone(), o.good ? 0x3fbe8f : 0xf58bcb, o.good ? 26 : 12);
          scene.remove(o.mesh);
          orbs.splice(i, 1);
          if (o.good) {
            local += 1;
            setScore(local);
            if (local >= REQUIRED && !doneRef.current) {
              doneRef.current = true;
              onComplete?.();
              setWon(true);
            }
          } else {
            hurt = 0.5;
          }
        }
      }

      rig.camera.position.x = fish.position.x * 0.25 + Math.sin(t * 0.3) * 0.5;
      rig.camera.position.y = 4.6 + Math.sin(t * 0.4) * 0.2;
      rig.camera.lookAt(fish.position.x * 0.3, 2, fish.position.z * 0.2);
    });

    return () => rig.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameShell
      title="Pez en el agua"
      cue="ATRAPA 🐟 lo que te sana"
      progress={{ value: score, max: REQUIRED }}
      dpad={(x, y) => dirRef.current.set(x, y)}
      won={won}
      wonText="Elegiste lo que te nutre y dejaste pasar lo que pesa."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
    >
      <div ref={host} className="h-full w-full" aria-label="Escenario acuático 3D del pez" />
    </GameShell>
  );
}

export default FishInWater;
