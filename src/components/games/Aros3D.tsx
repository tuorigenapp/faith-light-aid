import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCcw, Target } from "lucide-react";
import { createRig, createBurstPool, makeAmbientParticles, makeGround } from "./engine3d";
import { cn } from "@/lib/utils";

/**
 * Aros de verdad — lanzamiento con física real (apuntas, cargas fuerza y el aro
 * viaja en parábola) sobre una mesa con tres recipientes 3D.
 * 100% local: geometría propia, sin modelos ni texturas externas.
 */

type Ring = {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  alive: boolean;
  landed: boolean;
  spin: number;
};

const G = -9.8;

export function Aros3D({
  words,
  onWin,
  level,
}: {
  words: string[];
  onWin: (gems: number, learned?: string[]) => void;
  level: number;
}) {
  const goal = Math.min(12, 3 + Math.floor((Math.max(1, level) - 1) / 1));
  const host = useRef<HTMLDivElement>(null);
  const [scored, setScored] = useState(0);
  const [thrown, setThrown] = useState(0);
  const [learned, setLearned] = useState<string[]>([]);
  const [aim, setAim] = useState(0);
  const [power, setPower] = useState(0);
  const [msg, setMsg] = useState("Apunta con el vaivén y mantén pulsado para cargar.");
  const [done, setDone] = useState(false);

  const aimRef = useRef(0);
  const powerRef = useRef(0);
  const chargingRef = useRef(false);
  const throwRef = useRef<((aim: number, power: number) => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const wordsRef = useRef(words);
  const scoredRef = useRef(0);
  const doneRef = useRef(false);
  wordsRef.current = words;

  /* --------------------------------------------------------- escena 3D */
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x1d1236,
      fog: [12, 34],
      cameraPos: [0, 3.1, 7.4],
      lookAt: [0, 1.1, -1.6],
      hemi: [0xfff0d6, 0x5a4a86],
      sun: 0xfff1d4,
    });
    const { scene, camera } = rig;
    const dust = makeAmbientParticles(scene, {
      count: 40,
      spread: 14,
      height: 7,
      color: 0xffe6b4,
      size: 0.07,
      speed: 0.25,
      up: true,
    });
    const burst = createBurstPool(scene);
    makeGround(scene, { radius: 11, color: 0x2c1f52 });

    // Mesa de madera con mantel
    const table = new THREE.Group();
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 0.26, 6.2),
      new THREE.MeshStandardMaterial({ color: 0x9a6a3c, roughness: 0.62 }),
    );
    top.position.set(0, 0.9, -1.6);
    top.castShadow = true;
    top.receiveShadow = true;
    table.add(top);
    const cloth = new THREE.Mesh(
      new THREE.BoxGeometry(6.1, 0.05, 5.9),
      new THREE.MeshStandardMaterial({ color: 0x3b2a6e, roughness: 0.9 }),
    );
    cloth.position.set(0, 1.05, -1.6);
    cloth.receiveShadow = true;
    table.add(cloth);
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.16, 0.9, 14),
        new THREE.MeshStandardMaterial({ color: 0x7d532c, roughness: 0.7 }),
      );
      leg.position.set(sx * 2.8, 0.45, -1.6 + sz * 2.6);
      leg.castShadow = true;
      table.add(leg);
    }
    scene.add(table);

    // Tres recipientes con su poste
    const targets: { pos: THREE.Vector3; radius: number; ring: THREE.Mesh; group: THREE.Group }[] = [];
    const spots: [number, number, number][] = [
      [-1.9, -1.1, 0x7c4dff],
      [0, -2.6, 0xf58bcb],
      [1.9, -1.1, 0x3fbe8f],
    ];
    for (const [x, z, color] of spots) {
      const g = new THREE.Group();
      const jar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.36, 0.72, 26, 1, true),
        new THREE.MeshStandardMaterial({ color, roughness: 0.35, side: THREE.DoubleSide }),
      );
      jar.position.y = 0.36;
      jar.castShadow = true;
      g.add(jar);
      const lip = new THREE.Mesh(
        new THREE.TorusGeometry(0.52, 0.055, 10, 30),
        new THREE.MeshStandardMaterial({ color: 0xffe6ad, roughness: 0.3 }),
      );
      lip.rotation.x = Math.PI / 2;
      lip.position.y = 0.72;
      g.add(lip);
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.07, 1.15, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd479, roughness: 0.35 }),
      );
      post.position.y = 0.9;
      post.castShadow = true;
      g.add(post);
      g.position.set(x, 1.08, z);
      scene.add(g);
      targets.push({ pos: new THREE.Vector3(x, 1.08, z), radius: 0.6, ring: lip, group: g });
    }

    // Aro guía en la mano + guía de trayectoria
    const ringGeo = new THREE.TorusGeometry(0.3, 0.075, 12, 28);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xffd479, roughness: 0.3, metalness: 0.15 });
    const hand = new THREE.Mesh(ringGeo, ringMat);
    hand.rotation.x = Math.PI / 2;
    hand.castShadow = true;
    scene.add(hand);

    const guideGeo = new THREE.BufferGeometry();
    guideGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
    const guide = new THREE.Points(
      guideGeo,
      new THREE.PointsMaterial({ color: 0xffe6ad, size: 0.09, transparent: true, opacity: 0.75, depthWrite: false }),
    );
    scene.add(guide);

    const START = new THREE.Vector3(0, 1.55, 3.6);
    const rings: Ring[] = [];

    function velocityFor(aimN: number, powerN: number) {
      const p = 0.55 + powerN * 0.85;
      return new THREE.Vector3(aimN * 3.4 * p, 5.1 * p, -6.4 * p);
    }

    function drawGuide(aimN: number, powerN: number) {
      const v = velocityFor(aimN, powerN);
      const p = guideGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < 24; i++) {
        const t = i * 0.055;
        p.setXYZ(
          i,
          START.x + v.x * t,
          START.y + v.y * t + 0.5 * G * t * t,
          START.z + v.z * t,
        );
      }
      p.needsUpdate = true;
    }

    throwRef.current = (aimN, powerN) => {
      if (doneRef.current) return;
      const mesh = new THREE.Mesh(ringGeo, ringMat.clone());
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(START);
      mesh.castShadow = true;
      scene.add(mesh);
      rings.push({ mesh, vel: velocityFor(aimN, powerN), alive: true, landed: false, spin: 6 + powerN * 8 });
      setThrown((n) => n + 1);
    };

    resetRef.current = () => {
      for (const r of rings) scene.remove(r.mesh);
      rings.length = 0;
    };

    rig.onFrame((dt, t) => {
      dust.update(dt, t);
      burst.update(dt);

      // vaivén de puntería si no se está cargando
      hand.position.set(START.x + aimRef.current * 0.9, START.y + Math.sin(t * 2.2) * 0.05, START.z);
      hand.rotation.z = aimRef.current * 0.5;
      drawGuide(aimRef.current, powerRef.current);

      for (const tg of targets) {
        tg.group.position.y = 1.08 + Math.sin(t * 1.4 + tg.pos.x) * 0.03;
        tg.group.rotation.y += dt * 0.35;
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]!;
        if (r.landed) {
          r.mesh.position.y += Math.sin(t * 3) * 0.0015;
          continue;
        }
        r.vel.y += G * dt;
        r.mesh.position.addScaledVector(r.vel, dt);
        r.mesh.rotation.z += r.spin * dt;

        // ¿entró en un recipiente?
        for (const tg of targets) {
          const dx = r.mesh.position.x - tg.group.position.x;
          const dz = r.mesh.position.z - tg.pos.z;
          const near = Math.hypot(dx, dz) < tg.radius;
          if (near && r.vel.y < 0 && r.mesh.position.y <= tg.pos.y + 1.35 && r.mesh.position.y >= tg.pos.y + 0.2) {
            r.landed = true;
            r.mesh.position.set(tg.group.position.x, tg.pos.y + 0.36, tg.pos.z);
            burst.spawn(new THREE.Vector3(tg.group.position.x, tg.pos.y + 1.1, tg.pos.z), 0x7be0a8, 26);
            const bank = wordsRef.current.filter(Boolean);
            const w = (bank[scoredRef.current % Math.max(1, bank.length)] ?? "VERDAD").toUpperCase();
            scoredRef.current += 1;
            setScored(scoredRef.current);
            setLearned((l) => (l.includes(w) ? l : [...l, w]));
            setMsg(`¡Dentro! Guardaste "${w}".`);
            camera.position.z -= 0.06;
            break;
          }
        }

        if (!r.landed && r.mesh.position.y < 0.9 && Math.abs(r.mesh.position.z + 1.6) < 3.2) {
          // rebota en la mesa y se queda
          r.mesh.position.y = 1.12;
          r.vel.set(r.vel.x * 0.2, 0, r.vel.z * 0.2);
          r.landed = true;
          setMsg("Cayó fuera. Ajusta la fuerza y vuelve a intentarlo.");
        } else if (!r.landed && r.mesh.position.y < -1.5) {
          scene.remove(r.mesh);
          rings.splice(i, 1);
          setMsg("Se fue lejos. Menos fuerza la próxima vez.");
        }
        if (rings.length > 14) {
          const old = rings.shift();
          if (old) scene.remove(old.mesh);
        }
      }
      camera.position.x = Math.sin(t * 0.28) * 0.3;
      camera.lookAt(0, 1.2, -1.6);
    });

    return () => {
      throwRef.current = null;
      resetRef.current = null;
      rig.dispose();
    };
  }, []);

  /* ------------------------------------------------ puntería y fuerza */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (chargingRef.current) {
        powerRef.current = Math.min(1, powerRef.current + dt * 0.9);
      } else {
        aimRef.current = Math.sin(now / 900) * 0.9;
      }
      setAim(aimRef.current);
      setPower(powerRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (scored >= goal && !doneRef.current) {
      doneRef.current = true;
      setDone(true);
      setMsg("Todos los aros dentro: eso también es puntería del alma.");
      onWin(60, learned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scored, goal]);

  function release() {
    if (!chargingRef.current) return;
    chargingRef.current = false;
    throwRef.current?.(aimRef.current, powerRef.current);
    powerRef.current = 0;
    setPower(0);
  }

  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px] font-bold">
        <span className="text-primary">
          Aros dentro {Math.min(scored, goal)}/{goal}
        </span>
        <span className="text-muted-foreground">Lanzamientos {thrown}</span>
      </div>
      <div
        ref={host}
        className="mt-2 aspect-[4/5] max-h-[52vh] w-full overflow-hidden rounded-[16px] shadow-soft"
        aria-label="Mesa 3D con recipientes para lanzar los aros"
      />
      <p className="mt-2 min-h-[36px] text-center text-[13px] text-muted-foreground">{msg}</p>

      <div className="mt-1 space-y-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Dirección</span>
          <div className="relative mt-1 h-3 rounded-full bg-secondary">
            <span
              className="absolute top-0 h-3 w-3 rounded-full bg-primary transition-none"
              style={{ left: `calc(${((aim + 1) / 2) * 100}% - 6px)` }}
            />
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Fuerza</span>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-secondary">
            <span
              className="block h-3 rounded-full bg-gradient-to-r from-[#3FBE8F] to-[#F7B955]"
              style={{ width: `${power * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onPointerDown={() => {
            if (done) return;
            chargingRef.current = true;
          }}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          disabled={done}
          className={cn(
            "grid min-h-[56px] flex-1 place-items-center rounded-full bg-gradient-to-b from-primary to-[#5B34D6] text-[16px] font-bold text-white shadow-glow active:scale-[.98] transition",
            done && "opacity-60",
          )}
        >
          <span className="inline-flex items-center gap-2">
            <Target className="h-5 w-5" /> Mantén y suelta para lanzar
          </span>
        </button>
        <button
          onClick={() => {
            resetRef.current?.();
            setMsg("Mesa limpia. Respira y vuelve a apuntar.");
          }}
          aria-label="Limpiar la mesa"
          className="grid h-[56px] w-[56px] place-items-center rounded-full bg-secondary text-primary active:scale-95 transition"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {learned.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {learned.map((w) => (
            <span key={w} className="rounded-full bg-[#3FBE8F]/15 px-2.5 py-1 text-[11.5px] font-bold text-[#2F9C74]">
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default Aros3D;
