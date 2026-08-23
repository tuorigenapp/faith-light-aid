import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Leaf, RotateCcw, Trophy } from "lucide-react";

/**
 * Come-hojas 3D — jardín vivo, personaje animado y oponentes ("la culpa")
 * con patrulla autónoma: se mueven aunque el jugador esté quieto.
 * La estructura de recompensa no cambia: se avisa onWin al completar
 * las rondas requeridas de la ronda diaria.
 */

const GRID = 11;
const CELL = 1.15;
const ROUNDS_REQUIRED = 5;

/** Desafío del día: siempre el mismo para todos, distinto cada día. */
function dailySeed() {
  const d = new Date();
  return d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate();
}
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

type Enemy = {
  mesh: THREE.Group;
  pos: THREE.Vector2;
  target: THREE.Vector2;
  speed: number;
  pause: number;
  legPhase: number;
};

function toWorld(x: number, y: number) {
  const off = ((GRID - 1) * CELL) / 2;
  return new THREE.Vector3(x * CELL - off, 0, y * CELL - off);
}

function makeCharacter(color: number, hatColor: number) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 18),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.05 }),
  );
  body.position.y = 0.38;
  body.castShadow = true;
  g.add(body);

  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.3, 18),
    new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.4 }),
  );
  hat.position.y = 0.78;
  g.add(hat);

  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    eye.position.set(0.12 * s, 0.46, 0.29);
    g.add(eye);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x241539 }),
    );
    pupil.position.set(0.12 * s, 0.46, 0.345);
    g.add(pupil);
  }

  const legs: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055, 0.14, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a2a58 }),
    );
    leg.position.set(0.13 * s, 0.11, 0);
    g.add(leg);
    legs.push(leg);
  }
  (g as THREE.Group & { legs: THREE.Mesh[] }).legs = legs;
  return g as THREE.Group & { legs: THREE.Mesh[] };
}

function makeLeaf() {
  const geo = new THREE.SphereGeometry(0.17, 14, 10);
  geo.scale(1, 0.32, 1.5);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x3fbe8f, roughness: 0.5, emissive: 0x0d4d38, emissiveIntensity: 0.25 }),
  );
  mesh.castShadow = true;
  return mesh;
}

