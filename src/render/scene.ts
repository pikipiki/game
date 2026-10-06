import * as THREE from 'three';
import {
  battlePoint,
  battleHexAt,
  BATTLE_CENTER_X,
  BATTLE_CENTER_Z,
} from './battle-space';
import { h3Texture } from './h3-assets';
import {
  BATTLE_TILES,
  SITES,
  WORLD,
  getCreature,
  key,
  type Hex,
  type Site,
} from '../game/data';
import {
  activeUnit,
  reachable,
  unitCount,
  type Action,
  type GameState,
} from '../game/engine';

import { animationPlan, animationProgress } from '../game/battle/animation';
import { ball, box, cylinder, material } from './scene/mesh-primitives';

import { creatureModel } from './scene/world-meshes';

export { creatureModel };

export interface Pick {
  hex?: Hex;
  unit?: string;
  site?: string;
}
function mapSiteMarkerLabel(site: Site, state: GameState): string {
  if (site.kind === 'castle') {
    if (state.owned.includes(site.id)) return 'CHÂTEAU ALLIÉ';
    return 'CHÂTEAU ENNEMI';
  }
  if (site.kind === 'gold') return '+150 OR';
  if (site.kind === 'crystal') return '+3 CRISTAUX';
  if (state.cleared.includes(site.id)) return 'LIBÉRÉ';
  if (site.kind === 'fortress') return 'CRÉPUSCULE';
  if (site.kind === 'shrine') return 'SOURCE';
  if (site.kind === 'army') return 'ARMÉE ENNEMIE';
  return 'GARDIENS';
}

function armyCampCreatureId(difficulty: number | undefined): string {
  if (difficulty === 1) return 'sylve';
  return 'sol-flame';
}

const hexCenter = (hex: Hex) => {
  const center = battlePoint(hex);
  return new THREE.Vector3(
    center.x + BATTLE_CENTER_X,
    0,
    center.z + BATTLE_CENTER_Z,
  );
};

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
  const state = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, depthTest: false }),
  );
  state.scale.set(1.55, 0.44, 1);
  return state;
}

function tree(group: THREE.Group, posX: number, posZ: number, seed: number) {
  const height = 0.65 + seed * 0.22;
  cylinder(group, 0.05, 0.075, 0.55, [posX, 0.25, posZ], '#86725c', 6);
  cylinder(
    group,
    0,
    0.34,
    height,
    [posX, 0.62, posZ],
    (function ternaryValue() {
      if (seed > 0.5) {
        return '#527e62';
      }
      return '#65927a';
    })(),
    6,
  );
  cylinder(
    group,
    0,
    0.26,
    height * 0.7,
    [posX, 0.92, posZ],
    (function ternaryValue() {
      if (seed > 0.5) {
        return '#66987c';
      }
      return '#7caa88';
    })(),
    6,
  );
}

function castle(group: THREE.Group, level: number, dark = false) {
  const stone = (function ternaryValue() {
      if (dark) {
        return '#6d647e';
      }
      return '#e1d6b8';
    })(),
    roof = (function ternaryValue() {
      if (dark) {
        return '#8c5676';
      }
      return '#5d7773';
    })();
  cylinder(group, 0.68, 0.78, 0.17, [0, 0.11, 0], '#949581', 6);
  box(group, [0.66, 0.67, 0.5], [0, 0.45, 0], stone);
  cylinder(group, 0, 0.49, 0.37, [0, 0.97, 0], roof, 4).rotation.y =
    Math.PI / 4;
  for (const posX of [-0.46, 0.46]) {
    for (const posZ of [-0.28, 0.28]) {
      cylinder(group, 0.17, 0.2, 0.9, [posX, 0.54, posZ], stone, 8);
      cylinder(group, 0, 0.24, 0.35, [posX, 1.15, posZ], roof, 8);
      box(
        group,
        [0.045, 0.19, 0.015],
        [posX, 0.66, posZ + 0.175],
        (function ternaryValue() {
          if (dark) {
            return '#e8a188';
          }
          return '#77808d';
        })(),
      );
    }
  }
  box(group, [0.17, 0.28, 0.02], [0, 0.27, 0.26], '#5d645b');
  cylinder(group, 0.018, 0.018, 0.57, [0, 1.35, 0], '#d8bd83');
  const flag = box(
    group,
    [0.3, 0.18, 0.025],
    [0.15, 1.51, 0],
    (function ternaryValue() {
      if (dark) {
        return '#bb668c';
      }
      return '#dfbf78';
    })(),
  );
  flag.rotation.z = 0.12;
  if (level > 1) cylinder(group, 0.22, 0.27, 0.3, [0, 1.25, 0], stone, 8);
}

