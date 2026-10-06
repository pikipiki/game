import * as THREE from 'three';
import { battlePoint, battleHexAt, BATTLE_CENTER_X, BATTLE_CENTER_Z } from './battle-space';
import { h3Texture } from './h3-assets';
import { BATTLE_TILES, CREATURES, SITES, WORLD, key, type Hex } from '../game/data';
import { activeUnit, reachable, unitCount, type Action, type GameState } from '../game/engine';

import { animationPlan, animationProgress } from '../game/battle-animation';

export interface Pick {
  hex?: Hex;
  unit?: string;
  site?: string;
}
const point = (h: Hex) => {
  const p = battlePoint(h);
  return new THREE.Vector3(p.x + BATTLE_CENTER_X, 0, p.z + BATTLE_CENTER_Z);
};
const material = (color: string, roughness = 0.8) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
function ball(
  parent: THREE.Group,
  size: [number, number, number],
  pos: [number, number, number],
  color: string,
) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), material(color));
  m.scale.set(...size);
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cylinder(
  parent: THREE.Group,
  top: number,
  bottom: number,
  height: number,
  pos: [number, number, number],
  color: string,
  sides = 8,
) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, sides), material(color));
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(
  parent: THREE.Group,
  size: [number, number, number],
  pos: [number, number, number],
  color: string,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color));
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function creatureModel(id: string): THREE.Group {
  const c = CREATURES[id],
    g = new THREE.Group();
  ball(g, [0.57, 0.72, 0.42], [0, 0.79, 0], c.color);
  ball(g, [0.47, 0.36, 0.4], [0, 0.47, 0.035], c.color);
  for (const side of [-1, 1]) {
    ball(g, [0.25, 0.12, 0.28], [side * 0.34, 0.14, 0.16], c.color);
    const arm = ball(g, [0.34, 0.12, 0.13], [side * 0.65, 0.67, 0], c.color);
    arm.rotation.z = side * -0.2;
    for (let i = 0; i < 3; i++)
      ball(g, [0.08, 0.13, 0.09], [side * (0.84 - i * 0.065), 0.6, 0.08 + i * 0.07], c.color);
    ball(g, [0.14, 0.18, 0.06], [side * 0.2, 1.13, 0.355], '#fff8e7');
    ball(g, [0.08, 0.105, 0.035], [side * 0.18, 1.1, 0.413], '#24203b');
    ball(g, [0.025, 0.031, 0.015], [side * 0.18 - 0.02, 1.14, 0.449], '#ffffff');
  }
  const nose = ball(
    g,
    [0.19, 0.3, 0.22],
    [0, 0.83, 0.49],
    c.family === 'sylve' ? '#9c75d0' : '#df8cd2',
  );
  nose.rotation.x = -0.3;
  if (c.family === 'sylve') {
    for (let i = 0; i < 9; i++) {
      const hair = cylinder(
        g,
        0,
        0.055,
        0.35 + (i % 3) * 0.06,
        [(i - 4) * 0.047, 0.42, 0.36],
        c.accent,
        5,
      );
      hair.rotation.z = (i - 4) * 0.05;
    }
    if (c.tier >= 2) {
      for (const side of [-1, 1]) {
        const leaf = ball(g, [0.27, 0.07, 0.18], [side * 0.49, 0.95, 0.015], c.accent);
        leaf.rotation.z = side * 0.3;
        if (c.tier === 3) {
          const horn = cylinder(g, 0.035, 0.07, 0.5, [side * 0.3, 1.57, 0], '#e0cca2');
          horn.rotation.z = side * -0.45;
          cylinder(g, 0, 0.04, 0.28, [side * 0.43, 1.69, 0.02], '#e0cca2');
        }
      }
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const hair = cylinder(
        g,
        0,
        0.07,
        0.4 + (i % 3) * 0.11,
        [(i - 3) * 0.054, 1.57, 0],
        c.accent,
        5,
      );
      hair.rotation.z = (i - 3) * -0.13;
    }
    if (c.tier >= 2)
      for (const side of [-1, 1]) {
        const wing = ball(g, [0.33, 0.08, 0.28], [side * 0.5, 0.99, -0.12], c.accent);
        wing.rotation.z = side * 0.6;
      }
    if (c.tier === 3)
      for (const side of [-1, 1]) {
        const wing = ball(g, [0.48, 0.09, 0.4], [side * 0.7, 1.05, -0.19], c.accent);
        wing.rotation.z = side * 0.7;
      }
  }
  if (c.tier > 1)
    cylinder(g, 0.61, 0.61, 0.06, [0, 0.47, 0], c.family === 'sylve' ? '#c9ab74' : '#e9c27f', 16);
  g.userData.creature = true;
  return g;
}
function label(text: string, color = '#fff5db'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#172330e8';
  ctx.beginPath();
  ctx.roundRect(4, 4, 248, 64, 24);
  ctx.fill();
  ctx.strokeStyle = '#8f8461';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 47);
  const texture = new THREE.CanvasTexture(canvas);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  s.scale.set(1.55, 0.44, 1);
  return s;
}
function tree(g: THREE.Group, x: number, z: number, seed: number) {
  const h = 0.65 + seed * 0.22;
  cylinder(g, 0.05, 0.075, 0.55, [x, 0.25, z], '#86725c', 6);
  cylinder(g, 0, 0.34, h, [x, 0.62, z], seed > 0.5 ? '#527e62' : '#65927a', 6);
  cylinder(g, 0, 0.26, h * 0.7, [x, 0.92, z], seed > 0.5 ? '#66987c' : '#7caa88', 6);
}
function castle(g: THREE.Group, level: number, dark = false) {
  const stone = dark ? '#6d647e' : '#e1d6b8',
    roof = dark ? '#8c5676' : '#5d7773';
  cylinder(g, 0.68, 0.78, 0.17, [0, 0.11, 0], '#949581', 6);
  box(g, [0.66, 0.67, 0.5], [0, 0.45, 0], stone);
  cylinder(g, 0, 0.49, 0.37, [0, 0.97, 0], roof, 4).rotation.y = Math.PI / 4;
  for (const x of [-0.46, 0.46])
    for (const z of [-0.28, 0.28]) {
      cylinder(g, 0.17, 0.2, 0.9, [x, 0.54, z], stone, 8);
      cylinder(g, 0, 0.24, 0.35, [x, 1.15, z], roof, 8);
      box(g, [0.045, 0.19, 0.015], [x, 0.66, z + 0.175], dark ? '#e8a188' : '#77808d');
    }
  box(g, [0.17, 0.28, 0.02], [0, 0.27, 0.26], '#5d645b');
  cylinder(g, 0.018, 0.018, 0.57, [0, 1.35, 0], '#d8bd83');
  const flag = box(g, [0.3, 0.18, 0.025], [0.15, 1.51, 0], dark ? '#bb668c' : '#dfbf78');
  flag.rotation.z = 0.12;
  if (level > 1) cylinder(g, 0.22, 0.27, 0.3, [0, 1.25, 0], stone, 8);
}
function landmark(g: THREE.Group, kind: string, level: number) {
  if (kind === 'castle' || kind === 'fortress') {
    castle(g, level, kind === 'fortress');
    return;
  }
  if (kind === 'gold') {
    ball(g, [0.55, 0.4, 0.4], [0, 0.3, 0], '#898980');
    box(g, [0.32, 0.35, 0.05], [0, 0.21, 0.39], '#413c3e');
    box(g, [0.47, 0.07, 0.15], [0, 0.43, 0.43], '#bf9970');
    for (let i = 0; i < 3; i++)
      ball(g, [0.14, 0.12, 0.13], [0.22 + i * 0.08, 0.15, 0.55 - i * 0.03], '#e4bc62');
  } else if (kind === 'crystal') {
    for (let i = 0; i < 5; i++) {
      const m = cylinder(
        g,
        0,
        0.14,
        0.5 + (i % 3) * 0.2,
        [Math.cos(i * 1.6) * 0.28, 0.35, Math.sin(i * 1.6) * 0.28],
        '#b5a4e5',
        5,
      );
      m.rotation.z = Math.sin(i) * 0.24;
    }
  } else if (kind === 'shrine') {
    cylinder(g, 0.56, 0.6, 0.14, [0, 0.13, 0], '#d4cfaa', 12);
    cylinder(g, 0.42, 0.42, 0.05, [0, 0.23, 0], '#6ac9c1', 16);
    cylinder(g, 0.08, 0.14, 0.5, [0, 0.43, 0], '#dfd8b4');
    ball(g, [0.2, 0.2, 0.2], [0, 0.84, 0], '#b9f5d5');
    for (const side of [-1, 1]) cylinder(g, 0.08, 0.1, 0.8, [side * 0.43, 0.54, 0], '#d4cfaa');
  } else {
    const tent = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 4), material('#bb8d85'));
    tent.position.y = 0.42;
    tent.rotation.y = Math.PI / 4;
    g.add(tent);
    cylinder(g, 0.12, 0.12, 0.1, [0.4, 0.1, 0.3], '#8f7160');
    ball(g, [0.08, 0.17, 0.08], [0.4, 0.24, 0.3], '#ffd482');
  }
}
export class GameScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-12, 12, 9, -9, 0.1, 100);
  private content = new THREE.Group();
  private raycaster = new THREE.Raycaster();
  private pickables: THREE.Object3D[] = [];
  private animated: THREE.Group[] = [];
  private selection = new THREE.Group();
  private angle = 0.12;
  private zoom = 1;
  private cameraTarget = new THREE.Vector3();
  private frame = 0;
  private battleMode = false;
  private observer: ResizeObserver;
  private down: { x: number; y: number; angle: number; panX: number; panZ: number } | null = null;
  private moved = false;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(
    private host: HTMLElement,
    private onPick: (pick: Pick) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    this.renderer.setClearColor('#121f29', 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    host.append(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight('#e8ecff', '#42545d', 2.3));
    const sun = new THREE.DirectionalLight('#fff0c7', 3.2);
    sun.position.set(-7, 16, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.bias = -0.002;
    this.scene.add(sun);
    this.scene.add(this.content, this.selection);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    const c = this.renderer.domElement;
    c.setAttribute(
      'aria-label',
      'Champ de bataille 3D : touchez une troupe ou une case. Glissez pour déplacer la vue ; les boutons contrôlent le zoom.',
    );
    c.addEventListener('pointerdown', (e) => {
      this.down = {
        x: e.clientX,
        y: e.clientY,
        angle: this.angle,
        panX: this.cameraTarget.x,
        panZ: this.cameraTarget.z,
      };
      this.moved = false;
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.down) return;
      const delta = e.clientX - this.down.x;
      if (Math.abs(delta) > 8 || Math.abs(e.clientY - this.down.y) > 8) this.moved = true;
      if (this.moved) {
        if (this.battleMode && !e.shiftKey) {
          const scale = (this.camera.right - this.camera.left) / this.host.clientWidth / this.zoom;
          this.cameraTarget.x = THREE.MathUtils.clamp(
            this.down.panX - delta * scale,
            -BATTLE_CENTER_X,
            BATTLE_CENTER_X,
          );
          this.cameraTarget.z = THREE.MathUtils.clamp(
            this.down.panZ - (e.clientY - this.down.y) * scale * 1.6,
            -BATTLE_CENTER_Z,
            BATTLE_CENTER_Z,
          );
        } else this.angle = this.down.angle + delta * 0.004;
        this.positionCamera();
      }
    });
    c.addEventListener('pointerup', (e) => {
      if (this.down && !this.moved) {
        this.camera.updateMatrixWorld(true);
        this.content.updateMatrixWorld(true);
        const rect = c.getBoundingClientRect();
        this.raycaster.setFromCamera(
          new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            (-(e.clientY - rect.top) / rect.height) * 2 + 1,
          ),
          this.camera,
        );
        const hits = this.raycaster.intersectObjects(this.pickables, true);
        // Text sprites have rectangular hit areas. They must never hide the cells below.
        const unitHit = hits.find(
          (h) => h.object instanceof THREE.Mesh && this.pickOf(h.object)?.unit,
        );
        if (unitHit) this.onPick(this.pickOf(unitHit.object)!);
        else {
          const ground = this.raycaster.ray.intersectPlane(
            new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.01),
            new THREE.Vector3(),
          );
          const hex = ground ? battleHexAt(ground.x, ground.z) : null;
          if (hex) this.onPick({ hex });
        }
      }
      this.down = null;
    });
    c.addEventListener('pointercancel', () => {
      this.down = null;
    });
    c.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.setZoom(e.deltaY > 0 ? -0.08 : 0.08);
      },
      { passive: false },
    );
    this.resize();
    this.animate();
  }
  private resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const span = Math.max(this.battleMode ? 10.2 : 6.1, (this.battleMode ? 17 : 10.2) / aspect);
    this.camera.left = -span * aspect;
    this.camera.right = span * aspect;
    this.camera.top = span;
    this.camera.bottom = -span;
    this.positionCamera();
  }
  private positionCamera() {
    this.camera.position.set(
      this.cameraTarget.x + 35 * Math.sin(this.angle),
      this.battleMode ? 23 : 20,
      this.cameraTarget.z + 35 * Math.cos(this.angle),
    );
    this.camera.lookAt(this.cameraTarget);
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
  }
  private pickOf(object: THREE.Object3D): Pick | null {
    let o: THREE.Object3D | null = object;
    while (o && !o.userData.pick) o = o.parent;
    return (o?.userData.pick as Pick) ?? null;
  }
  setZoom(delta: number) {
    this.zoom = THREE.MathUtils.clamp(this.zoom + delta, 0.7, 1.8);
    this.positionCamera();
  }
  resetCamera() {
    this.cameraTarget.set(0, 0, 0);
    this.angle = 0.12;
    this.zoom = 1;
    this.positionCamera();
  }
  private clean(g: THREE.Group) {
    g.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m.dispose());
      }
      if (o instanceof THREE.Sprite) {
        o.material.map?.dispose();
        o.material.dispose();
      }
    });
    g.clear();
  }
  update(state: GameState, selected: Hex | null, selectedUnit: string | null = null) {
    const battleMode = !!state.battle;
    if (battleMode !== this.battleMode) {
      this.battleMode = battleMode;
      this.zoom = 1;
      this.angle = 0.03;
      this.resize();
    }
    this.clean(this.content);
    this.clean(this.selection);
    this.pickables = [];
    this.animated = [];
    const battle = state.battle;
    this.scene.background = battle
      ? h3Texture(battle.site === 'camp2' ? 'battle-mountain.png' : 'battle-grass.png')
      : new THREE.Color('#8ca7a8');
    const tiles = battle ? BATTLE_TILES : WORLD;
    const moveKeys = new Set(battle ? reachable(state).map(key) : []);
    const active = activeUnit(state);
    if (battle) {
      const field = new THREE.Group();
      const shadows = new THREE.Mesh(
        new THREE.PlaneGeometry(48, 32),
        new THREE.ShadowMaterial({ opacity: 0.28 }),
      );
      shadows.rotation.x = -Math.PI / 2;
      shadows.position.y = -0.02;
      shadows.receiveShadow = true;
      field.add(shadows);
      battle.obstacles?.forEach((h) => {
        const p = battlePoint(h);
        ball(field, [0.68, 0.48, 0.62], [p.x, 0.3, p.z], '#797962');
      });
      if (battle.siege) {
        for (let r = 0; r < 11; r++) {
          const p = point({ q: 12, r });
          p.x -= BATTLE_CENTER_X;
          p.z -= BATTLE_CENTER_Z;
          if (battle.siege.wallHp) {
            const section = new THREE.Group();
            section.position.copy(p);
            section.userData.siegeWall = true;
            section.rotation.y = Math.PI / 6;
            box(section, [0.42, 1.5, 1.85], [0, 0.75, 0], '#b3af94');
            for (let i = 0; i < 4; i++)
              box(section, [0.55, 0.3, 0.24], [0, 1.64, -0.72 + i * 0.48], '#c8bea0');
            for (let j = 0; j < 3; j++)
              box(section, [0.44, 0.035, 1.8], [0, 0.25 + j * 0.43, 0], '#7d806d');
            if (r === 0 || r === 10) {
              cylinder(section, 0.45, 0.5, 2.65, [0, 1.32, 0], '#b3af94', 10);
              cylinder(section, 0, 0.66, 0.8, [0, 3, 0], '#675e72', 10);
            }
            field.add(section);
          } else
            for (let i = 0; i < 3; i++)
              box(
                field,
                [0.35, 0.22, 0.35],
                [p.x + Math.sin(i * 7) * 0.45, 0.08, p.z + i * 0.25],
                '#b3af94',
              );
        }
        const citadel = new THREE.Group();
        castle(citadel, 3, true);
        citadel.position.set(14, -0.15, -8);
        citadel.scale.setScalar(2.3);
        field.add(citadel);
        const catapult = new THREE.Group();
        catapult.position.set(-15, 0.1, 7);
        box(catapult, [1.1, 0.17, 0.65], [0, 0.2, 0], '#755135');
        for (const x of [-0.4, 0.4])
          for (const z of [-0.35, 0.35]) {
            const wheel = cylinder(catapult, 0.2, 0.2, 0.1, [x, 0.2, z], '#544533', 12);
            wheel.rotation.x = Math.PI / 2;
          }
        box(catapult, [0.14, 1, 0.14], [0, 0.65, 0], '#8b6240');
        const arm = box(catapult, [1.4, 0.11, 0.15], [0.2, 1, 0], '#976b41');
        arm.rotation.z = -0.55;
        arm.userData.catapultArm = true;
        ball(catapult, [0.15, 0.13, 0.15], [-0.4, 1.4, 0], '#858b7c');
        field.add(catapult);
      }
      this.content.add(field);
    }
    for (const t of tiles) {
      const p = point(t);
      if (battle) {
        p.x -= BATTLE_CENTER_X;
        p.z -= BATTLE_CENTER_Z;
      }
      const known = battle || state.explored.includes(key(t));
      const terrain = 'terrain' in t ? t.terrain : 'grass';
      const colors: Record<string, string> = {
        grass: '#839e78',
        forest: '#65896c',
        water: '#517c8c',
        mountain: '#939b93',
        sand: '#b3aa85',
      };
      const tile = new THREE.Group();
      tile.position.copy(p);
      tile.userData.pick = { hex: { q: t.q, r: t.r } };
      this.content.add(tile);
      this.pickables.push(tile);
      if (battle) {
        const top = new THREE.Mesh(
          new THREE.CircleGeometry(0.975, 6),
          new THREE.MeshBasicMaterial({
            color: '#d8c998',
            transparent: true,
            opacity: 0.045,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        );
        top.rotation.x = -Math.PI / 2;
        top.rotation.z = Math.PI / 6;
        top.position.y = 0.01;
        tile.add(top);
        const points = Array.from(
          { length: 7 },
          (_, i) =>
            new THREE.Vector3(
              Math.cos((i * Math.PI) / 3 + Math.PI / 6) * 0.975,
              0.015,
              Math.sin((i * Math.PI) / 3 + Math.PI / 6) * 0.975,
            ),
        );
        tile.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: '#d8c998', transparent: true, opacity: 0.22 }),
          ),
        );
      } else {
        const base = cylinder(
          tile,
          0.975,
          0.82,
          1.15,
          [0, -0.62, 0],
          known ? '#596f67' : '#303f4c',
          6,
        );
        base.rotation.y = Math.PI / 6;
        const top = cylinder(
          tile,
          0.974,
          0.974,
          0.12,
          [0, 0, 0],
          known ? colors[terrain as string] : '#435560',
          6,
        );
        top.rotation.y = Math.PI / 6;
        if (known && (terrain === 'grass' || terrain === 'forest')) {
          (top.material as THREE.MeshStandardMaterial).map = h3Texture('grass-tile.png');
          (top.material as THREE.MeshStandardMaterial).color.set(
            terrain === 'forest' ? '#b6c7a4' : '#ffffff',
          );
        }
      }
      if (!known) {
        for (let i = 0; i < 2; i++)
          ball(tile, [0.45, 0.16, 0.28], [i * 0.25 - 0.1, 0.22, i * 0.2 - 0.15], '#5c6d77');
        continue;
      }
      if (moveKeys.has(key(t))) {
        const ring = cylinder(tile, 0.8, 0.8, 0.018, [0, 0.075, 0], '#91b3b1', 6);
        ring.rotation.y = Math.PI / 6;
        if (battle) {
          const m = ring.material as THREE.MeshStandardMaterial;
          m.transparent = true;
          m.opacity = 0.13;
          m.depthWrite = false;
        }
      }
      const site = !battle ? SITES.find((s) => key(s) === key(t)) : undefined;
      const seed = Math.abs(Math.sin(t.q * 23 + t.r * 13));
      if (site) {
        const siteGroup = new THREE.Group();
        siteGroup.position.y = 0.08;
        tile.add(siteGroup);
        if (site.kind === 'castle') {
          const image = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: h3Texture('map-castle.png'),
              transparent: true,
              alphaTest: 0.05,
            }),
          );
          image.scale.set(2.7, 2.5, 1);
          image.position.y = 1.18;
          siteGroup.add(image);
        } else if (site.kind !== 'army') landmark(siteGroup, site.kind, state.castle);
        if (site.kind === 'army' && !state.cleared.includes(site.id)) {
          const foe = creatureModel(site.difficulty === 1 ? 'sylve' : 'sol-flame');
          foe.scale.setScalar(0.8);
          foe.userData.baseY = 0;
          this.animated.push(foe);
          siteGroup.add(foe);
          cylinder(siteGroup, 0.02, 0.02, 1.7, [0.72, 0.9, 0], '#b99b58');
          box(siteGroup, [0.47, 0.32, 0.035], [0.95, 1.58, 0], '#a6373c');
          const second = creatureModel('sol');
          second.scale.setScalar(0.43);
          second.position.set(-0.65, 0, 0.1);
          siteGroup.add(second);
        } else if (site.kind === 'army') siteGroup.visible = false;
        if (state.owned.includes(site.id)) {
          cylinder(tile, 0.018, 0.018, 0.7, [0.62, 0.5, -0.3], '#d8bd83');
          box(tile, [0.25, 0.16, 0.025], [0.74, 0.8, -0.3], '#c7dfa8');
        }
        const text = label(
          site.kind === 'castle'
            ? state.owned.includes(site.id)
              ? 'CHÂTEAU ALLIÉ'
              : 'CHÂTEAU ENNEMI'
            : site.kind === 'gold'
              ? '+150 OR'
              : site.kind === 'crystal'
                ? '+3 CRISTAUX'
                : state.cleared.includes(site.id)
                  ? 'LIBÉRÉ'
                  : site.kind === 'fortress'
                    ? 'CRÉPUSCULE'
                    : site.kind === 'shrine'
                      ? 'SOURCE'
                      : site.kind === 'army'
                        ? 'ARMÉE ENNEMIE'
                        : 'GARDIENS',
        );
        text.position.set(0, 1.85, 0);
        tile.add(text);
      } else if (!battle) {
        if (terrain === 'forest') {
          tree(tile, -0.25, 0.1, seed);
          tree(tile, 0.3, -0.27, 1 - seed);
          tree(tile, 0.35, 0.4, seed * 0.4);
        } else if (terrain === 'mountain') {
          cylinder(tile, 0, 0.7, 1.35, [0, 0.66, 0], '#a8ada1', 5);
          cylinder(tile, 0, 0.23, 0.43, [0, 1.13, 0], '#ece9d2', 5);
        } else if (terrain === 'grass' && seed > 0.6) {
          tree(tile, 0.35, -0.2, seed * 0.4);
          for (let i = 0; i < 3; i++)
            ball(
              tile,
              [0.055, 0.045, 0.055],
              [i * 0.17 - 0.35, 0.1, 0.35],
              i % 2 ? '#ded3a2' : '#cea7c2',
            );
        } else if (terrain === 'sand') {
          ball(tile, [0.22, 0.14, 0.18], [0.25, 0.1, -0.3], '#cec29f');
        }
      }
      if (selected && key(selected) === key(t)) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.84, 0.93, 6),
          new THREE.MeshBasicMaterial({ color: '#ffe2a0', side: THREE.DoubleSide }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.rotation.z = Math.PI / 6;
        ring.position.copy(p);
        ring.position.y = 0.1;
        this.selection.add(ring);
      }
    }
    if (battle) {
      for (const u of battle.units.filter((u) => u.hp > 0)) {
        const g = creatureModel(u.creature);
        const p = point(u);
        g.scale.setScalar(0.9);
        g.position.set(p.x - BATTLE_CENTER_X, 0.11, p.z - BATTLE_CENTER_Z);
        g.rotation.y = (u.side === 'ally') !== !!battle.opponent?.town ? 0.45 : -0.6;
        g.userData.pick = { unit: u.id, hex: { q: u.q, r: u.r } };
        g.userData.baseY = 0.11;
        this.content.add(g);
        this.pickables.push(g);
        this.animated.push(g);
        if (u.id === selectedUnit) {
          const marker = label('▼ CIBLE', u.side === 'ally' ? '#bcf2cc' : '#ffb9b9');
          marker.position.set(0, 2.8, 0);
          g.add(marker);
        }
        const count = label(
          `${unitCount(u)} · ${CREATURES[u.creature].name.split(' ')[0]}`,
          u.side === 'ally' ? '#c4efc6' : '#ffb7b3',
        );
        count.position.set(0, 2.35, 0);
        g.add(count);
        const halo = new THREE.Mesh(
          new THREE.RingGeometry(0.5, 0.63, 32),
          new THREE.MeshBasicMaterial({
            color: u.id === active?.id ? '#ffe2a0' : u.side === 'ally' ? '#9acaac' : '#d28a9c',
            side: THREE.DoubleSide,
          }),
        );
        halo.rotation.x = -Math.PI / 2;
        halo.position.set(p.x - BATTLE_CENTER_X, 0.09, p.z - BATTLE_CENTER_Z);
        this.content.add(halo);
      }
    } else {
      const g = creatureModel(state.army[0]?.creature ?? 'sylve'),
        p = point(state.hero);
      g.scale.setScalar(0.64);
      g.position.set(p.x, 0.15, p.z + 0.3);
      g.userData.baseY = 0.15;
      g.userData.pick = { hex: state.hero };
      this.content.add(g);
      this.animated.push(g);
      this.pickables.unshift(g);
      const heroLabel = label('✦ VOTRE HÉROS', '#ffdf95');
      heroLabel.position.set(0, 2.6, 0);
      g.add(heroLabel);
      cylinder(g, 0.02, 0.02, 1.8, [0.8, 0.85, 0], '#cfb582');
      box(g, [0.5, 0.35, 0.04], [1.04, 1.62, 0], '#bca7df');
    }
  }
  async playAction(before: GameState, after: GameState, action: Action): Promise<void> {
    const plan = animationPlan(before, after, action);
    if (!plan) return;
    const actor = this.animated.find((g) => g.userData.pick?.unit === plan.actor);
    if (!actor) return;
    const target = this.animated.find((g) => g.userData.pick?.unit === plan.target);
    const origin = actor.position.clone(),
      destination =
        plan.kind === 'catapult'
          ? point({ q: 12, r: 5 }).add(new THREE.Vector3(-BATTLE_CENTER_X, 1.3, -BATTLE_CENTER_Z))
          : (target?.position.clone() ?? origin.clone());
    const effects = new THREE.Group();
    const walls: THREE.Object3D[] = [];
    let catapultArm: THREE.Object3D | null = null;
    if (plan.kind === 'catapult')
      this.content.traverse((o) => {
        if (o.userData.siegeWall) walls.push(o);
        if (o.userData.catapultArm) catapultArm = o;
      });
    this.scene.add(effects);
    const start = performance.now(),
      duration = this.reduced ? 180 : plan.duration;
    actor.userData.busy = true;
    const labels = plan.changes.map((c) => {
      const g = this.animated.find((m) => m.userData.pick?.unit === c.id)!;
      const text = label(
        `${c.amount > 0 ? '+' : ''}${c.amount} PV`,
        c.amount > 0 ? '#b1ffd4' : '#ffb6ad',
      );
      text.position.copy(g.position).add(new THREE.Vector3(0, 2.6, 0));
      text.scale.set(2.1, 0.62, 1);
      effects.add(text);
      return { text, baseY: text.position.y, change: c, group: g };
    });
    const particles: THREE.Mesh[] = [];
    if (plan.kind !== 'move')
      for (let i = 0; i < 16; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 6, 4),
          new THREE.MeshBasicMaterial({
            color:
              plan.kind === 'heal'
                ? '#99ffd0'
                : plan.kind === 'catapult'
                  ? '#b7b197'
                  : plan.kind === 'bolt'
                    ? '#e2c0ff'
                    : plan.kind === 'defend'
                      ? '#98d1f4'
                      : '#ffe0a1',
            transparent: true,
            opacity: 1,
          }),
        );
        m.position
          .copy(plan.kind === 'defend' ? origin : destination)
          .add(new THREE.Vector3(0, 0.7, 0));
        effects.add(m);
        particles.push(m);
      }
    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.045, 6, 32),
      new THREE.MeshBasicMaterial({
        color: plan.kind === 'heal' ? '#91ffc7' : plan.kind === 'defend' ? '#a0d8ff' : '#ddbcff',
        transparent: true,
        opacity: 0.9,
      }),
    );
    aura.position
      .copy(plan.kind === 'defend' ? origin : destination)
      .add(new THREE.Vector3(0, 0.2, 0));
    aura.rotation.x = -Math.PI / 2;
    aura.visible = ['heal', 'bolt', 'defend'].includes(plan.kind);
    effects.add(aura);
    let beam: THREE.Line | null = null;
    if (plan.kind === 'bolt') {
      const pts = Array.from({ length: 9 }, (_, i) =>
        destination
          .clone()
          .add(new THREE.Vector3(i === 8 ? 0 : Math.sin(i * 13) * 0.25, 4 - i * 0.45, 0)),
      );
      beam = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: '#e8d4ff', transparent: true, opacity: 1 }),
      );
      effects.add(beam);
    }
    let projectile: THREE.Mesh | null = null;
    if ((plan.kind === 'attack' && plan.ranged) || plan.kind === 'catapult') {
      projectile = new THREE.Mesh(
        new THREE.SphereGeometry(plan.kind === 'catapult' ? 0.24 : 0.16, 10, 8),
        new THREE.MeshBasicMaterial({ color: plan.kind === 'catapult' ? '#a9a28a' : '#ffdc77' }),
      );
      effects.add(projectile);
    }
    const flashes: { material: THREE.MeshStandardMaterial; original: THREE.Color }[] = [];
    target?.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial)
        flashes.push({ material: o.material, original: o.material.emissive.clone() });
    });
    await new Promise<void>((resolve) => {
      const tick = (time: number) => {
        const t = animationProgress(start, time, duration),
          impact = Math.max(0, Math.sin(Math.PI * Math.max(0, (t - 0.3) / 0.7)));
        if (plan.kind === 'catapult' && !this.reduced) {
          walls.forEach((o) => {
            o.rotation.z = Math.sin(t * 55) * impact * 0.025;
            if (after.battle?.siege?.wallHp === 0 && t > 0.65)
              o.scale.y = Math.max(0.12, 1 - (t - 0.65) / 0.35);
          });
          if (catapultArm) catapultArm.rotation.z = -0.55 + Math.sin(t * Math.PI) * 1.1;
        }
        if (
          (plan.kind === 'move' || (plan.kind === 'attack' && plan.path.length > 1 && t < 0.65)) &&
          !this.reduced
        ) {
          const path = plan.path.map((h) =>
              point(h).add(new THREE.Vector3(-BATTLE_CENTER_X, origin.y, -BATTLE_CENTER_Z)),
            ),
            position = Math.min(1, plan.kind === 'attack' ? t / 0.65 : t) * (path.length - 1),
            index = Math.min(path.length - 2, Math.floor(position));
          actor.position.copy(path[index]).lerp(path[index + 1], position - index);
          actor.position.y += Math.abs(Math.sin(t * Math.PI * 4)) * 0.16;
        } else if (plan.kind === 'attack' && !plan.ranged && !this.reduced) {
          const approach = plan.path.length
            ? point(plan.path[plan.path.length - 1]).add(
                new THREE.Vector3(-BATTLE_CENTER_X, origin.y, -BATTLE_CENTER_Z),
              )
            : origin;
          actor.position
            .copy(approach)
            .lerp(
              destination,
              Math.sin(Math.PI * (plan.path.length ? (t - 0.65) / 0.35 : t)) * 0.34,
            );
          actor.rotation.z = -Math.sin(Math.PI * t) * 0.2;
        }
        if (projectile) {
          projectile.position
            .copy(plan.kind === 'catapult' ? new THREE.Vector3(-15, 1.4, 7) : origin)
            .lerp(destination, Math.min(1, t / 0.62));
          projectile.position.y +=
            0.8 + Math.sin(Math.min(1, t / 0.62) * Math.PI) * (plan.kind === 'catapult' ? 3 : 0.8);
          projectile.visible = t < 0.65;
        }
        if (beam) beam.visible = t > 0.15 && t < 0.68;
        aura.scale.setScalar(1 + t * 0.6);
        (aura.material as THREE.MeshBasicMaterial).opacity = 1 - t;
        particles.forEach((p, i) => {
          const angle = (i * Math.PI * 2) / particles.length,
            radius = this.reduced ? 0.2 : impact * (0.4 + (i % 4) * 0.15);
          p.position
            .copy(plan.kind === 'defend' ? origin : destination)
            .add(
              new THREE.Vector3(
                Math.cos(angle) * radius,
                0.6 + impact * (i % 3) * 0.25,
                Math.sin(angle) * radius,
              ),
            );
          (p.material as THREE.MeshBasicMaterial).opacity = impact;
        });
        labels.forEach(({ text, baseY, change, group }) => {
          text.visible = t > 0.3;
          text.position.y = baseY + (this.reduced ? 0 : t * 0.8);
          text.material.opacity = Math.min(1, (1 - t) * 4);
          if (change.defeated && t > 0.6) {
            const scale = 0.9 * (1 - (t - 0.6) / 0.4);
            group.scale.setScalar(Math.max(0, scale));
          }
        });
        flashes.forEach(({ material }) =>
          material.emissive.setRGB(impact * 0.7, impact * 0.12, impact * 0.05),
        );
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    flashes.forEach(({ material, original }) => material.emissive.copy(original));
    actor.position.copy(origin);
    actor.rotation.z = 0;
    actor.userData.busy = false;
    this.scene.remove(effects);
    this.clean(effects);
  }
  private animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    if (document.hidden || !this.host.offsetParent) return;
    if (!this.reduced) {
      const t = performance.now() * 0.001;
      this.animated.forEach((g, i) => {
        if (g.userData.busy) return;
        g.position.y = Number(g.userData.baseY) + Math.sin(t * 2 + i) * 0.035;
        g.rotation.z = Math.sin(t * 1.4 + i) * 0.025;
      });
    }
    this.renderer.render(this.scene, this.camera);
  };
  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.clean(this.content);
    this.clean(this.selection);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