export function ComeHojas3D({ onWin, level }: { onWin: (gems: number) => void; level: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [leaves, setLeaves] = useState(0);
  const [totalLeaves, setTotalLeaves] = useState(0);
  const [danger, setDanger] = useState(0);
  const [round, setRound] = useState(1);
  const [msg, setMsg] = useState<string>("");
  const [rewarded, setRewarded] = useState(false);
  const dirRef = useRef(new THREE.Vector2(0, 0));
  const restartRef = useRef<(() => void) | null>(null);
  const roundRef = useRef(1);
  const rewardedRef = useRef(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdff1e6);
    scene.fog = new THREE.Fog(0xdff1e6, 14, 30);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    // Luces cálidas
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x4c7a5a, 0.85));
    const sun = new THREE.DirectionalLight(0xffe9c4, 1.5);
    sun.position.set(6, 11, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);

    // Suelo
    const size = GRID * CELL;
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(size * 0.82, 48),
      new THREE.MeshStandardMaterial({ color: 0x6fbf8b, roughness: 0.9 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(size, 0.35, size),
      new THREE.MeshStandardMaterial({ color: 0x8fd6a6, roughness: 0.85 }),
    );
    plate.position.y = -0.18;
    plate.receiveShadow = true;
    scene.add(plate);

    // Vegetación de borde (se mece con el viento)
    const trees: THREE.Group[] = [];
    const rand = seededRandom(dailySeed());
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + rand() * 0.2;
      const r = size * 0.62 + rand() * size * 0.2;
      const t = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.13, 0.9, 8),
        new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 0.9 }),
      );
      trunk.position.y = 0.45;
      t.add(trunk);
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.55 + rand() * 0.3, 1),
        new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0x2f9e6d : 0x3fbe8f, roughness: 0.7, flatShading: true }),
      );
      crown.position.y = 1.25;
      crown.castShadow = true;
      t.add(crown);
      t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      scene.add(t);
      trees.push(t);
    }

    // Partículas ambientales (hojas que caen)
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 90;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (rand() - 0.5) * size * 1.4;
      dustPos[i * 3 + 1] = rand() * 7;
      dustPos[i * 3 + 2] = (rand() - 0.5) * size * 1.4;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0xfff3c4, size: 0.12, transparent: true, opacity: 0.8 }),
    );
    scene.add(dust);

    // Personajes
    const player = makeCharacter(0x7c4dff, 0xe0b25c);
    scene.add(player);
    const playerPos = new THREE.Vector2(1, 1);

    const enemies: Enemy[] = [];
    const burstPool: { mesh: THREE.Points; life: number }[] = [];

    // Hojas
    let leafMeshes: { mesh: THREE.Mesh; key: string; phase: number }[] = [];

    function clearGroup(objs: THREE.Object3D[]) {
      for (const o of objs) scene.remove(o);
    }

    function difficulty() {
      const lvl = Math.max(1, level) + (roundRef.current - 1);
      return {
        enemies: Math.min(4, 1 + Math.floor(lvl / 2)),
        speed: Math.min(2.6, 1.15 + lvl * 0.12),
        density: Math.min(0.5, 0.26 + lvl * 0.02),
      };
    }

    function build() {
      clearGroup(leafMeshes.map((l) => l.mesh));
      leafMeshes = [];
      clearGroup(enemies.map((e) => e.mesh));
      enemies.length = 0;

      const d = difficulty();
      const r = seededRandom(dailySeed() + roundRef.current * 977 + level * 31);
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          if (x === 1 && y === 1) continue;
          if (r() > d.density) continue;
          const mesh = makeLeaf();
          const w = toWorld(x, y);
          mesh.position.set(w.x, 0.2, w.z);
          mesh.rotation.y = r() * Math.PI;
          scene.add(mesh);
          leafMeshes.push({ mesh, key: `${x}-${y}`, phase: r() * 6.28 });
        }
      }
      setTotalLeaves(leafMeshes.length);
      setLeaves(0);
      setDanger(0);

      for (let i = 0; i < d.enemies; i++) {
        const mesh = makeCharacter(0xf58bcb, 0x8a3f6d);
        const px = GRID - 2 - (i % 2) * 3;
        const py = GRID - 2 - Math.floor(i / 2) * 3;
        const w = toWorld(px, py);
        mesh.position.set(w.x, 0, w.z);
        scene.add(mesh);
        enemies.push({
          mesh,
          pos: new THREE.Vector2(px, py),
          target: new THREE.Vector2(Math.floor(r() * GRID), Math.floor(r() * GRID)),
          speed: d.speed * (0.85 + r() * 0.3),
          pause: 0,
          legPhase: r() * 6.28,
        });
      }

      playerPos.set(1, 1);
      const w0 = toWorld(1, 1);
      player.position.set(w0.x, 0, w0.z);
      dirRef.current.set(0, 0);
    }

    function burst(at: THREE.Vector3) {
      const n = 22;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3);
      const vel: number[] = [];
      for (let i = 0; i < n; i++) {
        pos[i * 3] = at.x;
        pos[i * 3 + 1] = at.y;
        pos[i * 3 + 2] = at.z;
        vel.push((Math.random() - 0.5) * 2.4, Math.random() * 2.6, (Math.random() - 0.5) * 2.4);
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(
        geo,
        new THREE.PointsMaterial({ color: 0x3fbe8f, size: 0.16, transparent: true }),
      );
      (pts as THREE.Points & { vel: number[] }).vel = vel;
      scene.add(pts);
      burstPool.push({ mesh: pts, life: 1 });
    }

    let over = false;

    function resize() {
      const w = el.clientWidth || 320;
      const h = el.clientHeight || 320;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    build();
    restartRef.current = () => {
      over = false;
      setMsg("");
      build();
    };

    const clock = new THREE.Clock();
    let raf = 0;
    const camTarget = new THREE.Vector3();

    function frame() {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // Viento en vegetación
      trees.forEach((tr, i) => {
        tr.rotation.z = Math.sin(t * 1.1 + i) * 0.05;
      });
      // Partículas cayendo
      const dp = dust.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        let y = dp.getY(i) - dt * 0.6;
        if (y < 0) y = 7;
        dp.setY(i, y);
        dp.setX(i, dp.getX(i) + Math.sin(t + i) * dt * 0.25);
      }
      dp.needsUpdate = true;

      // Hojas: viento + flotación
      for (const l of leafMeshes) {
        l.mesh.rotation.z = Math.sin(t * 1.6 + l.phase) * 0.25;
        l.mesh.position.y = 0.2 + Math.sin(t * 2 + l.phase) * 0.05;
      }

      if (!over) {
        // Jugador
        const d = dirRef.current;
        const moving = d.lengthSq() > 0;
        const sp = 3.1;
        if (moving) {
          const nx = THREE.MathUtils.clamp(playerPos.x + d.x * dt * sp, 0, GRID - 1);
          const ny = THREE.MathUtils.clamp(playerPos.y + d.y * dt * sp, 0, GRID - 1);
          playerPos.set(nx, ny);
          player.rotation.y = Math.atan2(d.x, d.y);
        }
        const pw = toWorld(playerPos.x, playerPos.y);
        player.position.x += (pw.x - player.position.x) * Math.min(1, dt * 14);
        player.position.z += (pw.z - player.position.z) * Math.min(1, dt * 14);
        // idle / caminar
        player.position.y = moving ? Math.abs(Math.sin(t * 11)) * 0.08 : Math.sin(t * 2.2) * 0.03;
        player.legs.forEach((leg, i) => {
          leg.rotation.x = moving ? Math.sin(t * 11 + i * Math.PI) * 0.7 : Math.sin(t * 2 + i) * 0.06;
        });

        // Recoger hojas
        for (let i = leafMeshes.length - 1; i >= 0; i--) {
          const l = leafMeshes[i]!;
          if (l.mesh.position.distanceTo(player.position) < 0.55) {
            burst(l.mesh.position.clone());
            scene.remove(l.mesh);
            leafMeshes.splice(i, 1);
            setLeaves((n) => n + 1);
          }
        }

        // Oponentes con IA autónoma (patrulla + persecución progresiva)
        for (const e of enemies) {
          e.pause -= dt;
          const distToPlayer = e.pos.distanceTo(playerPos);
          const sees = distToPlayer < 5.5;
          if (sees) e.target.copy(playerPos);
          if (e.pos.distanceTo(e.target) < 0.4 || (!sees && Math.random() < dt * 0.35)) {
            e.target.set(Math.random() * (GRID - 1), Math.random() * (GRID - 1));
            if (Math.random() < 0.25) e.pause = 0.5 + Math.random() * 0.7;
          }
          if (e.pause <= 0) {
            const dir = e.target.clone().sub(e.pos);
            if (dir.lengthSq() > 0.0001) {
              dir.normalize();
              const speed = e.speed * (sees ? 1.12 : 0.8);
              e.pos.x = THREE.MathUtils.clamp(e.pos.x + dir.x * dt * speed, 0, GRID - 1);
              e.pos.y = THREE.MathUtils.clamp(e.pos.y + dir.y * dt * speed, 0, GRID - 1);
              e.mesh.rotation.y = Math.atan2(dir.x, dir.y);
              e.legPhase += dt * 9;
              e.mesh.position.y = Math.abs(Math.sin(e.legPhase)) * 0.07;
              (e.mesh as THREE.Group & { legs: THREE.Mesh[] }).legs.forEach((leg, i) => {
                leg.rotation.x = Math.sin(e.legPhase + i * Math.PI) * 0.6;
              });
            }
          } else {
            e.mesh.position.y = Math.sin(t * 2.4) * 0.03;
          }
          const ew = toWorld(e.pos.x, e.pos.y);
          e.mesh.position.x += (ew.x - e.mesh.position.x) * Math.min(1, dt * 12);
          e.mesh.position.z += (ew.z - e.mesh.position.z) * Math.min(1, dt * 12);

          if (distToPlayer < 0.7) {
            over = true;
            setMsg("Te alcanzó la culpa. Respira y vuelve a intentarlo — no hay prisa.");
          }
        }

        const nearest = enemies.reduce((m, e) => Math.min(m, e.pos.distanceTo(playerPos)), 99);
        setDanger(Math.max(0, Math.min(1, 1 - nearest / 6)));

        // Ronda superada
        if (leafMeshes.length === 0) {
          over = true;
          if (roundRef.current >= ROUNDS_REQUIRED) {
            if (!rewardedRef.current) {
              rewardedRef.current = true;
              setRewarded(true);
              onWin(70);
            }
            setMsg(`¡Completaste las ${ROUNDS_REQUIRED} rondas del desafío de hoy! Tus hojas ya están sumadas.`);
          } else {
            roundRef.current += 1;
            setRound(roundRef.current);
            setMsg(`Ronda superada. Vas por la ${roundRef.current} de ${ROUNDS_REQUIRED}.`);
          }
        }
      }

      // Partículas de recogida
      for (let i = burstPool.length - 1; i >= 0; i--) {
        const b = burstPool[i]!;
        b.life -= dt * 1.6;
        const p = b.mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
        const vel = (b.mesh as THREE.Points & { vel: number[] }).vel;
        for (let k = 0; k < p.count; k++) {
          p.setX(k, p.getX(k) + vel[k * 3]! * dt);
          p.setY(k, Math.max(0, p.getY(k) + vel[k * 3 + 1]! * dt - dt * 1.6));
          p.setZ(k, p.getZ(k) + vel[k * 3 + 2]! * dt);
        }
        p.needsUpdate = true;
        (b.mesh.material as THREE.PointsMaterial).opacity = Math.max(0, b.life);
        if (b.life <= 0) {
          scene.remove(b.mesh);
          burstPool.splice(i, 1);
        }
      }

      // Cámara cinematográfica que sigue al jugador
      camTarget.set(
        player.position.x * 0.55 + Math.sin(t * 0.3) * 0.3,
        8.6,
        player.position.z * 0.55 + 10.4,
      );
      camera.position.lerp(camTarget, Math.min(1, dt * 3));
      camera.lookAt(player.position.x * 0.4, 0.5, player.position.z * 0.4);

      renderer.render(scene, camera);
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDir = (x: number, y: number) => dirRef.current.set(x, y);

  return (
    <div>
      {/* HUD mínimo: el escenario es el protagonista */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3FBE8F]/14 px-3 py-1.5 text-[12.5px] font-bold text-[#1E7A5B]">
          <Leaf className="h-3.5 w-3.5" /> {leaves}/{totalLeaves || "—"}
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">Culpa</p>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-[#F58BCB] transition-all duration-200"
              style={{ width: `${Math.round(danger * 100)}%` }}
            />
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[12.5px] font-bold text-primary">
          <Trophy className="h-3.5 w-3.5" /> {Math.min(round, ROUNDS_REQUIRED)}/{ROUNDS_REQUIRED}
        </span>
      </div>

      <div
        ref={host}
        className="mt-2 aspect-square w-full overflow-hidden rounded-[16px] shadow-soft"
        aria-label="Jardín 3D del juego Come-hojas"
      />

      {msg && <p className="mt-2 text-center text-[13.5px] font-bold text-primary">{msg}</p>}
      {!rewarded && (
        <p className="mt-1 text-center text-[12px] text-muted-foreground">
          Sin límite de tiempo. La recompensa llega al completar las {ROUNDS_REQUIRED} rondas de hoy.
        </p>
      )}

      {/* Control táctil */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { l: "", a: () => {} },
          { l: "▲", a: () => setDir(0, -1) },
          { l: "", a: () => {} },
          { l: "◀", a: () => setDir(-1, 0) },
          { l: "■", a: () => setDir(0, 0) },
          { l: "▶", a: () => setDir(1, 0) },
          { l: "", a: () => {} },
          { l: "▼", a: () => setDir(0, 1) },
          { l: "", a: () => {} },
        ].map((b, i) =>
          b.l ? (
            <button
              key={i}
              onPointerDown={b.a}
              className="h-12 rounded-[12px] bg-secondary text-[17px] font-bold active:scale-[.97]"
            >
              {b.l}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>

      <button
        onClick={() => restartRef.current?.()}
        className="mt-3 inline-flex h-11 items-center gap-2 rounded-[12px] bg-primary/10 px-4 text-[13.5px] font-bold text-primary"
      >
        <RotateCcw className="h-4 w-4" /> Reiniciar esta ronda
      </button>
    </div>
  );
}

export default ComeHojas3D;
