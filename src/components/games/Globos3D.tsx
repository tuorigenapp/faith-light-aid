import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles } from "lucide-react";
import { createRig, createBurstPool, makeAmbientParticles, makeGround, makeCharacter, animateIdle } from "./engine3d";

/**
 * Globo de afirmaciones — globos 3D con vida propia (suben, se mecen, giran).
 * Una persona 3D lanza un platillo al globo que tocas: explota y aparece la
 * afirmación. 100% local, sin CDN ni modelos externos.
 */

const AFIRMACIONES = [
  "Soy más que lo que me pasó.",
  "Puedo elegir distinto hoy.",
  "Mi calma no depende de nadie.",
  "Merezco lo bueno sin pedir permiso.",
  "Suelto lo que no me toca cargar.",
  "Estoy aprendiendo a quedarme conmigo.",
  "Mi historia no manda mi futuro.",
  "Hoy me trato con ternura.",
  "Lo que siento tiene lugar aquí.",
  "Voy despacio y sigo avanzando.",
];

type Balloon = {
  group: THREE.Group;
  speed: number;
  sway: number;
  phase: number;
  word: string;
  alive: boolean;
};

export function Globos3D({
  words,
  onWin,
  level,
}: {
  words: string[];
  onWin: (gems: number, learned?: string[]) => void;
  level: number;
}) {
  const goal = Math.min(30, 6 + Math.floor((Math.max(1, level) - 1) / 1));
  const host = useRef<HTMLDivElement>(null);
  const [popped, setPopped] = useState(0);
  const [phrase, setPhrase] = useState("Toca un globo: la persona lanza y la afirmación aparece.");
  const [learned, setLearned] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const poppedRef = useRef(0);
  const doneRef = useRef(false);
  const wordsRef = useRef(words);
  wordsRef.current = words;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x21174a,
      fog: [14, 40],
      cameraPos: [0, 3.4, 8.6],
      lookAt: [0, 3, 0],
      hemi: [0xffe9f4, 0x5b4a94],
      sun: 0xfff0dc,
    });
    const { scene, camera, renderer } = rig;
    const dust = makeAmbientParticles(scene, {
      count: 50,
      spread: 16,
      height: 9,
      color: 0xffd9f0,
      size: 0.08,
      speed: 0.3,
      up: true,
    });
    const burst = createBurstPool(scene);
    makeGround(scene, { radius: 12, color: 0x33265f, plateColor: 0x291d50 });

    // Persona que lanza
    const person = makeCharacter(0xf58bcb, 0xffd479);
    person.scale.setScalar(1.9);
    person.position.set(0, 0, 3.1);
    scene.add(person);

    // Platillo en vuelo
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.07, 22),
      new THREE.MeshStandardMaterial({ color: 0xffe6ad, roughness: 0.3, metalness: 0.2 }),
    );
    disc.visible = false;
    disc.castShadow = true;
    scene.add(disc);
    let flight: { from: THREE.Vector3; to: THREE.Vector3; t: number; onHit: () => void } | null = null;

    const balloons: Balloon[] = [];
    const palette = [0xf58bcb, 0x7c4dff, 0x3fbe8f, 0xf7b955, 0x6fb7f2];

    function bank() {
      const w = wordsRef.current.map((x) => (x ?? "").trim()).filter(Boolean);
      return w.length ? w : ["PAZ", "AMOR", "CALMA", "VALOR", "LUZ"];
    }

    function spawn(i: number) {
      const g = new THREE.Group();
      const color = palette[i % palette.length]!;
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.62, 26, 20),
        new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.05 }),
      );
      body.scale.set(1, 1.22, 1);
      body.castShadow = true;
      g.add(body);
      const knot = new THREE.Mesh(
        new THREE.ConeGeometry(0.13, 0.24, 12),
        new THREE.MeshStandardMaterial({ color, roughness: 0.4 }),
      );
      knot.position.y = -0.8;
      knot.rotation.x = Math.PI;
      g.add(knot);
      const shine = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 14, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }),
      );
      shine.position.set(-0.2, 0.28, 0.5);
      g.add(shine);
      const string = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 1.1, 6),
        new THREE.MeshStandardMaterial({ color: 0xffe6ad }),
      );
      string.position.y = -1.42;
      g.add(string);

      g.position.set((Math.random() - 0.5) * 6.4, -1.2 - Math.random() * 3, (Math.random() - 0.5) * 2.2);
      scene.add(g);
      const list = bank();
      balloons.push({
        group: g,
        speed: 0.55 + Math.random() * 0.5,
        sway: 0.4 + Math.random() * 0.6,
        phase: Math.random() * 6,
        word: (list[i % list.length] ?? "PAZ").toUpperCase(),
        alive: true,
      });
    }
    for (let i = 0; i < 7; i++) spawn(i);
    let spawnIndex = 7;

    function pop(b: Balloon) {
      if (!b.alive) return;
      b.alive = false;
      burst.spawn(b.group.position.clone(), 0xffd479, 30);
      scene.remove(b.group);
      const idx = balloons.indexOf(b);
      if (idx >= 0) balloons.splice(idx, 1);
      poppedRef.current += 1;
      setPopped(poppedRef.current);
      setPhrase(AFIRMACIONES[(poppedRef.current - 1) % AFIRMACIONES.length]!);
      setLearned((l) => (l.includes(b.word) ? l : [...l, b.word]));
      spawn(spawnIndex++);
    }

    function onPointer(e: PointerEvent) {
      const hits = rig.pick(
        e.clientX,
        e.clientY,
        balloons.map((b) => b.group),
      );
      if (!hits.length) return;
      let obj: THREE.Object3D | null = hits[0]!.object;
      let target: Balloon | undefined;
      while (obj && !target) {
        target = balloons.find((b) => b.group === obj);
        obj = obj.parent;
      }
      if (!target) return;
      const b = target;
      const from = new THREE.Vector3(0, 1.3, 3.1);
      flight = { from, to: b.group.position.clone(), t: 0, onHit: () => pop(b) };
      disc.position.copy(from);
      disc.visible = true;
    }
    renderer.domElement.addEventListener("pointerdown", onPointer);

    rig.onFrame((dt, t) => {
      dust.update(dt, t);
      burst.update(dt);
      animateIdle(person, t, !!flight);
      person.arms.forEach((a) => {
        a.rotation.x = flight ? -1.2 + flight.t * 1.6 : a.rotation.x;
      });

      for (const b of balloons) {
        b.group.position.y += b.speed * dt;
        b.group.position.x += Math.sin(t * b.sway + b.phase) * dt * 0.5;
        b.group.rotation.z = Math.sin(t * b.sway + b.phase) * 0.12;
        if (b.group.position.y > 7.4) {
          b.group.position.y = -1.6;
          b.group.position.x = (Math.random() - 0.5) * 6.4;
        }
      }

      if (flight) {
        flight.t = Math.min(1, flight.t + dt * 1.9);
        const p = flight.t;
        disc.position.lerpVectors(flight.from, flight.to, p);
        disc.position.y += Math.sin(p * Math.PI) * 1.1;
        disc.rotation.y += dt * 22;
        if (p >= 1) {
          flight.onHit();
          flight = null;
          disc.visible = false;
        }
      }

      camera.position.x = Math.sin(t * 0.24) * 0.5;
      camera.position.y = 3.4 + Math.sin(t * 0.4) * 0.15;
      camera.lookAt(0, 3, 0);
    });

    return () => {
      renderer.domElement.removeEventListener("pointerdown", onPointer);
      rig.dispose();
    };
  }, []);

  useEffect(() => {
    if (popped >= goal && !doneRef.current) {
      doneRef.current = true;
      setDone(true);
      onWin(50, learned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popped, goal]);

  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px] font-bold">
        <span className="text-primary">
          Globos abiertos {Math.min(popped, goal)}/{goal}
        </span>
        <span className="text-muted-foreground">Nivel {level}</span>
      </div>
      <div
        ref={host}
        className="mt-2 aspect-[4/5] max-h-[52vh] w-full overflow-hidden rounded-[16px] shadow-soft"
        aria-label="Globos 3D flotando con la persona que los abre"
      />
      <p className="mt-2 min-h-[42px] rounded-[14px] bg-primary/8 px-3 py-2 text-center font-display text-[15px] font-extrabold leading-snug text-primary">
        {done ? "Ya tienes tus afirmaciones del día. Léelas otra vez en voz baja." : phrase}
      </p>
      <p className="mt-1 text-center text-[12px] text-muted-foreground">
        <Sparkles className="mr-1 inline h-3.5 w-3.5" />
        Toca el globo que quieras: nada de internet, todo pasa en tu teléfono.
      </p>
      {learned.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {learned.map((w) => (
            <span key={w} className="rounded-full bg-[#F58BCB]/15 px-2.5 py-1 text-[11.5px] font-bold text-[#B4478C]">
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default Globos3D;
