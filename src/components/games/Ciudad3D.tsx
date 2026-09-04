import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ChevronDown, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { createRig, createBurstPool, makeAmbientParticles, makeGround } from "./engine3d";

/**
 * Ordena tu caos — Tetris 3D: las piezas son bloques con volumen, la ciudad de
 * fondo crece con tu nivel y una grúa animada retira las líneas completas.
 * 100% local: geometría propia, sin CDN ni modelos externos.
 */

const COLS = 6;
const ROWS = 12;
const CELL = 0.62;

const SHAPES: number[][][] = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 1],
    [0, 1],
    [1, 1],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
];

const COLORS = [0x7c4dff, 0xf58bcb, 0x3fbe8f, 0xf7b955, 0x6fb7f2, 0xffa8a8];

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
}

export function Ciudad3D({
  onWin,
  level,
}: {
  onWin: (gems: number, learned?: string[]) => void;
  level: number;
}) {
  const lineGoal = Math.min(20, 3 + Math.floor((Math.max(1, level) - 1) / 1));
  const host = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState(0);
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState("Mueve, gira y encaja: cada línea es algo que sueltas.");
  const [done, setDone] = useState(false);

  const moveRef = useRef<((dx: number, dy: number) => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rig = createRig(el, {
      bg: 0x141033,
      fog: [16, 46],
      cameraPos: [0, 3.6, 9.4],
      lookAt: [0, 3.4, 0],
      hemi: [0xdfe9ff, 0x3d3570],
      sun: 0xfff0d8,
    });
    const { scene, camera } = rig;
    const dust = makeAmbientParticles(scene, {
      count: 40,
      spread: 18,
      height: 11,
      color: 0xbfd8ff,
      size: 0.07,
      speed: 0.25,
      up: true,
    });
    const burst = createBurstPool(scene);
    makeGround(scene, { radius: 14, color: 0x1d1846, plateColor: 0x171240 });

    // Ciudad de fondo: crece con el nivel
    const city = new THREE.Group();
    const buildings = Math.min(26, 8 + level * 2);
    for (let i = 0; i < buildings; i++) {
      const h = 1 + ((i * 37) % 9) * 0.42 + Math.min(3.5, level * 0.12);
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, h, 0.75),
        new THREE.MeshStandardMaterial({
          color: i % 3 === 0 ? 0x3c3378 : i % 3 === 1 ? 0x4a3f92 : 0x2f2a63,
          roughness: 0.7,
          emissive: 0x1a1440,
          emissiveIntensity: 0.5,
        }),
      );
      const side = i % 2 === 0 ? -1 : 1;
      b.position.set(side * (2.9 + ((i * 13) % 5) * 0.95), h / 2, -3 - ((i * 7) % 6) * 1.15);
      b.castShadow = true;
      city.add(b);
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffd479,
          emissive: 0xffb347,
          emissiveIntensity: 1.4,
        }),
      );
      light.position.set(b.position.x, h + 0.15, b.position.z);
      city.add(light);
    }
    scene.add(city);

    // Tablero: marco + celdas
    const originX = (-(COLS - 1) * CELL) / 2;
    const originY = 0.5;
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(COLS * CELL + 0.28, ROWS * CELL + 0.28, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x2b2260, roughness: 0.8 }),
    );
    frame.position.set(0, originY + ((ROWS - 1) * CELL) / 2, -0.22);
    frame.receiveShadow = true;
    scene.add(frame);

    const cellMeshes: THREE.Mesh[][] = [];
    const cellGeo = new THREE.BoxGeometry(CELL * 0.88, CELL * 0.88, CELL * 0.88);
    for (let r = 0; r < ROWS; r++) {
      const row: THREE.Mesh[] = [];
      for (let c = 0; c < COLS; c++) {
        const m = new THREE.Mesh(
          cellGeo,
          new THREE.MeshStandardMaterial({ color: 0x3fbe8f, roughness: 0.35, metalness: 0.1 }),
        );
        m.position.set(originX + c * CELL, originY + (ROWS - 1 - r) * CELL, 0);
        m.castShadow = true;
        m.visible = false;
        scene.add(m);
        row.push(m);
      }
      cellMeshes.push(row);
    }
    const pieceMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(
        cellGeo,
        new THREE.MeshStandardMaterial({ color: 0xf7b955, roughness: 0.3, metalness: 0.15 }),
      );
      m.castShadow = true;
      m.visible = false;
      scene.add(m);
      pieceMeshes.push(m);
    }

    // Grúa: entra y retira lo completado
    const crane = new THREE.Group();
    const mast = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 7.6, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xf7b955, roughness: 0.5 }),
    );
    mast.position.y = 3.8;
    crane.add(mast);
    const jib = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.18, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xffd479, roughness: 0.45 }),
    );
    jib.position.set(-1.9, 7.5, 0);
    crane.add(jib);
    const hook = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.26, 0.26),
      new THREE.MeshStandardMaterial({ color: 0xffe6ad, roughness: 0.3 }),
    );
    hook.position.set(-3.6, 6.6, 0);
    crane.add(hook);
    crane.position.set(3.5, 0, -1.2);
    scene.add(crane);

    const st = {
      board: emptyBoard(),
      shape: SHAPES[0]!,
      color: 1,
      x: 2,
      y: 0,
      lines: 0,
      over: false,
      craneT: 0,
    };

    function collide(dx: number, dy: number, sh?: number[][]) {
      const shape = sh ?? st.shape;
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r]!.length; c++) {
          if (!shape[r]![c]) continue;
          const nx = st.x + c + dx;
          const ny = st.y + r + dy;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && st.board[ny]![nx]) return true;
        }
      return false;
    }

    function spawn() {
      const i = Math.floor(Math.random() * SHAPES.length);
      st.shape = SHAPES[i]!;
      st.color = i + 1;
      st.x = Math.max(0, Math.floor((COLS - st.shape[0]!.length) / 2));
      st.y = 0;
      if (collide(0, 0)) {
        st.over = true;
        setOver(true);
        setMsg("Se llenó. No pasa nada: vuelve a empezar con calma.");
      }
    }

    function merge() {
      st.shape.forEach((row, r) =>
        row.forEach((v, c) => {
          if (v && st.y + r >= 0) st.board[st.y + r]![st.x + c] = st.color;
        }),
      );
      let cleared = 0;
      st.board = st.board.filter((row) => {
        if (row.every((v) => v !== 0)) {
          cleared++;
          return false;
        }
        return true;
      });
      while (st.board.length < ROWS) st.board.unshift(Array<number>(COLS).fill(0));
      if (cleared) {
        st.lines += cleared;
        setLines(st.lines);
        st.craneT = 1;
        burst.spawn(new THREE.Vector3(0, originY + 1.4, 0.3), 0x7be0a8, 30);
        setMsg(
          cleared > 1
            ? `¡${cleared} líneas de una! La grúa se lleva el peso.`
            : "Línea completa: la grúa se la lleva.",
        );
        if (st.lines >= lineGoal && !doneRef.current) {
          doneRef.current = true;
          setDone(true);
          onWin(70, []);
        }
      }
      spawn();
    }

    function drop() {
      if (st.over) return;
      if (collide(0, 1)) merge();
      else st.y++;
    }

    moveRef.current = (dx, dy) => {
      if (st.over || doneRef.current) return;
      if (dy > 0) {
        drop();
        return;
      }
      if (dy < 0) {
        const rot = st.shape[0]!.map((_, i) => st.shape.map((r) => r[i]!).reverse());
        if (!collide(0, 0, rot)) st.shape = rot;
        return;
      }
      if (!collide(dx, 0)) st.x += dx;
    };

    resetRef.current = () => {
      st.board = emptyBoard();
      st.lines = 0;
      st.over = false;
      setLines(0);
      setOver(false);
      setMsg("Otra vez, sin prisa. Cada línea es algo que sueltas.");
      spawn();
    };

    spawn();
    let acc = 0;
    const stepFor = () => Math.max(0.22, 0.62 - level * 0.02);

    rig.onFrame((dt, t) => {
      dust.update(dt, t);
      burst.update(dt);

      acc += dt;
      if (acc >= stepFor()) {
        acc = 0;
        if (!st.over && !doneRef.current) drop();
      }

      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          const v = st.board[r]![c]!;
          const m = cellMeshes[r]![c]!;
          m.visible = v > 0;
          if (v > 0) {
            (m.material as THREE.MeshStandardMaterial).color.setHex(
              COLORS[(v - 1) % COLORS.length]!,
            );
            m.rotation.y = Math.sin(t * 0.8 + r + c) * 0.06;
          }
        }

      let k = 0;
      st.shape.forEach((row, r) =>
        row.forEach((v, c) => {
          if (!v || k >= pieceMeshes.length) return;
          const m = pieceMeshes[k++]!;
          m.visible = true;
          (m.material as THREE.MeshStandardMaterial).color.setHex(
            COLORS[(st.color - 1) % COLORS.length]!,
          );
          m.position.set(originX + (st.x + c) * CELL, originY + (ROWS - 1 - (st.y + r)) * CELL, 0);
          m.rotation.z = Math.sin(t * 3) * 0.05;
        }),
      );
      for (let i = k; i < pieceMeshes.length; i++) pieceMeshes[i]!.visible = false;

      if (st.craneT > 0) {
        st.craneT = Math.max(0, st.craneT - dt * 0.7);
        const p = 1 - st.craneT;
        crane.position.x = THREE.MathUtils.lerp(3.5, 1.4, Math.sin(p * Math.PI));
        hook.position.y = 6.6 - Math.sin(p * Math.PI) * 4.6;
        crane.rotation.y = Math.sin(p * Math.PI) * 0.4;
      } else {
        crane.position.x = 3.5 + Math.sin(t * 0.5) * 0.08;
        hook.position.y = 6.6 + Math.sin(t * 1.2) * 0.12;
        crane.rotation.y = Math.sin(t * 0.3) * 0.06;
      }

      city.children.forEach((b, i) => {
        if ((b as THREE.Mesh).material instanceof THREE.MeshStandardMaterial) {
          const mat = (b as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat.emissiveIntensity > 1) mat.emissiveIntensity = 1.2 + Math.sin(t * 2 + i) * 0.3;
        }
      });

      camera.position.x = Math.sin(t * 0.2) * 0.35;
      camera.lookAt(0, 3.4, 0);
    });

    return () => {
      moveRef.current = null;
      resetRef.current = null;
      rig.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const btn =
    "grid h-14 place-items-center rounded-[14px] bg-secondary text-primary active:scale-95 transition";

  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px] font-bold">
        <span className="text-primary">
          Líneas ordenadas {Math.min(lines, lineGoal)}/{lineGoal}
        </span>
        <span className="text-muted-foreground">Nivel {level}</span>
      </div>
      <div
        ref={host}
        className="mt-2 aspect-[4/5] max-h-[50vh] w-full overflow-hidden rounded-[16px] shadow-soft"
        aria-label="Ciudad 3D con el tablero de bloques"
      />
      <p className="mt-2 min-h-[36px] text-center text-[13px] text-muted-foreground">
        {done ? "Tu ciudad quedó en orden. Así se siente soltar." : msg}
      </p>
      <div className="mx-auto mt-2 grid w-[236px] grid-cols-4 gap-2">
        <button aria-label="Izquierda" className={btn} onClick={() => moveRef.current?.(-1, 0)}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button aria-label="Girar" className={btn} onClick={() => moveRef.current?.(0, -1)}>
          <RotateCw className="h-6 w-6" />
        </button>
        <button aria-label="Bajar" className={btn} onClick={() => moveRef.current?.(0, 1)}>
          <ChevronDown className="h-6 w-6" />
        </button>
        <button aria-label="Derecha" className={btn} onClick={() => moveRef.current?.(1, 0)}>
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
      {over && (
        <button
          onClick={() => resetRef.current?.()}
          className="mx-auto mt-3 block min-h-[48px] rounded-full bg-primary px-6 text-[14px] font-bold text-primary-foreground active:scale-95 transition"
        >
          Empezar de nuevo
        </button>
      )}
    </div>
  );
}

export default Ciudad3D;
