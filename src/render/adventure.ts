import * as THREE from 'three';
import {
  SITES,
  WALKABLE,
  worldTileAt,
  key,
  pathTo,
  type Hex,
} from '../game/data';
import type { GameState } from '../game/engine';
import { creatureModel, type Pick } from './scene';
import { h3Texture } from './h3-assets';
import assets from '../assets/h3/adventure.json';
import { bindSceneGestures } from './gestures';
import { pomponCitadel } from './kingdom-models';

const CELL = 8;
/** Drapeau hex (sites, héros) — même offset que dans la boucle des sites. */
const FLAG_ON_HEX = { x: 3, y: 2 };
const place = (height: Hex) =>
  new THREE.Vector3(height.q * CELL, -height.r * CELL, 0);
export function normalizePickedHex(raw: unknown): Hex | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as {
    q?: number;
    r?: number;
    hexQ?: number;
    hexR?: number;
  };
  if (typeof record.q === 'number' && typeof record.r === 'number') {
    return { q: record.q, r: record.r };
  }
  if (typeof record.hexQ === 'number' && typeof record.hexR === 'number') {
    return { q: record.hexQ, r: record.hexR };
  }
  return null;
}

export function adventureCellAt(posX: number, posY: number): Hex | null {
  const hexQ = Math.floor(posX / CELL + 0.5),
    hexR = Math.floor(-posY / CELL + 0.5);
  return (function ternaryValue() {
    if (worldTileAt({ q: hexQ, r: hexR })) {
      return { q: hexQ, r: hexR };
    }
    return null;
  })();
}
export class AdventureScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(
    -36,
    36,
    36,
    -36,
    0.1,
    300,
  );
  private readonly content = new THREE.Group();
  private readonly observer: ResizeObserver;
  private frame = 0;
  private zoom = 1;
  private readonly offset = new THREE.Vector2();
  private readonly gestureInput: ReturnType<typeof bindSceneGestures>;
  private lastTap: {
    at: number;
    x: number;
    y: number;
    hex: Hex;
  } | null = null;
  private readonly ray = new THREE.Raycaster();
  private hero: THREE.Group | null = null;
  private pickables: THREE.Object3D[] = [];
  private initialized = false;
  private enemies: THREE.Group[] = [];
  private readonly targetHero = new THREE.Vector3();
  private cameraFollowEnemyId: string | null = null;
  private readonly reduced = matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  constructor(
    private readonly host: HTMLElement,
    private readonly onPick: (point: Pick) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'low-power',
    });
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
      'Carte du royaume : terrains, château, mines, ennemis et héros en 3D.',
    );
    canvas.style.touchAction = 'none';
    this.gestureInput = bindSceneGestures(canvas, {
      pan: (dx, dy) => {
        const scale =
          (this.camera.right - this.camera.left) / host.clientWidth / this.zoom;
        this.offset.x -= dx * scale;
        this.offset.y -= dy * scale;
        this.offset.clampScalar(-25, 25);
        this.positionCamera();
      },
      zoom: (factor) => {
        this.applyZoomFactor(factor);
      },
      tap: (clientX, clientY) => {
        this.handleMapTap(clientX, clientY);
      },
    });
    canvas.addEventListener('dblclick', (event) => {
      event.preventDefault();
      const hex = this.pickHexAtClient(event.clientX, event.clientY);
      if (hex) this.onPick({ hex, doubleClick: true });
      this.lastTap = null;
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.animate();
  }
  /** Position écran (px) pour une bulle au-dessus d’un chef adverse. */
  enemyBubbleAnchor(enemyId: string): { x: number; y: number } | null {
    const anchor = this.enemies.find(
      (group) => String(group.userData.id) === enemyId,
    );
    if (!anchor) return null;
    this.camera.updateMatrixWorld(true);
    this.content.updateMatrixWorld(true);
    const world = new THREE.Vector3();
    anchor.getWorldPosition(world);
    world.y += 5;
    world.z += 1;
    const projected = world.project(this.camera);
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (!width || !height) return null;
    return {
      x: (projected.x * 0.5 + 0.5) * width,
      y: (-projected.y * 0.5 + 0.5) * height,
    };
  }

  private handleMapTap(clientX: number, clientY: number): void {
    const hex = this.pickHexAtClient(clientX, clientY);
    if (!hex) return;
    const now = Date.now();
    const prev = this.lastTap;
    let doubleClick = false;
    if (
      prev &&
      now - prev.at < 450 &&
      Math.abs(clientX - prev.x) < 14 &&
      Math.abs(clientY - prev.y) < 14 &&
      key(prev.hex) === key(hex)
    ) {
      doubleClick = true;
      this.lastTap = null;
    } else {
      this.lastTap = { at: now, x: clientX, y: clientY, hex };
    }
    this.onPick({ hex, doubleClick });
  }
  private pickHexAtClient(clientX: number, clientY: number): Hex | null {
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    this.camera.updateMatrixWorld(true);
    this.ray.setFromCamera(
      new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((clientY - rect.top) / rect.height) * 2,
      ),
      this.camera,
    );
    this.content.updateMatrixWorld(true);
    const hit = this.ray.intersectObjects(this.pickables, true)[0];
    let object: THREE.Object3D | null = hit?.object ?? null;
    while (object && !object.userData.hex) object = object.parent;
    if (object?.userData.hex) {
      return normalizePickedHex(object.userData.hex);
    }
    const pos = this.ray.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      new THREE.Vector3(),
    );
    if (pos) return adventureCellAt(pos.x, pos.y);
    return null;
  }
  private plane(
    width: number,
    height: number,
    posX: number,
    posY: number,
    posZ: number,
    name: string,
    color = '#ffffff',
  ) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        map: h3Texture(name),
        color,
        transparent: true,
        alphaTest: 0.01,
      }),
    );
    mesh.position.set(posX, posY, posZ);
    this.content.add(mesh);
    return mesh;
  }
  // eslint-disable-next-line sonarjs/cognitive-complexity -- adventure map layout
  update(
    state: GameState,
    selected: Hex | null,
    cameraFollowEnemyId?: string | null,
  ) {
    this.cameraFollowEnemyId = cameraFollowEnemyId ?? null;
    const oldEnemies = new Map(
      this.enemies.map((group) => [
        String(group.userData.id),
        group.position.clone(),
      ]),
    );
    const old = this.hero?.position.clone();
    if (!this.initialized) {
      this.offset
        .set(state.hero.q * CELL, -state.hero.r * CELL)
        .clampScalar(-25, 25);
      this.initialized = true;
      this.positionCamera();
    }
    this.clear();
    for (let hexR = -4; hexR <= 4; hexR++) {
      for (let hexQ = -4; hexQ <= 4; hexQ++) {
        const tile = worldTileAt({ q: hexQ, r: hexR }),
          known = !!tile && state.explored.includes(key(tile));
        const kind = (function ternaryValue() {
          if (tile?.terrain === 'water') {
            return 'water';
          }
          return (function ternaryValue() {
            if (tile?.terrain === 'sand') {
              return 'sand';
            }
            return 'grass';
          })();
        })();
        const files = assets[kind].frames;
        for (let index = 0; index < 4; index++) {
          this.plane(
            4,
            4,
            hexQ * CELL + (index % 2) * 4 - 2,
            -hexR * CELL - Math.floor(index / 2) * 4 + 2,
            0,
            (() => {
              const frameIndex =
                (hexQ * hexQ + hexR * hexR + index * 7) % files.length;
              const frameName = files[frameIndex] ?? files[0];
              if (!frameName) {
                return kind;
              }
              return frameName;
            })(),
            (function ternaryValue() {
              if (known) {
                return '#ffffff';
              }
              return '#080b08';
            })(),
          );
        }
        if (!tile || !known) continue;
        const site = SITES.find((site) => key(site) === key(tile));
        if (!site && tile.terrain === 'forest') {
          for (let index = 0; index < 3; index++) {
            this.object(
              (function ternaryValue() {
                if (index % 2) {
                  return 'oak';
                }
                return 'pine';
              })(),
              hexQ * CELL + (index - 1) * 2,
              -hexR * CELL + (index % 2),
              1 + hexR * 0.01,
            );
          }
        }
        if (!site && tile.terrain === 'mountain') {
          this.object('rocks', hexQ * CELL, -hexR * CELL, 1 + hexR * 0.01);
        }
        if (site) {
          if (site.kind === 'castle' || site.kind === 'fortress') {
            const castle = pomponCitadel(
              (function ternaryValue() {
                if (site.id === 'home') {
                  return state.castle;
                }
                return 2;
              })(),
            );
            castle.position.set(hexQ * CELL, -hexR * CELL - 2, 2);
            castle.rotation.x = 0.5;
            castle.scale.setScalar(0.95);
            castle.userData.hex = { q: hexQ, r: hexR };
            this.pickables.push(castle);
            this.content.add(castle);
          } else if (site.kind === 'gold')
            {this.object('mine', hexQ * CELL, -hexR * CELL, 2);}
          else if (site.kind === 'crystal')
            {this.object('crystal-mine', hexQ * CELL, -hexR * CELL, 2);}
          else if (site.kind === 'shrine')
            {this.object('shrine', hexQ * CELL, -hexR * CELL, 2);}
          else if (site.kind === 'camp')
            {this.object('camp', hexQ * CELL, -hexR * CELL, 2);}
          if (site.difficulty && !state.cleared.includes(site.id)) {
            const foe = creatureModel(
              (function ternaryValue() {
                if (site.difficulty === 1) {
                  return 'sylve';
                }
                return 'sol-flame';
              })(),
            );
            foe.scale.setScalar(2);
            foe.position.set(hexQ * CELL + 2, -hexR * CELL - 2, 4);
            foe.userData.hex = { q: hexQ, r: hexR };
            this.pickables.push(foe);
            this.content.add(foe);
          }
          const isFortified =
            site.kind === 'castle' || site.kind === 'fortress';
          if (isFortified && state.enemyOwned?.includes(site.id)) {
            this.flag(
              hexQ * CELL + FLAG_ON_HEX.x,
              -hexR * CELL + FLAG_ON_HEX.y,
              '#c33a3a',
            );
          } else if (isFortified && state.owned.includes(site.id)) {
            this.flag(
              hexQ * CELL + FLAG_ON_HEX.x,
              -hexR * CELL + FLAG_ON_HEX.y,
              '#447bce',
            );
          }
        }
      }
    }
    for (const enemy of state.enemyHeroes ?? []) {
      if (!state.explored.includes(key(enemy))) continue;
      const foot = new THREE.Vector3(1, -1, 7);
      const anchor = this.unitAnchor(
        enemy.army[0]?.creature ?? 'sylve',
        2.5,
        enemy,
        foot,
        oldEnemies.get(enemy.id),
      );
      anchor.userData.id = enemy.id;
      this.attachFlag(
        anchor,
        FLAG_ON_HEX.x - foot.x,
        FLAG_ON_HEX.y - foot.y,
        '#d93933',
      );
      this.pickables.push(anchor);
      this.enemies.push(anchor);
      this.content.add(anchor);
    }
    if (selected && state.explored.includes(key(selected))) {
      const point = place(selected),
        points = [
          [-4, -4],
          [4, -4],
          [4, 4],
          [-4, 4],
          [-4, -4],
        ].map(([offsetX, offsetY]) => {
          const deltaX = offsetX ?? 0;
          const deltaY = offsetY ?? 0;
          return new THREE.Vector3(point.x + deltaX, point.y + deltaY, 5);
        });
      this.content.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({ color: '#e1bc62' }),
        ),
      );
      const path = pathTo(state.hero, selected, WALKABLE);
      path.forEach((height, index) => {
        const point = place(height);
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.3, 8),
          new THREE.MeshBasicMaterial({
            color: (function ternaryValue() {
              if (index < state.movement) {
                return '#cced96';
              }
              return '#ba4235';
            })(),
          }),
        );
        dot.position.set(point.x, point.y, 5);
        this.content.add(dot);
      });
    }
    const heroFoot = new THREE.Vector3(-1, -2, 6);
    this.targetHero.copy(place(state.hero)).add(heroFoot);
    const heroAnchor = this.unitAnchor(
      state.army[0]?.creature ?? 'sylve',
      2.4,
      state.hero,
      heroFoot,
      old,
    );
    this.attachFlag(
      heroAnchor,
      FLAG_ON_HEX.x - heroFoot.x,
      FLAG_ON_HEX.y - heroFoot.y,
      '#447bce',
    );
    this.content.add(heroAnchor);
    this.hero = heroAnchor;
    this.pickables.push(heroAnchor);
  }
  private object(
    kind:
      | 'pine'
      | 'oak'
      | 'rocks'
      | 'mine'
      | 'crystal-mine'
      | 'shrine'
      | 'camp',
    posX: number,
    posY: number,
    posZ: number,
  ) {
    const group = new THREE.Group();
    group.position.set(posX, posY - 2, posZ);
    group.rotation.x = 0.5;
    const mat = new THREE.MeshStandardMaterial({
      color: (function ternaryValue() {
        if (kind === 'pine' || kind === 'oak') {
          return '#4b6934';
        }
        return (function ternaryValue() {
          if (kind === 'rocks') {
            return '#8b8b78';
          }
          return '#b7afa0';
        })();
      })(),
      roughness: 0.93,
    });
    if (kind === 'pine' || kind === 'oak') {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.3, 3, 8),
        new THREE.MeshStandardMaterial({ color: '#5e4831' }),
      );
      trunk.position.y = 1.5;
      group.add(trunk);
      for (let index = 0; index < 3; index++) {
        const leaves = new THREE.Mesh(
          new THREE.ConeGeometry(1.6 - index * 0.25, 2.6, 12),
          mat,
        );
        leaves.position.y = 2.5 + index;
        group.add(leaves);
      }
    } else if (kind === 'rocks') {
      for (let index = 0; index < 4; index++) {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.4 + (index % 2) * 0.5),
          mat,
        );
        rock.position.set((index - 1.5) * 0.9, 0.8 + (index % 2), index % 2);
        group.add(rock);
      }
    } else {
      const house = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 2.8), mat);
      house.position.y = 1.2;
      group.add(house);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(3.2, 1.4, 4),
        new THREE.MeshStandardMaterial({ color: '#765543', roughness: 0.9 }),
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 3;
      group.add(roof);
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.7, 0.06),
        new THREE.MeshStandardMaterial({ color: '#29251e' }),
      );
      door.position.set(0, 0.85, 1.43);
      group.add(door);
      if (kind === 'crystal-mine') {
        for (let index = 0; index < 4; index++) {
          const creature = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.5),
            new THREE.MeshStandardMaterial({
              color: '#b18ace',
              metalness: 0.2,
            }),
          );
          creature.position.set(index - 1.5, 0.7, 2);
          group.add(creature);
        }
      }
    }
    group.userData.hex = {
      q: Math.round(posX / CELL),
      r: Math.round(-posY / CELL),
    };
    this.pickables.push(group);
    this.content.add(group);
  }
  /** Ancre non mise à l’échelle : le modèle est enfant, le drapeau reste aligné hex. */
  private unitAnchor(
    creatureId: string,
    scale: number,
    hex: Hex,
    footOffset: THREE.Vector3,
    start?: THREE.Vector3,
  ): THREE.Group {
    const anchor = new THREE.Group();
    const target = place(hex).add(footOffset);
    anchor.position.copy(start ?? target);
    anchor.userData.target = target;
    anchor.userData.hex = { q: hex.q, r: hex.r };
    const model = creatureModel(creatureId);
    model.scale.setScalar(scale);
    anchor.add(model);
    return anchor;
  }

  private flagMeshes(color: string): THREE.Group {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3, 6),
      new THREE.MeshBasicMaterial({ color: '#cfb976' }),
    );
    group.add(pole);
    const cloth = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.9),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    cloth.position.set(0.8, 1, 0);
    group.add(cloth);
    return group;
  }

  private flag(posX: number, posY: number, color: string) {
    const banner = this.flagMeshes(color);
    banner.position.set(posX, posY, 7);
    this.content.add(banner);
  }

  private attachFlag(
    parent: THREE.Object3D,
    localX: number,
    localY: number,
    color: string,
  ) {
    const banner = this.flagMeshes(color);
    banner.position.set(localX, localY, 0);
    parent.add(banner);
  }
  private clear() {
    this.content.traverse((object3d) => {
      if (object3d instanceof THREE.Mesh || object3d instanceof THREE.Line) {
        object3d.geometry.dispose();
        const mats = (function ternaryValue() {
          if (Array.isArray(object3d.material)) {
            return object3d.material;
          }
          return [object3d.material];
        })();
        mats.forEach((mesh) => mesh.dispose());
      }
    });
    this.content.clear();
    this.hero = null;
    this.pickables = [];
    this.enemies = [];
  }
  private resize() {
    const width = this.host.clientWidth,
      height = this.host.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height);
    const span = 36;
    this.camera.left = (-span * width) / height;
    this.camera.right = (span * width) / height;
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
  applyZoomFactor(factor: number) {
    this.zoom = THREE.MathUtils.clamp(this.zoom * factor, 0.8, 2.5);
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
      let heroLerp = 0.12;
      if (this.reduced) {
        heroLerp = 1;
      }
      this.hero.position.lerp(this.targetHero, heroLerp);
      let heroTilt = Math.sin(performance.now() / 600) * 0.015;
      if (this.reduced) {
        heroTilt = 0;
      }
      const heroModel = this.hero.children[0];
      if (heroModel) heroModel.rotation.z = heroTilt;
    }
    let enemyLerp = 0.12;
    if (this.reduced) {
      enemyLerp = 1;
    }
    let enemyMarching = false;
    this.enemies.forEach((group) => {
      const target = group.userData.target as THREE.Vector3 | undefined;
      if (target && group.position.distanceTo(target) > 0.15) {
        enemyMarching = true;
      }
      group.position.lerp(target ?? group.position, enemyLerp);
    });
    this.host.dataset.enemyMarching = enemyMarching ? '1' : '0';
    if (this.cameraFollowEnemyId) {
      const follow = this.enemies.find(
        (group) => String(group.userData.id) === this.cameraFollowEnemyId,
      );
      if (follow) {
        let panLerp = 0.14;
        if (this.reduced) {
          panLerp = 1;
        }
        this.offset.x += (follow.position.x - this.offset.x) * panLerp;
        this.offset.y += (follow.position.y - this.offset.y) * panLerp;
        this.offset.clampScalar(-25, 25);
        this.positionCamera();
      }
    }
    const focusHex = adventureCellAt(this.offset.x, this.offset.y);
    this.host.dataset.cameraFocusHex = focusHex
      ? `${focusHex.q},${focusHex.r}`
      : '';
    this.renderer.render(this.scene, this.camera);
  };
  dispose() {
    cancelAnimationFrame(this.frame);
    this.gestureInput.dispose();
    this.observer.disconnect();
    this.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
