import * as THREE from "three";

/**
 * Motor 3D compartido de ORÍGEN.
 * Extrae el enfoque técnico de "Come-hojas" (iluminación cálida, sombras suaves,
 * cámara viva, partículas ambientales, personajes con idle) para que todos los
 * juegos de las prácticas diarias pertenezcan al mismo universo visual.
 * 100% local: sin CDN, sin modelos remotos, sin texturas externas.
 */

export type FrameCb = (dt: number, t: number) => void;

export type Rig = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  onFrame: (cb: FrameCb) => void;
  setPaused: (p: boolean) => void;
  pick: (clientX: number, clientY: number, objs: THREE.Object3D[]) => THREE.Intersection[];
  ndc: (clientX: number, clientY: number) => THREE.Vector2;
  dispose: () => void;
};

export function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function dailySeed() {
  const d = new Date();
  return d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate();
}

/** Escenario base: renderer, luces cinematográficas, cámara y bucle. */
export function createRig(
  el: HTMLElement,
  opts: {
    bg: number;
    fog?: [number, number];
    cameraPos?: [number, number, number];
    lookAt?: [number, number, number];
    sun?: number;
    hemi?: [number, number];
  },
): Rig {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.bg);
  if (opts.fog) scene.fog = new THREE.Fog(opts.bg, opts.fog[0], opts.fog[1]);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 160);
  const cp = opts.cameraPos ?? [0, 8, 12];
  camera.position.set(cp[0], cp[1], cp[2]);
  const la = opts.lookAt ?? [0, 0.6, 0];
  camera.lookAt(la[0], la[1], la[2]);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.touchAction = "none";
  el.appendChild(renderer.domElement);

  const hemi = opts.hemi ?? [0xfff4e0, 0x4c5a7a];
  scene.add(new THREE.HemisphereLight(hemi[0], hemi[1], 0.9));
  const sun = new THREE.DirectionalLight(opts.sun ?? 0xffe9c4, 1.45);
  sun.position.set(6, 12, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  scene.add(sun);

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

  const cbs: FrameCb[] = [];
  const clock = new THREE.Clock();
  let paused = false;
  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!paused) {
      const t = clock.elapsedTime;
      for (const cb of cbs) cb(dt, t);
    }
    renderer.render(scene, camera);
  }
  frame();

  const ray = new THREE.Raycaster();
  const v2 = new THREE.Vector2();

  function ndc(clientX: number, clientY: number) {
    const r = renderer.domElement.getBoundingClientRect();
    v2.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    return v2.clone();
  }

  return {
    scene,
    camera,
    renderer,
    onFrame: (cb) => cbs.push(cb),
    setPaused: (p) => {
      paused = p;
    },
    ndc,
    pick: (clientX, clientY, objs) => {
      ray.setFromCamera(ndc(clientX, clientY), camera);
      return ray.intersectObjects(objs, true);
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cbs.length = 0;
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    },
  };
}

/** Personaje 3D con piernas animables (idle + caminar + reacción). */
export type Character = THREE.Group & { legs: THREE.Mesh[]; arms: THREE.Mesh[] };

export function makeCharacter(color = 0x7c4dff, hatColor = 0xe0b25c): Character {
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
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    eye.position.set(0.12 * s, 0.46, 0.29);
    g.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), new THREE.MeshStandardMaterial({ color: 0x241539 }));
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

  const arms: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.05, 0.2, 4, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4 }),
    );
    arm.position.set(0.3 * s, 0.42, 0.05);
    arm.rotation.z = 0.5 * s;
    g.add(arm);
    arms.push(arm);
  }

  const out = g as Character;
  out.legs = legs;
  out.arms = arms;
  return out;
}

/** Idle vivo: respira aunque nadie toque nada. */
export function animateIdle(ch: Character, t: number, moving = false) {
  ch.position.y = moving ? Math.abs(Math.sin(t * 11)) * 0.08 : Math.sin(t * 2.2) * 0.03;
  ch.legs.forEach((leg, i) => {
    leg.rotation.x = moving ? Math.sin(t * 11 + i * Math.PI) * 0.7 : Math.sin(t * 2 + i) * 0.06;
  });
  ch.arms.forEach((arm, i) => {
    arm.rotation.x = moving ? Math.sin(t * 11 + i * Math.PI) * 0.5 : Math.sin(t * 1.8 + i) * 0.1;
  });
}

