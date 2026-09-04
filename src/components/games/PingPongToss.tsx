import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameShell } from "./GameShell";
import { createRig, createBurstPool, makeAmbientParticles } from "./engine3d";
import { useGameLevels } from "@/lib/game-progress";

/**
 * Lanzar la bola de pimpón — 3 niveles con varias rondas.
 * Mecánica: un marcador oscila, tocas "Lanzar" y la bola sale con esa fuerza.
 * Cada nivel: el marcador va más rápido y la zona buena se hace más estrecha.
 */
export function PingPongToss({
  storageKey = "pimpon",
  onComplete,
  onClose,
  onNext,
}: {
  storageKey?: string;
  onComplete?: () => void;
  onClose?: () => void;
  onNext?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const throwRef = useRef<(() => void) | null>(null);
  const [power, setPower] = useState(0);
  const [hits, setHits] = useState(0);
  const [flying, setFlying] = useState(false);
  const [won, setWon] = useState(false);

  const levels = useGameLevels(`pimpon:${storageKey}`, () => {
    onComplete?.();
    setWon(true);
  });

  const needed = levels.level; // 1 · 2 · 3 aciertos por ronda
  const cfg = useRef({ speed: 0.8, window: 0.16, needed: 1 });
  cfg.current.speed = 0.75 + levels.level * 0.35;
  cfg.current.window = 0.2 - levels.level * 0.035;
  cfg.current.needed = needed;

  const roundRef = useRef<() => void>(() => {});
  roundRef.current = () => levels.clearRound();

  // Etiqueta de ronda: al cambiar de ronda el motor se reinicia sin recrear la escena
  const tagRef = useRef("");
  tagRef.current = `${levels.level}:${levels.round}`;

  useEffect(() => setHits(0), [levels.level, levels.round]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x2a2160,
      cameraPos: [0, 2.6, 7.4],
      lookAt: [0, 1.5, -2],
      hemi: [0xffffff, 0x6f68a8],
      sun: 0xfff6e6,
    });
    const { scene } = rig;
    const dust = makeAmbientParticles(scene, {
      count: 22,
      spread: 10,
      height: 6,
      color: 0xffe9b0,
      size: 0.07,
      speed: 0.2,
      up: true,
    });
    const burst = createBurstPool(scene);

    const table = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.3, 12, 2, 1, 2),
      new THREE.MeshStandardMaterial({ color: 0x3b3282, roughness: 0.85 }),
    );
    table.position.set(0, 0.4, -3);
    table.receiveShadow = true;
    scene.add(table);

    // Vaso objetivo grande
    const cup = new THREE.Group();
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.5, 1.1, 32, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xf3ecff, roughness: 0.4, side: THREE.DoubleSide }),
    );
    wall.position.y = 0.55;
    cup.add(wall);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.07, 12, 40),
      new THREE.MeshStandardMaterial({
        color: 0x7be0a8,
        emissive: 0x3fbe8f,
        emissiveIntensity: 0.7,
      }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.1;
    cup.add(rim);
    cup.position.set(0, 0.55, -5.4);
    scene.add(cup);

    // Bola
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 28, 20),
      new THREE.MeshStandardMaterial({ color: 0xffd479, roughness: 0.3 }),
    );
    const rest = new THREE.Vector3(0, 1.15, 2.4);
    ball.position.copy(rest);
    ball.castShadow = true;
    scene.add(ball);

    let osc = 0;
    let dir = 1;
    let inFlight = false;
    let tFly = 0;
    let strength = 0;
    let localHits = 0;
    let closing = false;
    const from = new THREE.Vector3();

    throwRef.current = () => {
      if (pausedRef.current || inFlight || closing) return;
      strength = osc;
      inFlight = true;
      tFly = 0;
      from.copy(rest);
      setFlying(true);
    };

    let myTag = tagRef.current;

    rig.onFrame((dt, t) => {
      if (myTag !== tagRef.current) {
        myTag = tagRef.current;
        closing = false;
        localHits = 0;
        inFlight = false;
        tFly = 0;
        osc = 0;
        dir = 1;
        setFlying(false);
      }
      dust.update(dt, t);
      burst.update(dt);
      rim.scale.setScalar(1 + Math.sin(t * 2) * 0.03);
      cup.position.x = Math.sin(t * (0.3 + levels.level * 0.12)) * (levels.level - 1) * 0.9;

      if (!inFlight) {
        if (!pausedRef.current) {
          osc += dir * dt * cfg.current.speed;
          if (osc > 1) {
            osc = 1;
            dir = -1;
          }
          if (osc < 0) {
            osc = 0;
            dir = 1;
          }
          setPower(osc);
        }
        ball.position.copy(rest);
        ball.position.y = rest.y + Math.sin(t * 2) * 0.05;
        return;
      }

      tFly += dt * 1.35;
      const ideal = 0.62;
      const err = strength - ideal;
      const targetZ = cup.position.z - err * 4.2;
      const targetX = cup.position.x + err * 1.6;
      const p = Math.min(1, tFly);
      ball.position.x = THREE.MathUtils.lerp(from.x, targetX, p);
      ball.position.z = THREE.MathUtils.lerp(from.z, targetZ, p);
      ball.position.y = 1.15 + Math.sin(p * Math.PI) * 2.4 - p * 0.35;

      if (p >= 1) {
        inFlight = false;
        setFlying(false);
        const ok = Math.abs(err) <= cfg.current.window;
        if (ok) {
          burst.spawn(cup.position.clone().setY(1.2), 0x7be0a8, 26);
          localHits += 1;
          setHits(localHits);
          if (localHits >= cfg.current.needed && !closing) {
            closing = true;
            window.setTimeout(() => roundRef.current(), 500);
          }
        } else {
          burst.spawn(ball.position.clone(), 0xf58bcb, 14);
        }
        ball.position.copy(rest);
        osc = 0;
        dir = 1;
      }
    });

    const cv = rig.renderer.domElement;
    const tap = () => throwRef.current?.();
    cv.addEventListener("pointerdown", tap);

    return () => {
      cv.removeEventListener("pointerdown", tap);
      throwRef.current = null;
      rig.dispose();
    };
  }, [levels.level]);

  const goodZone = 0.2 - levels.level * 0.035;

  return (
    <GameShell
      title="Bola de pimpón"
      cue="Suelta cuando el marcador esté en verde"
      progress={{ value: levels.totalDone, max: levels.totalRounds }}
      level={levels.level}
      round={levels.round}
      roundsInLevel={levels.roundsInLevel}
      levelUp={levels.levelUp}
      won={won}
      wonText="Aprendiste a soltar en el momento justo."
      onNext={onNext}
      onClose={onClose}
      onPauseChange={(p) => (pausedRef.current = p)}
      footer={
        <div className="mx-auto max-w-[420px]">
          <div className="relative h-5 overflow-hidden rounded-full bg-white/15">
            <span
              className="absolute inset-y-0 rounded-full bg-[#7BE0A8]/45"
              style={{ left: `${(0.62 - goodZone) * 100}%`, width: `${goodZone * 200}%` }}
            />
            <span
              className="absolute top-0 h-5 w-1.5 rounded-full bg-white"
              style={{ left: `calc(${power * 100}% - 3px)` }}
            />
          </div>
          <p className="mt-2 text-center text-[12px] font-bold text-white/70">
            Aciertos {hits}/{levels.level}
          </p>
          <button
            onClick={() => throwRef.current?.()}
            disabled={flying}
            className="mt-3 h-[56px] w-full rounded-full bg-white text-[17px] font-black text-[#241539] transition active:scale-[.98] disabled:opacity-60"
          >
            Lanzar
          </button>
        </div>
      }
    >
      <div ref={host} className="h-full w-full" aria-label="Mesa de pimpón en 3D" />
    </GameShell>
  );
}

export default PingPongToss;
