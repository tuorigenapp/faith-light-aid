import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles, makeGround, makeTextPanel } from "./engine3d";

/**
 * Palabras en el cofre — mundo 3D vivo.
 * Las palabras flotan como objetos 3D sobre un claro del bosque; el jugador
 * toca las que pertenecen a su práctica y vuelan al cofre con partículas.
 * El contenido lo determina la IA de ORÍGEN (props correct/decoys).
 */
export function ChestWords({
  correct,
  decoys = [],
  onComplete,
  onClose,
  onNext,
}: {
  correct: string[];
  decoys?: string[];
  onComplete?: () => void;
  onClose?: () => void;
  onNext?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [saved, setSaved] = useState(0);
  const [won, setWon] = useState(false);
  const goal = Math.max(1, correct.length);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x1c1233,
      fog: [16, 44],
      cameraPos: [0, 5.4, 10.5],
      lookAt: [0, 2, 0],
      hemi: [0xffe9c9, 0x35225c],
    });
    const { scene } = rig;

    makeGround(scene, { radius: 11, color: 0x3d2a63, plateColor: 0x2b1c49 });
    const dust = makeAmbientParticles(scene, { count: 110, spread: 22, height: 10, color: 0xffe9b0, size: 0.1, speed: 0.4, up: true });
    const burst = createBurstPool(scene);

    // Cofre 3D
    const chest = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.2, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 0.6 }),
    );
    box.position.y = 0.6;
    box.castShadow = true;
    chest.add(box);
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 2.4, 20, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xa06d40, roughness: 0.55 }),
    );
    lid.rotation.z = Math.PI / 2;
    lid.position.y = 1.2;
    lid.castShadow = true;
    chest.add(lid);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd479, emissive: 0xffb347, emissiveIntensity: 1.1, transparent: true, opacity: 0.55 }),
    );
    glow.position.y = 1.1;
    chest.add(glow);
    chest.position.set(0, 0, 3.1);
    scene.add(chest);

    // Palabras flotantes
    type Word = { mesh: THREE.Mesh; ok: boolean; phase: number; taken: boolean; base: THREE.Vector3 };
    const words: Word[] = [];
    const all = [
      ...correct.map((w) => ({ w, ok: true })),
      ...decoys.slice(0, Math.max(2, correct.length)).map((w) => ({ w, ok: false })),
    ];
    all.forEach((item, i) => {
      const mesh = makeTextPanel(item.w, { bg: item.ok ? "#ffffff" : "#F6EAFF", fg: "#241539", width: 1.75 });
      const cols = 2;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const base = new THREE.Vector3(-1.05 + col * 2.1, 4.1 - row * 1.25, -1.2 + row * 0.35);

      mesh.position.copy(base);
      scene.add(mesh);
      words.push({ mesh, ok: item.ok, phase: i * 0.7, taken: false, base });
    });

    let local = 0;
    function onPointer(ev: PointerEvent) {
      if (pausedRef.current) return;
      const hits = rig.pick(ev.clientX, ev.clientY, words.filter((w) => !w.taken).map((w) => w.mesh));
      const first = hits[0];
      if (!first) return;
      const w = words.find((x) => x.mesh === first.object);
      if (!w) return;
      if (!w.ok) {
        burst.spawn(w.mesh.position.clone(), 0xf58bcb, 14);
        w.mesh.rotation.z = 0.25;
        setTimeout(() => (w.mesh.rotation.z = 0), 180);
        return;
      }
      w.taken = true;
      burst.spawn(w.mesh.position.clone(), 0x3fbe8f, 26);
      local += 1;
      setSaved(local);
      if (local >= goal && !doneRef.current) {
        doneRef.current = true;
        onComplete?.();
        setWon(true);
      }
    }
    rig.renderer.domElement.addEventListener("pointerdown", onPointer);

    rig.onFrame((dt, t) => {
      dust.update(dt, t);
      burst.update(dt);
      glow.scale.setScalar(1 + Math.sin(t * 2.4) * 0.08);
      lid.rotation.x = Math.sin(t * 1.2) * 0.05;
      for (const w of words) {
        if (w.taken) {
          w.mesh.position.lerp(chest.position.clone().setY(1.1), Math.min(1, dt * 4.2));
          w.mesh.scale.multiplyScalar(1 - Math.min(0.9, dt * 1.6));
          w.mesh.rotation.y += dt * 5;
        } else {
          w.mesh.position.y = w.base.y + Math.sin(t * 1.5 + w.phase) * 0.16;
          w.mesh.rotation.y = Math.sin(t * 0.8 + w.phase) * 0.3;
          w.mesh.rotation.z = Math.sin(t * 1.1 + w.phase) * 0.05;
        }
      }
      rig.camera.position.x = Math.sin(t * 0.22) * 0.7;
      rig.camera.lookAt(0, 2, 0.6);
    });

    return () => {
      rig.renderer.domElement.removeEventListener("pointerdown", onPointer);
      rig.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameShell
      title="Palabras en el cofre"
      cue="TOCA 👆 tus palabras"
      progress={{ value: saved, max: goal }}
      won={won}
      wonText="Esas palabras ya son tuyas: guardadas en tu cofre."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
    >
      <div ref={host} className="h-full w-full" aria-label="Escenario 3D del cofre de palabras" />
    </GameShell>
  );
}

export default ChestWords;