function landmark(group: THREE.Group, kind: string, level: number) {
  if (kind === 'castle' || kind === 'fortress') {
    castle(group, level, kind === 'fortress');
    return;
  }
  if (kind === 'gold') {
    ball(group, [0.55, 0.4, 0.4], [0, 0.3, 0], '#898980');
    box(group, [0.32, 0.35, 0.05], [0, 0.21, 0.39], '#413c3e');
    box(group, [0.47, 0.07, 0.15], [0, 0.43, 0.43], '#bf9970');
    for (let index = 0; index < 3; index++) {
      ball(
        group,
        [0.14, 0.12, 0.13],
        [0.22 + index * 0.08, 0.15, 0.55 - index * 0.03],
        '#e4bc62',
      );
    }
  } else if (kind === 'crystal') {
    for (let index = 0; index < 5; index++) {
      const mesh = cylinder(
        group,
        0,
        0.14,
        0.5 + (index % 3) * 0.2,
        [Math.cos(index * 1.6) * 0.28, 0.35, Math.sin(index * 1.6) * 0.28],
        '#b5a4e5',
        5,
      );
      mesh.rotation.z = Math.sin(index) * 0.24;
    }
  } else if (kind === 'shrine') {
    cylinder(group, 0.56, 0.6, 0.14, [0, 0.13, 0], '#d4cfaa', 12);
    cylinder(group, 0.42, 0.42, 0.05, [0, 0.23, 0], '#6ac9c1', 16);
    cylinder(group, 0.08, 0.14, 0.5, [0, 0.43, 0], '#dfd8b4');
    ball(group, [0.2, 0.2, 0.2], [0, 0.84, 0], '#b9f5d5');
    for (const side of [-1, 1])
      {cylinder(group, 0.08, 0.1, 0.8, [side * 0.43, 0.54, 0], '#d4cfaa');}
  } else {
    const tent = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 0.7, 4),
      material('#bb8d85'),
    );
    tent.position.y = 0.42;
    tent.rotation.y = Math.PI / 4;
    group.add(tent);
    cylinder(group, 0.12, 0.12, 0.1, [0.4, 0.1, 0.3], '#8f7160');
    ball(group, [0.08, 0.17, 0.08], [0.4, 0.24, 0.3], '#ffd482');
  }
}

