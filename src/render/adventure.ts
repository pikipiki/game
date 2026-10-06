import * as THREE from 'three';
import { WORLD, SITES, WALKABLE, key, pathTo, type Hex } from '../game/data';
import type { GameState } from '../game/engine';
import { creatureModel, type Pick } from './scene';
import { h3Texture } from './h3-assets';
import assets from '../assets/h3/adventure.json';
import { pomponCitadel } from './kingdom-models';

const CELL = 8;
const place = (height: Hex) =>
  new THREE.Vector3(height.q * CELL, -height.r * CELL, 0);
export function adventureCellAt(posX: number, posY: number): Hex | null {
  const hexQ = Math.floor(posX / CELL + 0.5),
    hexR = Math.floor(-posY / CELL + 0.5);
  return (function ternaryValue() {
    if (WORLD.some((tile) => tile.q === hexQ && tile.r === hexR)) {
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
  private down: { x: number; y: number; moved: boolean } | null = null;
  private readonly ray = new THREE.Raycaster();
  private hero: THREE.Group | null = null;
  private pickables: THREE.Object3D[] = [];
  private initialized = false;
  private enemies: THREE.Group[] = [];
  private readonly targetHero = new THREE.Vector3();
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
    canvas.addEventListener('pointerdown', (event) => {
      this.down = { x: event.clientX, y: event.clientY, moved: false };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!this.down) return;
      const dx = event.clientX - this.down.x,
        dy = event.clientY - this.down.y;
      if (Math.abs(dx) + Math.abs(dy) > 7) {
        this.down.moved = true;
        const scale =
          (this.camera.right - this.camera.left) / host.clientWidth / this.zoom;
        this.offset.x -= dx * scale;
        this.offset.y += dy * scale;
        this.offset.clampScalar(-25, 25);
        this.down.x = event.clientX;
        this.down.y = event.clientY;
        this.positionCamera();
      }
    });
    canvas.addEventListener('pointerup', (event) => {
      if (this.down && !this.down.moved) {
        const rect = canvas.getBoundingClientRect();
        this.camera.updateMatrixWorld(true);
        this.ray.setFromCamera(
          new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            1 - ((event.clientY - rect.top) / rect.height) * 2,
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
        const hex = (function ternaryValue() {
          if (pos) {
            return adventureCellAt(pos.x, pos.y);
          }
          return null;
        })();
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
  update(state: GameState, selected: Hex | null) {
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
        const tile = WORLD.find((tile) => tile.q === hexQ && tile.r === hexR),
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
            castle.userData.hex = { hexQ, hexR };
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
            foe.userData.hex = { hexQ, hexR };
            this.pickables.push(foe);
            this.content.add(foe);
            this.flag(hexQ * CELL + 3, -hexR * CELL + 2, '#c33a3a');
          } else if (state.enemyOwned?.includes(site.id)) {
            this.flag(hexQ * CELL + 3, -hexR * CELL + 2, '#c33a3a');
          } else if (state.owned.includes(site.id))
            {this.flag(hexQ * CELL + 3, -hexR * CELL + 2, '#447bce');}
        }
      }
    }
    for (const enemy of state.enemyHeroes ?? []) {
      if (!state.explored.includes(key(enemy))) continue;
      const group = creatureModel(enemy.army[0]?.creature ?? 'sylve');
      group.scale.setScalar(2.5);
      const target = place(enemy).add(new THREE.Vector3(1, -1, 7));
      group.position.copy(oldEnemies.get(enemy.id) ?? target);
      group.userData.target = target;
      group.userData.id = enemy.id;
      group.userData.hex = { q: enemy.q, r: enemy.r };
      this.pickables.push(group);
      this.enemies.push(group);
      this.content.add(group);
      this.flag(target.x + 1, target.y + 3, '#d93933');
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
    const hero = creatureModel(state.army[0]?.creature ?? 'sylve');
    hero.scale.setScalar(2.4);
    this.targetHero.copy(place(state.hero)).add(new THREE.Vector3(-1, -2, 6));
    hero.position.copy(old ?? this.targetHero);
    this.content.add(hero);
    this.hero = hero;
    hero.userData.hex = { ...state.hero };
    this.pickables.push(hero);
    this.flag(this.targetHero.x - 1, this.targetHero.y + 3, '#447bce');
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
  private flag(posX: number, posY: number, color: string) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3, 6),
      new THREE.MeshBasicMaterial({ color: '#cfb976' }),
    );
    pole.position.set(posX, posY, 7);
    this.content.add(pole);
    const cloth = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.9),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    cloth.position.set(posX + 0.8, posY + 1, 7);
    this.content.add(cloth);
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
      this.hero.rotation.z = heroTilt;
    }
    let enemyLerp = 0.12;
    if (this.reduced) {
      enemyLerp = 1;
    }
    this.enemies.forEach((group) =>
      group.position.lerp(group.userData.target, enemyLerp),
    );
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