/** Partículas ambientales (polvo dorado, burbujas, hojas...). */
export function makeAmbientParticles(
  scene: THREE.Scene,
  opts: { count?: number; spread?: number; height?: number; color?: number; size?: number; speed?: number; up?: boolean },
) {
  const count = opts.count ?? 90;
  const spread = opts.spread ?? 16;
  const height = opts.height ?? 8;
  const pos = new Float32Array(count * 3);
  const rand = seededRandom(dailySeed() + count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rand() - 0.5) * spread;
    pos[i * 3 + 1] = rand() * height;
    pos[i * 3 + 2] = (rand() - 0.5) * spread;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: opts.color ?? 0xfff3c4,
      size: opts.size ?? 0.12,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
  );
  scene.add(points);
  const speed = opts.speed ?? 0.6;
  const up = opts.up ?? false;

  return {
    points,
    update(dt: number, t: number) {
      const p = geo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        let y = p.getY(i) + (up ? dt * speed : -dt * speed);
        if (up && y > height) y = 0;
        if (!up && y < 0) y = height;
        p.setY(i, y);
        p.setX(i, p.getX(i) + Math.sin(t + i) * dt * 0.25);
      }
      p.needsUpdate = true;
    },
  };
}

/** Explosión de partículas de feedback (mismo lenguaje que Come-hojas). */
export function createBurstPool(scene: THREE.Scene) {
  const pool: { mesh: THREE.Points; life: number; vel: number[] }[] = [];
  return {
    spawn(at: THREE.Vector3, color = 0x3fbe8f, n = 22) {
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
        new THREE.PointsMaterial({ color, size: 0.16, transparent: true, depthWrite: false }),
      );
      scene.add(pts);
      pool.push({ mesh: pts, life: 1, vel });
    },
    update(dt: number) {
      for (let i = pool.length - 1; i >= 0; i--) {
        const b = pool[i]!;
        b.life -= dt * 1.6;
        const p = b.mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
        for (let k = 0; k < p.count; k++) {
          p.setX(k, p.getX(k) + b.vel[k * 3]! * dt);
          p.setY(k, Math.max(0, p.getY(k) + b.vel[k * 3 + 1]! * dt - dt * 1.6));
          p.setZ(k, p.getZ(k) + b.vel[k * 3 + 2]! * dt);
        }
        p.needsUpdate = true;
        (b.mesh.material as THREE.PointsMaterial).opacity = Math.max(0, b.life);
        if (b.life <= 0) {
          scene.remove(b.mesh);
          b.mesh.geometry.dispose();
          (b.mesh.material as THREE.Material).dispose();
          pool.splice(i, 1);
        }
      }
    },
  };
}

/** Etiqueta 3D de texto dibujada en canvas local (sin fuentes remotas). */
export function makeTextPanel(text: string, opts?: { bg?: string; fg?: string; width?: number }) {
  const w = 512;
  const h = 160;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const bg = opts?.bg ?? "#ffffff";
  ctx.fillStyle = bg;
  const r = 28;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.fill();
  ctx.fillStyle = opts?.fg ?? "#241539";
  let size = 74;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  while (ctx.measureText(text).width > w - 56 && size > 26) {
    size -= 4;
    ctx.font = `700 ${size}px system-ui, sans-serif`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + 4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  const width = opts?.width ?? 1.9;
  const geo = new THREE.BoxGeometry(width, width * (h / w), 0.09);
  const side = new THREE.MeshStandardMaterial({ color: 0xe9dcff, roughness: 0.5 });
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 });
  const mesh = new THREE.Mesh(geo, [side, side, side, side, face, side]);
  mesh.castShadow = true;
  return mesh;
}

/** Suelo circular con base, igual criterio que el jardín de Come-hojas. */
export function makeGround(scene: THREE.Scene, opts: { radius: number; color: number; plateColor?: number }) {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(opts.radius, 56),
    new THREE.MeshStandardMaterial({ color: opts.color, roughness: 0.9 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  if (opts.plateColor !== undefined) {
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(opts.radius * 0.98, opts.radius * 0.98, 0.4, 48),
      new THREE.MeshStandardMaterial({ color: opts.plateColor, roughness: 0.85 }),
    );
    plate.position.y = -0.22;
    plate.receiveShadow = true;
    scene.add(plate);
  }
  return ground;
}