export class GameScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(
    -12,
    12,
    9,
    -9,
    0.1,
    100,
  );
  private readonly content = new THREE.Group();
  private readonly raycaster = new THREE.Raycaster();
  private pickables: THREE.Object3D[] = [];
  private animated: THREE.Group[] = [];
  private readonly selection = new THREE.Group();
  private angle = 0.12;
  private zoom = 1;
  private readonly cameraTarget = new THREE.Vector3();
  private frame = 0;
  private battleMode = false;
  private readonly observer: ResizeObserver;
  private down: {
    x: number;
    y: number;
    angle: number;
    panX: number;
    panZ: number;
  } | null = null;
  private moved = false;
  private readonly reduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  )
    .matches;
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
    const canvas = this.renderer.domElement;
    canvas.setAttribute(
      'aria-label',
      'Champ de bataille 3D : touchez une troupe ou une case. ' +
        'Glissez pour déplacer la vue.',
    );
    canvas.addEventListener('pointerdown', (event) => {
      this.down = {
        x: event.clientX,
        y: event.clientY,
        angle: this.angle,
        panX: this.cameraTarget.x,
        panZ: this.cameraTarget.z,
      };
      this.moved = false;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!this.down) return;
      const delta = event.clientX - this.down.x;
      if (Math.abs(delta) > 8 || Math.abs(event.clientY - this.down.y) > 8)
        {this.moved = true;}
      if (this.moved) {
        if (this.battleMode && !event.shiftKey) {
          const scale =
            (this.camera.right - this.camera.left) /
            this.host.clientWidth /
            this.zoom;
          this.cameraTarget.x = THREE.MathUtils.clamp(
            this.down.panX - delta * scale,
            -BATTLE_CENTER_X,
            BATTLE_CENTER_X,
          );
          this.cameraTarget.z = THREE.MathUtils.clamp(
            this.down.panZ - (event.clientY - this.down.y) * scale * 1.6,
            -BATTLE_CENTER_Z,
            BATTLE_CENTER_Z,
          );
        } else this.angle = this.down.angle + delta * 0.004;
        this.positionCamera();
      }
    });
    canvas.addEventListener('pointerup', (event) => {
      if (this.down && !this.moved) {
        this.camera.updateMatrixWorld(true);
        this.content.updateMatrixWorld(true);
        const rect = canvas.getBoundingClientRect();
        this.raycaster.setFromCamera(
          new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            (-(event.clientY - rect.top) / rect.height) * 2 + 1,
          ),
          this.camera,
        );
        const hits = this.raycaster.intersectObjects(this.pickables, true);
        // Text sprites have rectangular hit areas. They must never hide the cells below.
        const unitHit = hits.find(
          (hitEntry) =>
            hitEntry.object instanceof THREE.Mesh &&
            this.pickOf(hitEntry.object)?.unit,
        );
        if (unitHit) this.onPick(this.pickOf(unitHit.object)!);
        else {
          const ground = this.raycaster.ray.intersectPlane(
            new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.01),
            new THREE.Vector3(),
          );
          const hex = (function ternaryValue() {
            if (ground) {
              return battleHexAt(ground.x, ground.z);
            }
            return null;
          })();
          if (hex) this.onPick({ hex });
        }
      }
      this.down = null;
    });
    canvas.addEventListener('pointercancel', () => {
      this.down = null;
    });
    canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        this.setZoom(
          (function ternaryValue() {
            if (event.deltaY > 0) {
              return -0.08;
            }
            return 0.08;
          })(),
        );
      },
      { passive: false },
    );
    this.resize();
    this.animate();
  }
  private resize() {
    const width = this.host.clientWidth,
      height = this.host.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height);
    const aspect = width / height;
    let minSpan = 6.1;
    let maxNumerator = 10.2;
    if (this.battleMode) {
      minSpan = 10.2;
      maxNumerator = 17;
    }
    const span = Math.max(minSpan, maxNumerator / aspect);
    this.camera.left = -span * aspect;
    this.camera.right = span * aspect;
    this.camera.top = span;
    this.camera.bottom = -span;
    this.positionCamera();
  }
  private positionCamera() {
    let cameraHeight = 20;
    if (this.battleMode) {
      cameraHeight = 23;
    }
    this.camera.position.set(
      this.cameraTarget.x + 35 * Math.sin(this.angle),
      cameraHeight,
      this.cameraTarget.z + 35 * Math.cos(this.angle),
    );
    this.camera.lookAt(this.cameraTarget);
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
  }
  private pickOf(object: THREE.Object3D): Pick | null {
    let object3d: THREE.Object3D | null = object;
    while (object3d && !object3d.userData.pick) object3d = object3d.parent;
    return (object3d?.userData.pick as Pick) ?? null;
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
  private clean(group: THREE.Group) {
    group.traverse((object3d) => {
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
      if (object3d instanceof THREE.Sprite) {
        object3d.material.map?.dispose();
        object3d.material.dispose();
      }
    });
    group.clear();
  }
  // eslint-disable-next-line sonarjs/cognitive-complexity -- map and battle layout
  update(
    state: GameState,
    selected: Hex | null,
    selectedUnit: string | null = null,
  ) {
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
    this.scene.background = (function ternaryValue() {
      if (battle) {
        return h3Texture(
          (function ternaryValue() {
            if (battle.site === 'camp2') {
              return 'battle-mountain.png';
            }
            return 'battle-grass.png';
          })(),
        );
      }
      return new THREE.Color('#8ca7a8');
    })();
    const tiles = (function ternaryValue() {
      if (battle) {
        return BATTLE_TILES;
      }
      return WORLD;
    })();
    const moveKeys = new Set(
      (function ternaryValue() {
        if (battle) {
          return reachable(state).map(key);
        }
        return [];
      })(),
    );
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
      battle.obstacles?.forEach((obstacle) => {
        const obstaclePoint = battlePoint(obstacle);
        ball(
          field,
          [0.68, 0.48, 0.62],
          [obstaclePoint.x, 0.3, obstaclePoint.z],
          '#797962',
        );
      });
      if (battle.siege) {
        for (let wallRow = 0; wallRow < 11; wallRow++) {
          const wallPoint = hexCenter({ q: 12, r: wallRow });
          wallPoint.x -= BATTLE_CENTER_X;
          wallPoint.z -= BATTLE_CENTER_Z;
          if (battle.siege.wallHp) {
            const section = new THREE.Group();
            section.position.copy(wallPoint);
            section.userData.siegeWall = true;
            section.rotation.y = Math.PI / 6;
            box(section, [0.42, 1.5, 1.85], [0, 0.75, 0], '#b3af94');
            for (let index = 0; index < 4; index++) {
              box(
                section,
                [0.55, 0.3, 0.24],
                [0, 1.64, -0.72 + index * 0.48],
                '#c8bea0',
              );
            }
            for (let inner = 0; inner < 3; inner++) {
              box(
                section,
                [0.44, 0.035, 1.8],
                [0, 0.25 + inner * 0.43, 0],
                '#7d806d',
              );
            }
            if (wallRow === 0 || wallRow === 10) {
              cylinder(section, 0.45, 0.5, 2.65, [0, 1.32, 0], '#b3af94', 10);
              cylinder(section, 0, 0.66, 0.8, [0, 3, 0], '#675e72', 10);
            }
            field.add(section);
          } else {
            for (let index = 0; index < 3; index++) {
              box(
                field,
                [0.35, 0.22, 0.35],
                [
                  wallPoint.x + Math.sin(index * 7) * 0.45,
                  0.08,
                  wallPoint.z + index * 0.25,
                ],
                '#b3af94',
              );
            }
          }
        }
        const citadel = new THREE.Group();
        castle(citadel, 3, true);
        citadel.position.set(14, -0.15, -8);
        citadel.scale.setScalar(2.3);
        field.add(citadel);
        const catapult = new THREE.Group();
        catapult.position.set(-15, 0.1, 7);
        box(catapult, [1.1, 0.17, 0.65], [0, 0.2, 0], '#755135');
        for (const posX of [-0.4, 0.4]) {
          for (const posZ of [-0.35, 0.35]) {
            const wheel = cylinder(
              catapult,
              0.2,
              0.2,
              0.1,
              [posX, 0.2, posZ],
              '#544533',
              12,
            );
            wheel.rotation.x = Math.PI / 2;
          }
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
    for (const hexCell of tiles) {
      const center = hexCenter(hexCell);
      if (battle) {
        center.x -= BATTLE_CENTER_X;
        center.z -= BATTLE_CENTER_Z;
      }
      const known = battle || state.explored.includes(key(hexCell));
      const terrain = (function ternaryValue() {
        if ('terrain' in hexCell) {
          return hexCell.terrain;
        }
        return 'grass';
      })();
      const colors: Record<string, string> = {
        grass: '#839e78',
        forest: '#65896c',
        water: '#517c8c',
        mountain: '#939b93',
        sand: '#b3aa85',
      };
      const tile = new THREE.Group();
      tile.position.copy(center);
      tile.userData.pick = { hex: { q: hexCell.q, r: hexCell.r } };
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
          (_unused, index) =>
            new THREE.Vector3(
              Math.cos((index * Math.PI) / 3 + Math.PI / 6) * 0.975,
              0.015,
              Math.sin((index * Math.PI) / 3 + Math.PI / 6) * 0.975,
            ),
        );
        tile.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({
              color: '#d8c998',
              transparent: true,
              opacity: 0.22,
            }),
          ),
        );
      } else {
        const base = cylinder(
          tile,
          0.975,
          0.82,
          1.15,
          [0, -0.62, 0],
          (function ternaryValue() {
            if (known) {
              return '#596f67';
            }
            return '#303f4c';
          })(),
          6,
        );
        base.rotation.y = Math.PI / 6;
        const top = cylinder(
          tile,
          0.974,
          0.974,
          0.12,
          [0, 0, 0],
          (function ternaryValue() {
            if (known) {
              return colors[terrain as string] ?? '#839e78';
            }
            return '#435560';
          })(),
          6,
        );
        top.rotation.y = Math.PI / 6;
        if (known && (terrain === 'grass' || terrain === 'forest')) {
          (top.material as THREE.MeshStandardMaterial).map =
            h3Texture('grass-tile.png');
          (top.material as THREE.MeshStandardMaterial).color.set(
            (function ternaryValue() {
              if (terrain === 'forest') {
                return '#b6c7a4';
              }
              return '#ffffff';
            })(),
          );
        }
      }
      if (!known) {
        for (let index = 0; index < 2; index++) {
          ball(
            tile,
            [0.45, 0.16, 0.28],
            [index * 0.25 - 0.1, 0.22, index * 0.2 - 0.15],
            '#5c6d77',
          );
        }
        continue;
      }
      if (moveKeys.has(key(hexCell))) {
        const ring = cylinder(
          tile,
          0.8,
          0.8,
          0.018,
          [0, 0.075, 0],
          '#91b3b1',
          6,
        );
        ring.rotation.y = Math.PI / 6;
        if (battle) {
          const mesh = ring.material as THREE.MeshStandardMaterial;
          mesh.transparent = true;
          mesh.opacity = 0.13;
          mesh.depthWrite = false;
        }
      }
      const site = (function ternaryValue() {
        if (!battle) {
          return SITES.find((siteEntry) => key(siteEntry) === key(hexCell));
        }
        return undefined;
      })();
      const seed = Math.abs(Math.sin(hexCell.q * 23 + hexCell.r * 13));
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
        } else if (site.kind !== 'army')
          {landmark(siteGroup, site.kind, state.castle);}
        if (site.kind === 'army' && !state.cleared.includes(site.id)) {
          const foe = creatureModel(armyCampCreatureId(site.difficulty));
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
        const text = label(mapSiteMarkerLabel(site, state));
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
          for (let index = 0; index < 3; index++) {
            ball(
              tile,
              [0.055, 0.045, 0.055],
              [index * 0.17 - 0.35, 0.1, 0.35],
              (function ternaryValue() {
                if (index % 2) {
                  return '#ded3a2';
                }
                return '#cea7c2';
              })(),
            );
          }
        } else if (terrain === 'sand') {
          ball(tile, [0.22, 0.14, 0.18], [0.25, 0.1, -0.3], '#cec29f');
        }
      }
      if (selected && key(selected) === key(hexCell)) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.84, 0.93, 6),
          new THREE.MeshBasicMaterial({
            color: '#ffe2a0',
            side: THREE.DoubleSide,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.rotation.z = Math.PI / 6;
        ring.position.copy(center);
        ring.position.y = 0.1;
        this.selection.add(ring);
      }
    }
    if (battle) {
      for (const unit of battle.units.filter((unit) => unit.hp > 0)) {
        const group = creatureModel(unit.creature);
        const unitCenter = hexCenter(unit);
        group.scale.setScalar(0.9);
        group.position.set(
          unitCenter.x - BATTLE_CENTER_X,
          0.11,
          unitCenter.z - BATTLE_CENTER_Z,
        );
        group.rotation.y = (function ternaryValue() {
          if ((unit.side === 'ally') !== !!battle.opponent?.town) {
            return 0.45;
          }
          return -0.6;
        })();
        group.userData.pick = { unit: unit.id, hex: { q: unit.q, r: unit.r } };
        group.userData.baseY = 0.11;
        this.content.add(group);
        this.pickables.push(group);
        this.animated.push(group);
        if (unit.id === selectedUnit) {
          const marker = label(
            '▼ CIBLE',
            (function ternaryValue() {
              if (unit.side === 'ally') {
                return '#bcf2cc';
              }
              return '#ffb9b9';
            })(),
          );
          marker.position.set(0, 2.8, 0);
          group.add(marker);
        }
        const count = label(
          `${unitCount(unit)} · ${getCreature(unit.creature).name.split(' ')[0]}`,
          (function ternaryValue() {
            if (unit.side === 'ally') {
              return '#c4efc6';
            }
            return '#ffb7b3';
          })(),
        );
        count.position.set(0, 2.35, 0);
        group.add(count);
        const halo = new THREE.Mesh(
          new THREE.RingGeometry(0.5, 0.63, 32),
          new THREE.MeshBasicMaterial({
            color: (function ternaryValue() {
              if (unit.id === active?.id) {
                return '#ffe2a0';
              }
              return (function ternaryValue() {
                if (unit.side === 'ally') {
                  return '#9acaac';
                }
                return '#d28a9c';
              })();
            })(),
            side: THREE.DoubleSide,
          }),
        );
        halo.rotation.x = -Math.PI / 2;
        halo.position.set(
          unitCenter.x - BATTLE_CENTER_X,
          0.09,
          unitCenter.z - BATTLE_CENTER_Z,
        );
        this.content.add(halo);
      }
    } else {
      const group = creatureModel(state.army[0]?.creature ?? 'sylve');
      const heroCenter = hexCenter(state.hero);
      group.scale.setScalar(0.64);
      group.position.set(heroCenter.x, 0.15, heroCenter.z + 0.3);
      group.userData.baseY = 0.15;
      group.userData.pick = { hex: state.hero };
      this.content.add(group);
      this.animated.push(group);
      this.pickables.unshift(group);
      const heroLabel = label('✦ VOTRE HÉROS', '#ffdf95');
      heroLabel.position.set(0, 2.6, 0);
      group.add(heroLabel);
      cylinder(group, 0.02, 0.02, 1.8, [0.8, 0.85, 0], '#cfb582');
      box(group, [0.5, 0.35, 0.04], [1.04, 1.62, 0], '#bca7df');
    }
  }
  async playAction(
    before: GameState,
    after: GameState,
    action: Action,
  ): Promise<void> {
    const plan = animationPlan(before, after, action);
    if (!plan) return;
    const actor = this.animated.find(
      (group) => group.userData.pick?.unit === plan.actor,
    );
    if (!actor) return;
    const target = this.animated.find(
      (group) => group.userData.pick?.unit === plan.target,
    );
    const origin = actor.position.clone(),
      destination = (function ternaryValue() {
        if (plan.kind === 'catapult') {
          return hexCenter({ q: 12, r: 5 }).add(
            new THREE.Vector3(-BATTLE_CENTER_X, 1.3, -BATTLE_CENTER_Z),
          );
        }
        return target?.position.clone() ?? origin.clone();
      })();
    const effects = new THREE.Group();
    const walls: THREE.Object3D[] = [];
    let catapultArm: THREE.Object3D | null = null;
    if (plan.kind === 'catapult') {
      this.content.traverse((object3d) => {
        if (object3d.userData.siegeWall) walls.push(object3d);
        if (object3d.userData.catapultArm) catapultArm = object3d;
      });
    }
    this.scene.add(effects);
    const start = performance.now();
    let duration = plan.duration;
    if (this.reduced) {
      duration = 180;
    }
    actor.userData.busy = true;
    const labels = plan.changes.map((battleChange) => {
      const group = this.animated.find(
        (mesh) => mesh.userData.pick?.unit === battleChange.id,
      )!;
      const text = label(
        `${(function ternaryValue() {
          if (battleChange.amount > 0) {
            return '+';
          }
          return '';
        })()}${battleChange.amount} PV`,
        (function ternaryValue() {
          if (battleChange.amount > 0) {
            return '#b1ffd4';
          }
          return '#ffb6ad';
        })(),
      );
      text.position.copy(group.position).add(new THREE.Vector3(0, 2.6, 0));
      text.scale.set(2.1, 0.62, 1);
      effects.add(text);
      return { text, baseY: text.position.y, change: battleChange, group };
    });
    const particles: THREE.Mesh[] = [];
    if (plan.kind !== 'move') {
      for (let index = 0; index < 16; index++) {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 6, 4),
          new THREE.MeshBasicMaterial({
            color: (function ternaryValue() {
              if (plan.kind === 'heal') {
                return '#99ffd0';
              }
              return (function ternaryValue() {
                if (plan.kind === 'catapult') {
                  return '#b7b197';
                }
                return (function ternaryValue() {
                  if (plan.kind === 'bolt') {
                    return '#e2c0ff';
                  }
                  return (function ternaryValue() {
                    if (plan.kind === 'defend') {
                      return '#98d1f4';
                    }
                    return '#ffe0a1';
                  })();
                })();
              })();
            })(),
            transparent: true,
            opacity: 1,
          }),
        );
        mesh.position
          .copy(
            (function ternaryValue() {
              if (plan.kind === 'defend') {
                return origin;
              }
              return destination;
            })(),
          )
          .add(new THREE.Vector3(0, 0.7, 0));
        effects.add(mesh);
        particles.push(mesh);
      }
    }
    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.045, 6, 32),
      new THREE.MeshBasicMaterial({
        color: (function ternaryValue() {
          if (plan.kind === 'heal') {
            return '#91ffc7';
          }
          return (function ternaryValue() {
            if (plan.kind === 'defend') {
              return '#a0d8ff';
            }
            return '#ddbcff';
          })();
        })(),
        transparent: true,
        opacity: 0.9,
      }),
    );
    aura.position
      .copy(
        (function ternaryValue() {
          if (plan.kind === 'defend') {
            return origin;
          }
          return destination;
        })(),
      )
      .add(new THREE.Vector3(0, 0.2, 0));
    aura.rotation.x = -Math.PI / 2;
    aura.visible = ['heal', 'bolt', 'defend'].includes(plan.kind);
    effects.add(aura);
    let beam: THREE.Line | null = null;
    if (plan.kind === 'bolt') {
      const pts = Array.from({ length: 9 }, (_unused, index) =>
        destination.clone().add(
          new THREE.Vector3(
            (function ternaryValue() {
              if (index === 8) {
                return 0;
              }
              return Math.sin(index * 13) * 0.25;
            })(),
            4 - index * 0.45,
            0,
          ),
        ),
      );
      beam = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({
          color: '#e8d4ff',
          transparent: true,
          opacity: 1,
        }),
      );
      effects.add(beam);
    }
    let projectile: THREE.Mesh | null = null;
    if ((plan.kind === 'attack' && plan.ranged) || plan.kind === 'catapult') {
      projectile = new THREE.Mesh(
        new THREE.SphereGeometry(
          (function ternaryValue() {
            if (plan.kind === 'catapult') {
              return 0.24;
            }
            return 0.16;
          })(),
          10,
          8,
        ),
        new THREE.MeshBasicMaterial({
          color: (function ternaryValue() {
            if (plan.kind === 'catapult') {
              return '#a9a28a';
            }
            return '#ffdc77';
          })(),
        }),
      );
      effects.add(projectile);
    }
    const flashes: {
      material: THREE.MeshStandardMaterial;
      original: THREE.Color;
    }[] = [];
    target?.traverse((object3d) => {
      if (
        object3d instanceof THREE.Mesh &&
        object3d.material instanceof THREE.MeshStandardMaterial
      ) {
        flashes.push({
          material: object3d.material,
          original: object3d.material.emissive.clone(),
        });
      }
    });
    const reducedMotion = this.reduced;
    await new Promise<void>((resolve) => {
      // eslint-disable-next-line sonarjs/cognitive-complexity -- battle animation tick
      const tick = (time: number) => {
        const progress = animationProgress(start, time, duration);
        const impact = Math.max(
          0,
          Math.sin(Math.PI * Math.max(0, (progress - 0.3) / 0.7)),
        );
        if (plan.kind === 'catapult' && !this.reduced) {
          walls.forEach((object3d) => {
            object3d.rotation.z = Math.sin(progress * 55) * impact * 0.025;
            if (after.battle?.siege?.wallHp === 0 && progress > 0.65) {
              object3d.scale.y = Math.max(
                0.12,
                1 - (progress - 0.65) / 0.35,
              );
            }
          });
          if (catapultArm) {
            catapultArm.rotation.z = -0.55 + Math.sin(progress * Math.PI) * 1.1;
          }
        }
        if (
          (plan.kind === 'move' ||
            (plan.kind === 'attack' &&
              plan.path.length > 1 &&
              progress < 0.65)) &&
          !this.reduced
        ) {
          const path = plan.path.map((pathHex) =>
              hexCenter(pathHex).add(
                new THREE.Vector3(-BATTLE_CENTER_X, origin.y, -BATTLE_CENTER_Z),
              ),
            ),
            position =
              Math.min(
                1,
                (function ternaryValue() {
                  if (plan.kind === 'attack') {
                    return progress / 0.65;
                  }
                  return progress;
                })(),
              ) *
              (path.length - 1),
            index = Math.min(path.length - 2, Math.floor(position));
          const pathStart = path[index];
          const pathEnd = path[index + 1];
          if (pathStart && pathEnd) {
            actor.position
              .copy(pathStart)
              .lerp(pathEnd, position - index);
          }
          actor.position.y += Math.abs(Math.sin(progress * Math.PI * 4)) * 0.16;
        } else if (plan.kind === 'attack' && !plan.ranged && !this.reduced) {
          const approach = (function ternaryValue() {
            if (plan.path.length) {
              return hexCenter(plan.path.at(-1)!).add(
                new THREE.Vector3(-BATTLE_CENTER_X, origin.y, -BATTLE_CENTER_Z),
              );
            }
            return origin;
          })();
          actor.position.copy(approach).lerp(
            destination,
            Math.sin(
              Math.PI *
                (function ternaryValue() {
                  if (plan.path.length) {
                    return (progress - 0.65) / 0.35;
                  }
                  return progress;
                })(),
            ) * 0.34,
          );
          actor.rotation.z = -Math.sin(Math.PI * progress) * 0.2;
        }
        if (projectile) {
          projectile.position
            .copy(
              (function ternaryValue() {
                if (plan.kind === 'catapult') {
                  return new THREE.Vector3(-15, 1.4, 7);
                }
                return origin;
              })(),
            )
            .lerp(destination, Math.min(1, progress / 0.62));
          projectile.position.y +=
            0.8 +
            Math.sin(Math.min(1, progress / 0.62) * Math.PI) *
              (function ternaryValue() {
                if (plan.kind === 'catapult') {
                  return 3;
                }
                return 0.8;
              })();
          projectile.visible = progress < 0.65;
        }
        if (beam) beam.visible = progress > 0.15 && progress < 0.68;
        aura.scale.setScalar(1 + progress * 0.6);
        (aura.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
        particles.forEach((particle, index) => {
          const angle = (index * Math.PI * 2) / particles.length;
          let radius = impact * (0.4 + (index % 4) * 0.15);
          if (reducedMotion) {
            radius = 0.2;
          }
          particle.position
            .copy(
              (function ternaryValue() {
                if (plan.kind === 'defend') {
                  return origin;
                }
                return destination;
              })(),
            )
            .add(
              new THREE.Vector3(
                Math.cos(angle) * radius,
                0.6 + impact * (index % 3) * 0.25,
                Math.sin(angle) * radius,
              ),
            );
          (particle.material as THREE.MeshBasicMaterial).opacity = impact;
        });
        labels.forEach(({ text, baseY, change, group }) => {
          text.visible = progress > 0.3;
          let labelLift = progress * 0.8;
          if (reducedMotion) {
            labelLift = 0;
          }
          text.position.y = baseY + labelLift;
          text.material.opacity = Math.min(1, (1 - progress) * 4);
          if (change.defeated && progress > 0.6) {
            const scale = 0.9 * (1 - (progress - 0.6) / 0.4);
            group.scale.setScalar(Math.max(0, scale));
          }
        });
        flashes.forEach(({ material }) =>
          material.emissive.setRGB(impact * 0.7, impact * 0.12, impact * 0.05),
        );
        if (progress < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    flashes.forEach(({ material, original }) =>
      material.emissive.copy(original),
    );
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
      const timeSec = performance.now() * 0.001;
      this.animated.forEach((group, index) => {
        if (group.userData.busy) return;
        group.position.y =
          Number(group.userData.baseY) +
          Math.sin(timeSec * 2 + index) * 0.035;
        group.rotation.z = Math.sin(timeSec * 1.4 + index) * 0.025;
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
