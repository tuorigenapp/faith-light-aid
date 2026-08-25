import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles, makeCharacter, animateIdle, makeGround } from "./engine3d";

/**
 * Lanza el dardo en el aro — física 3D real.
 * Persona 3D que apunta y lanza; el dardo gira, viaja con gravedad y
 * colisiona con la diana. La mira se mueve sola: el jugador toca para lanzar.
 */
const REQUIRED = 3;
const G = -6.4;

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
  const [hits, setHits] = useState(0);
  const [won, setWon] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x1b1233,
      fog: [16, 44],
      cameraPos: [0, 3.4, 8.6],
      lookAt: [0, 2.4, -6],
      hemi: [0xffe4c4, 0x2c1d4f],
    });
    const { scene } = rig;
    makeGround(scene, { radius: 12, color: 0x3b2a60, plateColor: 0x281b47 });
    const dust = makeAmbientParticles(scene, { count: 70, spread: 18, height: 8, color: 0xffdca8, size: 0.09, speed: 0.4, up: true });
    const burst = createBurstPool(scene);

    // Diana 3D con anillos
    const board = new THREE.Group();
    const ringColors = [0xf6f2ff, 0x9d7bff, 0xf58bcb, 0xffd479];
    ringColors.forEach((c, i) => {
      const r = 1.5 - i * 0.34;
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, 0.16 + i * 0.02, 34),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.45 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.z = i * 0.03;
      ring.castShadow = true;
      board.add(ring);
    });
    board.position.set(0, 2.9, -7);
    scene.add(board);

    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 2.9, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a3670, roughness: 0.8 }),
    );
    stand.position.set(0, 1.45, -7);
    scene.add(stand);

    // Persona 3D
    const player = makeCharacter(0x7c4dff, 0xffd479);
    player.position.set(0, 0, 2.6);
    player.scale.setScalar(1.45);
    scene.add(player);

    // Dardo 3D
    const dart = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10),
      new THREE.MeshStandardMaterial({ color: 0xe9dcff, roughness: 0.4 }),
    );
    shaft.rotation.x = Math.PI / 2;
    dart.add(shaft);
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.34, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd479, metalness: 0.5, roughness: 0.25 }),
    );
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.6;
    dart.add(tip);
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.28, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xf58bcb, roughness: 0.5 }),
      );
      fin.position.z = 0.42;
      fin.rotation.z = (i / 3) * Math.PI * 2;
      dart.add(fin);
    }
    dart.castShadow = true;
    scene.add(dart);
    const rest = new THREE.Vector3(0.35, 2.1, 2.2);
    dart.position.copy(rest);

    // Mira viva: se mueve sola sobre la diana
    const reticle = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.055, 10, 22),
      new THREE.MeshStandardMaterial({ color: 0x3fbe8f, emissive: 0x1c8f68, emissiveIntensity: 0.9 }),
    );
    scene.add(reticle);

    const vel = new THREE.Vector3();
    let flying = false;
    let anim = 0;
    let local = 0;
    let aimX = 0;
    let aimY = 0;

    function tap() {
      if (pausedRef.current || flying || doneRef.current) return;
      flying = true;
      anim = 0.35;
      dart.position.copy(rest);
      const dz = board.position.z - dart.position.z;
      const time = 0.95;
      vel.set(
        (board.position.x + aimX - dart.position.x) / time,
        (board.position.y + aimY - dart.position.y) / time - (G * time) / 2,
        dz / time,
      );
    }
    const cv = rig.renderer.domElement;
    cv.addEventListener("pointerdown", tap);

    rig.onFrame((dt, t) => {
      dust.update(dt, t);
      burst.update(dt);
      animateIdle(player, t, false);
      if (anim > 0) {
        anim -= dt;
        player.arms.forEach((a) => (a.rotation.x = -1.6 + anim * 2.4));
      }
      board.rotation.z = Math.sin(t * 0.7) * 0.06;

      // La mira se desplaza sola (dificultad viva, sin leer instrucciones)
      aimX = Math.sin(t * 1.5) * 1.15;
      aimY = Math.cos(t * 1.1) * 0.55;
      reticle.position.set(board.position.x + aimX, board.position.y + aimY, board.position.z + 0.3);
      reticle.rotation.z += dt * 1.5;

      if (flying) {
        vel.y += G * dt;
        dart.position.addScaledVector(vel, dt);
        dart.rotation.z += dt * 14;
        dart.rotation.x = Math.atan2(-vel.y, -vel.z);

        if (dart.position.z <= board.position.z + 0.25) {
          const dx = dart.position.x - board.position.x;
          const dy = dart.position.y - board.position.y;
          const d = Math.hypot(dx, dy);
          flying = false;
          if (d < 0.62) {
            burst.spawn(dart.position.clone(), 0xffd479, 34);
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
          setTimeout(() => dart.position.copy(rest), 260);
        }
        if (dart.position.y < -1) {
          flying = false;
          dart.position.copy(rest);
        }
      } else {
        dart.position.y = rest.y + Math.sin(t * 2.2) * 0.05;
        dart.rotation.set(0, 0, Math.sin(t) * 0.1);
      }

      rig.camera.position.x = Math.sin(t * 0.22) * 0.5;
      rig.camera.lookAt(0, 2.6, -6);
    });

    return () => {
      cv.removeEventListener("pointerdown", tap);
      rig.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameShell
      title="Dardo en el aro"
      cue="APUNTA 🎯 y toca"
      progress={{ value: hits, max: REQUIRED }}
      won={won}
      wonText="Enfoque en el centro: así se toman decisiones firmes."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
    >
      <div ref={host} className="h-full w-full" aria-label="Escenario 3D de lanzar el dardo" />
    </GameShell>
  );
}

export default DartThrow;
