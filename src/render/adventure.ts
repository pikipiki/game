import * as THREE from 'three';
import { WORLD, SITES, WALKABLE, key, pathTo, type Hex } from '../game/data';
import type { GameState } from '../game/engine';
import { creatureModel, type Pick } from './scene';
import { h3Texture } from './h3-assets';
import assets from '../assets/h3/adventure.json';
import { pomponCitadel } from './kingdom-models';

const CELL = 8;
const place = (h: Hex) => new THREE.Vector3(h.q * CELL, -h.r * CELL, 0);
export function adventureCellAt(x: number, y: number): Hex | null {
  const q = Math.floor(x / CELL + 0.5),
    r = Math.floor(-y / CELL + 0.5);
  return WORLD.some((t) => t.q === q && t.r === r) ? { q, r } : null;
}
export class AdventureScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-36, 36, 36, -36, 0.1, 300);
  private content = new THREE.Group();
  private observer: ResizeObserver;
  private frame = 0;
  private zoom = 1;
  private offset = new THREE.Vector2();
  private down: { x: number; y: number; moved: boolean } | null = null;
  private ray = new THREE.Raycaster();
  private hero: THREE.Group | null = null;
  private pickables: THREE.Object3D[] = [];
  private initialized = false;
  private enemies: THREE.Group[] = [];
  private targetHero = new THREE.Vector3();
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(
    private host: HTMLElement,
    private onPick: (p: Pick) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.append(this.renderer.domElement);
    this.scene.background = new THREE.Color('#060806');
    this.scene.add(this.content, new THREE.AmbientLight('#fff2cf', 2.6));
    const light = new THREE.DirectionalLight('#ffffff', 2.2);
    light.position.set(-20, 30, 80);
    this.scene.add(light);
    const canvas = this.renderer.domElement;
    canvas.setAttribute(
      'aria-label',
      'Carte du royaume : terrains continus, château, mines, ennemis et héros en 3D.',
    );
    canvas.addEventListener('pointerdown', (e) => {
      this.down = { x: e.clientX, y: e.clientY, moved: false };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.down) return;
      const dx = e.clientX - this.down.x,
        dy = e.clientY - this.down.y;
      if (Math.abs(dx) + Math.abs(dy) > 7) {
        this.down.moved = true;
        const scale = (this.camera.right - this.camera.left) / host.clientWidth / this.zoom;
        this.offset.x -= dx * scale;
        this.offset.y += dy * scale;
        this.offset.clampScalar(-25, 25);
        this.down.x = e.clientX;
        this.down.y = e.clientY;
        this.positionCamera();
      }
    });
    canvas.addEventListener('pointerup', (e) => {
      if (this.down && !this.down.moved) {
        const rect = canvas.getBoundingClientRect();
        this.camera.updateMatrixWorld(true);
        this.ray.setFromCamera(
          new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            1 - ((e.clientY - rect.top) / rect.height) * 2,
          ),
          this.camera,
        );
        this.content.updateMatrixWorld(true);
        const hit = this.ray.intersectObjects(this.pickables, true)[0];
        let object: THREE.Object3D | null = hit?.object ?? null;
        while (object && !object.userData.hex) object = object.parent;
        if (object?.userData.hex) {
          this.onPick({ hex: object.userData.hex });
          this.down = null;
          return;
        }
        const pos = this.ray.ray.intersectPlane(
          new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
          new THREE.Vector3(),
        );
        const hex = pos ? adventureCellAt(pos.x, pos.y) : null;
        if (hex) this.onPick({ hex });
      }
      this.down = null;
    });
    canvas.addEventListener('pointercancel', () => {
      this.down = null;
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.animate();
  }
  private plane(
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    name: string,
    color = '#ffffff',
  ) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        map: h3Texture(name),
        color,
        transparent: true,
        alphaTest: 0.01,
      }),
    );
    mesh.position.set(x, y, z);
    this.content.add(mesh);
    return mesh;
  }
  update(s: GameState, selected: Hex | null) {
    const oldEnemies = new Map(
      this.enemies.map((g) => [String(g.userData.id), g.position.clone()]),
    );
    const old = this.hero?.position.clone();
    if (!this.initialized) {
      this.offset.set(s.hero.q * CELL, -s.hero.r * CELL).clampScalar(-25, 25);
      this.initialized = true;
      this.positionCamera();
    }
    this.clear();
    for (let r = -4; r <= 4; r++)
      for (let q = -4; q <= 4; q++) {
        const t = WORLD.find((t) => t.q === q && t.r === r),
          known = !!t && s.explored.includes(key(t));
        const kind = t?.terrain === 'water' ? 'water' : t?.terrain === 'sand' ? 'sand' : 'grass';
        const files = assets[kind].frames;
        for (let i = 0; i < 4; i++)
          this.plane(
            4,
            4,
            q * CELL + (i % 2) * 4 - 2,
            -r * CELL - Math.floor(i / 2) * 4 + 2,
            0,
            files[(q * q + r * r + i * 7) % files.length],
            known ? '#ffffff' : '#080b08',
          );
        if (!t || !known) continue;
        const site = SITES.find((site) => key(site) === key(t));
        if (!site && t.terrain === 'forest')
          for (let i = 0; i < 3; i++)
            this.object(
              i % 2 ? 'oak' : 'pine',
              q * CELL + (i - 1) * 2,
              -r * CELL + (i % 2),
              1 + r * 0.01,
            );
        if (!site && t.terrain === 'mountain')
          this.object('rocks', q * CELL, -r * CELL, 1 + r * 0.01);
        if (site) {
          if (site.kind === 'castle' || site.kind === 'fortress') {
            const castle = pomponCitadel(site.id === 'home' ? s.castle : 2);
            castle.position.set(q * CELL, -r * CELL - 2, 2);
            castle.rotation.x = 0.5;
            castle.scale.setScalar(0.95);
            castle.userData.hex = { q, r };
            this.pickables.push(castle);
            this.content.add(castle);
          } else if (site.kind === 'gold') this.object('mine', q * CELL, -r * CELL, 2);
          else if (site.kind === 'crystal') this.object('crystal-mine', q * CELL, -r * CELL, 2);
          else if (site.kind === 'shrine') this.object('shrine', q * CELL, -r * CELL, 2);
          else if (site.kind === 'camp') this.object('camp', q * CELL, -r * CELL, 2);
          if (site.difficulty && !s.cleared.includes(site.id)) {
            const foe = creatureModel(site.difficulty === 1 ? 'sylve' : 'sol-flame');
            foe.scale.setScalar(2);
            foe.position.set(q * CELL + 2, -r * CELL - 2, 4);
            foe.userData.hex = { q, r };
            this.pickables.push(foe);
            this.content.add(foe);
            this.flag(q * CELL + 3, -r * CELL + 2, '#c33a3a');
          } else if (s.enemyOwned?.includes(site.id))
            this.flag(q * CELL + 3, -r * CELL + 2, '#c33a3a');
          else if (s.owned.includes(site.id)) this.flag(q * CELL + 3, -r * CELL + 2, '#447bce');
        }
      }
    for (const enemy of s.enemyHeroes ?? []) {
      if (!s.explored.includes(key(enemy))) continue;
      const g = creatureModel(enemy.army[0]?.creature ?? 'sylve');
      g.scale.setScalar(2.5);
      const target = place(enemy).add(new THREE.Vector3(1, -1, 7));
      g.position.copy(oldEnemies.get(enemy.id) ?? target);
      g.userData.target = target;
      g.userData.id = enemy.id;
      g.userData.hex = { q: enemy.q, r: enemy.r };
      this.pickables.push(g);
      this.enemies.push(g);
      this.content.add(g);
      this.flag(target.x + 1, target.y + 3, '#d93933');
    }
    if (selected && s.explored.includes(key(selected))) {
      const p = place(selected),
        points = [
          [-4, -4],
          [4, -4],
          [4, 4],
          [-4, 4],
          [-4, -4],
        ].map(([x, y]) => new THREE.Vector3(p.x + x, p.y + y, 5));
      this.content.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({ color: '#e1bc62' }),
        ),
      );
      const path = pathTo(s.hero, selected, WALKABLE);
      path.forEach((h, i) => {
        const p = place(h);
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.3, 8),
          new THREE.MeshBasicMaterial({ color: i < s.movement ? '#cced96' : '#ba4235' }),
        );
        dot.position.set(p.x, p.y, 5);
        this.content.add(dot);
      });
    }
    const hero = creatureModel(s.army[0]?.creature ?? 'sylve');
    hero.scale.setScalar(2.4);
    this.targetHero.copy(place(s.hero)).add(new THREE.Vector3(-1, -2, 6));
    hero.position.copy(old ?? this.targetHero);
    this.content.add(hero);
    this.hero = hero;
    hero.userData.hex = { ...s.hero };
    this.pickables.push(hero);
    this.flag(this.targetHero.x - 1, this.targetHero.y + 3, '#447bce');
  }
  private object(
    kind: 'pine' | 'oak' | 'rocks' | 'mine' | 'crystal-mine' | 'shrine' | 'camp',
    x: number,
    y: number,
    z: number,
  ) {
    const g = new THREE.Group();
    g.position.set(x, y - 2, z);
    g.rotation.x = 0.5;
    const mat = new THREE.MeshStandardMaterial({
      color:
        kind === 'pine' || kind === 'oak' ? '#4b6934' : kind === 'rocks' ? '#8b8b78' : '#b7afa0',
      roughness: 0.93,
    });
    if (kind === 'pine' || kind === 'oak') {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.3, 3, 8),
        new THREE.MeshStandardMaterial({ color: '#5e4831' }),
      );
      trunk.position.y = 1.5;
      g.add(trunk);
      for (let i = 0; i < 3; i++) {
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.6 - i * 0.25, 2.6, 12), mat);
        leaves.position.y = 2.5 + i;
        g.add(leaves);
      }
    } else if (kind === 'rocks')
      for (let i = 0; i < 4; i++) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4 + (i % 2) * 0.5), mat);
        rock.position.set((i - 1.5) * 0.9, 0.8 + (i % 2), i % 2);
        g.add(rock);
      }
    else {
      const house = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 2.8), mat);
      house.position.y = 1.2;
      g.add(house);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(3.2, 1.4, 4),
        new THREE.MeshStandardMaterial({ color: '#765543', roughness: 0.9 }),
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 3;
      g.add(roof);
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.7, 0.06),
        new THREE.MeshStandardMaterial({ color: '#29251e' }),
      );
      door.position.set(0, 0.85, 1.43);
      g.add(door);
      if (kind === 'crystal-mine')
        for (let i = 0; i < 4; i++) {
          const c = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.5),
            new THREE.MeshStandardMaterial({ color: '#b18ace', metalness: 0.2 }),
          );
          c.position.set(i - 1.5, 0.7, 2);
          g.add(c);
        }
    }
    g.userData.hex = { q: Math.round(x / CELL), r: Math.round(-y / CELL) };
    this.pickables.push(g);
    this.content.add(g);
  }
  private flag(x: number, y: number, color: string) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3, 6),
      new THREE.MeshBasicMaterial({ color: '#cfb976' }),
    );
    pole.position.set(x, y, 7);
    this.content.add(pole);
    const cloth = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.9),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    cloth.position.set(x + 0.8, y + 1, 7);
    this.content.add(cloth);
  }
  private clear() {
    this.content.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m.dispose());
      }
    });
    this.content.clear();
    this.hero = null;
    this.pickables = [];
    this.enemies = [];
  }
  private resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    const span = 36;
    this.camera.left = (-span * w) / h;
    this.camera.right = (span * w) / h;
    this.camera.top = span;
    this.camera.bottom = -span;
    this.positionCamera();
  }
  private positionCamera() {
    this.camera.position.set(this.offset.x, this.offset.y, 150);
    this.camera.lookAt(this.offset.x, this.offset.y, 0);
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
  }
  setZoom(delta: number) {
    this.zoom = THREE.MathUtils.clamp(this.zoom + delta, 0.8, 2.5);
    this.positionCamera();
  }
  resetCamera() {
    this.offset.set(this.targetHero.x, this.targetHero.y).clampScalar(-25, 25);
    this.zoom = 1;
    this.positionCamera();
  }
  private animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    if (document.hidden || !this.host.offsetParent) return;
    if (this.hero) {
      this.hero.position.lerp(this.targetHero, this.reduced ? 1 : 0.12);
      this.hero.rotation.z = this.reduced ? 0 : Math.sin(performance.now() / 600) * 0.015;
    }
    this.enemies.forEach((g) => g.position.lerp(g.userData.target, this.reduced ? 1 : 0.12));
    this.renderer.render(this.scene, this.camera);
  };
  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
