import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles, makeCharacter, animateIdle, makeGround } from "./engine3d";

/**
 * Lanza la bola de pimpón — física 3D real.
 * Persona 3D que prepara, lanza y reacciona; la bola tiene gravedad,
 * giro, trayectoria, colisiones y rebote. El usuario controla dirección
 * y fuerza arrastrando el dedo (swipe) sobre el escenario.
 */
const REQUIRED = 3;
const G = -9.8;

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
  const [hits, setHits] = useState(0);
  const [won, setWon] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x1a1030,
      fog: [18, 46],
      cameraPos: [0, 4.2, 9.6],
      lookAt: [0, 1.4, -2],
      hemi: [0xffeccd, 0x33245a],
    });
    const { scene } = rig;
    makeGround(scene, { radius: 12, color: 0x3a2a5e, plateColor: 0x271a45 });
    const dust = makeAmbientParticles(scene, { count: 80, spread: 20, height: 8, color: 0xffe6b3, size: 0.09, speed: 0.35, up: true });
    const burst = createBurstPool(scene);

    // Mesa
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x2f6f5a, roughness: 0.6 }),
    );
    table.position.set(0, 0.9, -1.5);
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);
    for (const [x, z] of [[-3, 1.6], [3, 1.6], [-3, -4.6], [3, -4.6]] as [number, number][]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.9, 10),
        new THREE.MeshStandardMaterial({ color: 0x4a3670, roughness: 0.8 }),
      );
      leg.position.set(x, 0.45, z);
      scene.add(leg);
    }

    // Vasos objetivo
    type Cup = { mesh: THREE.Mesh; pos: THREE.Vector3; filled: boolean; phase: number };
    const cups: Cup[] = [];
    const cupPositions: [number, number][] = [[-1.5, -3.4], [0, -4.2], [1.5, -3.4]];
    cupPositions.forEach(([x, z], i) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.32, 0.85, 22, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xf58bcb, roughness: 0.35, side: THREE.DoubleSide }),
      );
      mesh.position.set(x, 1.48, z);
      mesh.castShadow = true;
      scene.add(mesh);
      cups.push({ mesh, pos: mesh.position.clone(), filled: false, phase: i * 1.1 });
    });

    // Persona 3D lanzadora
    const player = makeCharacter(0x7c4dff, 0xffd479);
    player.position.set(0, 0, 3.4);
    player.scale.setScalar(1.4);
    scene.add(player);

    // Bola
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0xfff6d8, roughness: 0.25 }),
    );
    ball.castShadow = true;
    scene.add(ball);

    const rest = new THREE.Vector3(0, 1.9, 3.1);
    ball.position.copy(rest);
    const vel = new THREE.Vector3();
    let flying = false;
    let throwAnim = 0;
    let local = 0;

    // Indicador de fuerza/dirección
    const aim = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 1.1, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd479, emissive: 0xffb347, emissiveIntensity: 0.7 }),
    );
    aim.visible = false;
    scene.add(aim);

    let start: { x: number; y: number } | null = null;

    function down(ev: PointerEvent) {
      if (pausedRef.current || flying || doneRef.current) return;
      start = { x: ev.clientX, y: ev.clientY };
      aim.visible = true;
    }
    function move(ev: PointerEvent) {
      if (!start) return;
      const dx = (ev.clientX - start.x) / 140;
      const dy = (start.y - ev.clientY) / 140;
      aim.position.copy(rest).add(new THREE.Vector3(dx * 0.9, 0.4, -Math.max(0.2, dy) * 0.9));
      aim.rotation.set(-Math.PI / 3, 0, -Math.atan2(dx, Math.max(0.2, dy)));
      aim.scale.setScalar(THREE.MathUtils.clamp(Math.hypot(dx, dy), 0.5, 2.2));
    }
    function up(ev: PointerEvent) {
      if (!start || flying) return;
      const dx = (ev.clientX - start.x) / 130;
      const dy = (start.y - ev.clientY) / 130;
      start = null;
      aim.visible = false;
      const power = THREE.MathUtils.clamp(Math.hypot(dx, dy), 0.35, 2.4);
      vel.set(dx * 3.1, 4.4 + power * 1.5, -(2.6 + Math.max(0.25, dy) * 3.4));
      flying = true;
      throwAnim = 0.4;
    }
    const cv = rig.renderer.domElement;
    cv.addEventListener("pointerdown", down);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);

    function reset() {
      flying = false;
      ball.position.copy(rest);
      vel.set(0, 0, 0);
    }

    rig.onFrame((dt, t) => {
      dust.update(dt, t);
      burst.update(dt);
      animateIdle(player, t, false);
      if (throwAnim > 0) {
        throwAnim -= dt;
        player.arms.forEach((a) => (a.rotation.x = -1.5 + throwAnim * 2));
      }
      for (const c of cups) {
        c.mesh.position.y = c.pos.y + Math.sin(t * 1.6 + c.phase) * 0.04;
        c.mesh.rotation.y += dt * 0.4;
      }

      if (flying) {
        vel.y += G * dt;
        ball.position.addScaledVector(vel, dt);
        ball.rotation.x += dt * 9;
        ball.rotation.z += dt * 5;

        // Colisión con la mesa (rebote)
        const onTable = Math.abs(ball.position.x) < 3.5 && ball.position.z < 2.5 && ball.position.z > -5.5;
        if (onTable && ball.position.y < 1.24 && vel.y < 0) {
          ball.position.y = 1.24;
          vel.y = -vel.y * 0.52;
          vel.multiplyScalar(0.86);
          if (Math.abs(vel.y) < 0.7) reset();
        }
        // Entrada en vaso
        for (const c of cups) {
          if (c.filled) continue;
          const d = Math.hypot(ball.position.x - c.pos.x, ball.position.z - c.pos.z);
          if (d < 0.4 && ball.position.y < 1.8 && ball.position.y > 1.0 && vel.y < 0) {
            c.filled = true;
            burst.spawn(c.pos.clone().setY(1.9), 0x3fbe8f, 30);
            (c.mesh.material as THREE.MeshStandardMaterial).color.set(0x3fbe8f);
            local += 1;
            setHits(local);
            reset();
            if (local >= REQUIRED && !doneRef.current) {
              doneRef.current = true;
              onComplete?.();
              setWon(true);
            } else if (cups.every((x) => x.filled)) {
              cups.forEach((x) => {
                x.filled = false;
                (x.mesh.material as THREE.MeshStandardMaterial).color.set(0xf58bcb);
              });
            }
            break;
          }
        }
        // Fuera del escenario
        if (ball.position.y < -1 || Math.abs(ball.position.x) > 8 || ball.position.z < -9 || ball.position.z > 7) reset();
      } else {
        ball.position.copy(rest);
        ball.position.y = rest.y + Math.sin(t * 2.4) * 0.05;
      }

      rig.camera.position.x = Math.sin(t * 0.24) * 0.6;
      rig.camera.lookAt(0, 1.5, -2);
    });

    return () => {
      cv.removeEventListener("pointerdown", down);
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up);
      rig.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameShell
      title="Bola de pimpón"
      cue="DESLIZA 🥎 y lanza"
      progress={{ value: hits, max: REQUIRED }}
      won={won}
      wonText="Puntería y calma: la constancia también se entrena."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
    >
      <div ref={host} className="h-full w-full" aria-label="Escenario 3D de lanzar la bola de pimpón" />
    </GameShell>
  );
}

export default PingPongToss;
