import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles, makeGround, makeTextPanel } from "./engine3d";

/**
 * Adivina el concepto — juego 3D visual (sin muros de texto).
 * Cada opción es un cristal 3D con su palabra; el jugador reconoce la que
 * corresponde a su práctica del día. El contenido llega desde la IA.
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
  const [hits, setHits] = useState(0);
  const [won, setWon] = useState(false);
  const rounds = Math.min(4, Math.max(1, words.length));
  const doneRef = useRef(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const clean = words.map((w) => w.trim()).filter(Boolean);
    if (!clean.length) return;

    const rig = createRig(el, {
      bg: 0x14213d,
      fog: [14, 40],
      cameraPos: [0, 4.6, 10],
      lookAt: [0, 2.2, 0],
      hemi: [0xd9f0ff, 0x1d2b4d],
    });
    const { scene } = rig;
    makeGround(scene, { radius: 10, color: 0x24365e, plateColor: 0x1a2846 });
    const dust = makeAmbientParticles(scene, { count: 90, spread: 20, height: 9, color: 0xbfe6ff, size: 0.1, speed: 0.35, up: true });
    const burst = createBurstPool(scene);

    // Pedestal central con la pista
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.8, 0.5, 28),
      new THREE.MeshStandardMaterial({ color: 0x33497a, roughness: 0.7 }),
    );
    pedestal.position.set(0, 0.25, 2.6);
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.85, 0),
      new THREE.MeshStandardMaterial({ color: 0x9d7bff, emissive: 0x5b32c9, emissiveIntensity: 0.8, roughness: 0.25, flatShading: true }),
    );
    crystal.position.set(0, 1.5, 2.6);
    crystal.castShadow = true;
    scene.add(crystal);

    let hint = makeTextPanel("…", { bg: "#241539", fg: "#FFFFFF", width: 2.6 });
    hint.position.set(0, 2.9, 2.6);
    scene.add(hint);

    type Option = { mesh: THREE.Mesh; gem: THREE.Mesh; label: string; phase: number };
    let options: Option[] = [];
    let roundIdx = 0;
    let answer = "";
    let local = 0;

    function clearOptions() {
      for (const o of options) {
        scene.remove(o.mesh);
        scene.remove(o.gem);
      }
      options = [];
    }

    function buildRound() {
      clearOptions();
      answer = clean[roundIdx % clean.length]!;
      const pool = [answer, ...clean.filter((w) => w !== answer)].slice(0, 3);
      while (pool.length < 3) pool.push(["Miedo", "Culpa", "Prisa"][pool.length % 3]!);
      const shuffled = pool
        .map((w, i) => ({ w, k: (i * 7 + roundIdx * 5) % 11 }))
        .sort((a, b) => a.k - b.k)
        .map((x) => x.w);

      scene.remove(hint);
      hint = makeTextPanel(answer, { bg: "#241539", fg: "#FFFFFF", width: 2.6 });
      hint.position.set(0, 2.9, 2.6);
      scene.add(hint);

      shuffled.forEach((label, i) => {
        const x = -3.4 + i * 3.4;
        const mesh = makeTextPanel(label, { bg: "#FFFFFF", fg: "#241539", width: 2.2 });
        mesh.position.set(x, 1.3, -1.4);
        scene.add(mesh);
        const gem = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.5, 0),
          new THREE.MeshStandardMaterial({ color: 0x3fbe8f, roughness: 0.3, flatShading: true, emissive: 0x0f5c42, emissiveIntensity: 0.4 }),
        );
        gem.position.set(x, 2.5, -1.4);
        gem.castShadow = true;
        scene.add(gem);
        options.push({ mesh, gem, label, phase: i * 1.3 });
      });
    }
    buildRound();

    function onPointer(ev: PointerEvent) {
      if (pausedRef.current || doneRef.current) return;
      const targets = options.flatMap((o) => [o.mesh, o.gem]);
      const first = rig.pick(ev.clientX, ev.clientY, targets)[0];
      if (!first) return;
      const opt = options.find((o) => o.mesh === first.object || o.gem === first.object);
      if (!opt) return;
      if (opt.label !== answer) {
        burst.spawn(opt.gem.position.clone(), 0xf58bcb, 14);
        opt.mesh.rotation.z = 0.22;
        setTimeout(() => (opt.mesh.rotation.z = 0), 180);
        return;
      }
      burst.spawn(opt.gem.position.clone(), 0xffd479, 30);
      local += 1;
      setHits(local);
      if (local >= rounds) {
        doneRef.current = true;
        onComplete?.();
        setWon(true);
        clearOptions();
        return;
      }
      roundIdx += 1;
      buildRound();
    }
    rig.renderer.domElement.addEventListener("pointerdown", onPointer);

    rig.onFrame((dt, t) => {
      dust.update(dt, t);
      burst.update(dt);
      crystal.rotation.y += dt * 0.9;
      crystal.position.y = 1.5 + Math.sin(t * 1.7) * 0.14;
      hint.position.y = 2.9 + Math.sin(t * 1.3) * 0.08;
      for (const o of options) {
        o.gem.rotation.y += dt * 1.4;
        o.gem.rotation.x = Math.sin(t + o.phase) * 0.3;
        o.gem.position.y = 2.5 + Math.sin(t * 1.9 + o.phase) * 0.18;
        o.mesh.position.y = 1.3 + Math.sin(t * 1.4 + o.phase) * 0.1;
        o.mesh.rotation.y = Math.sin(t * 0.7 + o.phase) * 0.22;
      }
      rig.camera.position.x = Math.sin(t * 0.25) * 0.8;
      rig.camera.lookAt(0, 2.1, 0.4);
    });

    return () => {
      rig.renderer.domElement.removeEventListener("pointerdown", onPointer);
      rig.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameShell
      title="Adivina la palabra"
      cue="ELIGE 🧩 la que corresponde"
      progress={{ value: hits, max: rounds }}
      won={won}
      wonText="Reconoces tu tema del día sin dudar."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
    >
      <div ref={host} className="h-full w-full" aria-label="Escenario 3D del juego de adivinar palabras" />
    </GameShell>
  );
}

export default GuessWord;
