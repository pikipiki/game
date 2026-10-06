import * as THREE from 'three';
import { creatureModel } from '../scene';
import { pomponCitadel } from '../kingdom-models';
import { materialTexture, releaseMaterialTexture } from '../material-textures';

import { INITIAL_BUILDINGS, type BuildingId } from '../../game/buildings';
import { bindSceneGestures } from '../gestures';

type TownTexture = 'stone' | 'roof' | 'wood' | 'grass';
type TownCylinderTexture = 'stone' | 'roof' | 'wood';

function townWebglIsMobile(host: HTMLElement): boolean {
  if (/Android/i.test(navigator.userAgent)) return true;
  return host.clientWidth < 600;
}

/** An actual lit 3D town: every building consists of pickable architectural meshes. */
export class TownScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 180);
  private readonly city = new THREE.Group();
  private readonly buildings = new Map<BuildingId, THREE.Group>();
  private readonly materials = new Map<string, THREE.MeshStandardMaterial>();
  private readonly textures: THREE.CanvasTexture[] = [];
  private animated: THREE.Object3D[] = [];
  private readonly observer: ResizeObserver;
  private frame = 0;
  private level = 0;
  private built: BuildingId[] = [...INITIAL_BUILDINGS];
  private buildSignature = '';
  private yaw = 0;
  private zoom = 1;
  private selected: BuildingId | null = null;
  private readonly gestureInput: ReturnType<typeof bindSceneGestures>;
  private readonly ray = new THREE.Raycaster();
  private lastFrame = 0;
  private labelsDirty = true;
  private readonly reduced = matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  private readonly mobileGpu: boolean;
  constructor(
    private readonly host: HTMLElement,
    private readonly pick: (id: BuildingId) => void,
  ) {
    this.mobileGpu = townWebglIsMobile(host);
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.mobileGpu,
      alpha: false,
      failIfMajorPerformanceCaveat: false,
      powerPreference: this.mobileGpu ? 'default' : 'low-power',
    });
    this.renderer.setPixelRatio(
      Math.min(
        devicePixelRatio,
        (function ternaryValue() {
          if (host.clientWidth < 600) {
            return 1.25;
          }
          return 1.5;
        })(),
      ),
    );
    this.renderer.shadowMap.enabled = !this.mobileGpu;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    host.append(this.renderer.domElement);
    this.scene.background = new THREE.Color('#6f91a1');
    this.scene.fog = new THREE.Fog('#7a979c', 42, 105);
    this.scene.add(new THREE.HemisphereLight('#e4edff', '#4d5438', 1.8));
    const sun = new THREE.DirectionalLight('#ffdab0', 2.0);
    sun.position.set(-17, 27, 12);
    sun.castShadow = !this.mobileGpu;
    const shadowSize = (function ternaryValue() {
      if (host.clientWidth < 600) {
        return 512;
      }
      return 1024;
    })();
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.normalBias = 0.06;
    const fill = new THREE.DirectionalLight('#ffe5bf', 1.1);
    fill.position.set(0, 10, 35);
    this.scene.add(sun, fill, this.city);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    const canvas = this.renderer.domElement;
    canvas.setAttribute(
      'aria-label',
      'Ville 3D : touchez un bâtiment, glissez pour changer la vue. ' +
        'Les bâtiments sont aussi accessibles par les boutons.',
    );
    canvas.style.touchAction = 'none';
    this.gestureInput = bindSceneGestures(canvas, {
      pan: (dx) => {
        this.yaw = THREE.MathUtils.clamp(this.yaw + dx * 0.003, -0.28, 0.28);
        this.positionCamera();
      },
      zoom: (factor) => {
        this.zoom = THREE.MathUtils.clamp(this.zoom * factor, 0.85, 1.45);
        this.positionCamera();
      },
      tap: (clientX, clientY) => {
        const id = this.hit(clientX, clientY);
        if (id) this.pick(id);
      },
      hover: (clientX, clientY) => {
        const hitId = this.hit(clientX, clientY);
        canvas.style.cursor = hitId ? 'pointer' : 'grab';
      },
    });
    this.update(1);
    this.resize();
    this.animate();
  }
  private texture(kind: TownTexture) {
    const tex = materialTexture(kind);
    this.textures.push(tex);
    return tex;
  }
  private mat(color: string, texture?: TownTexture) {
    const id = `${color}-${texture ?? ''}`;
    if (!this.materials.has(id)) {
      let mapTex: THREE.Texture | null = null;
      if (texture) {
        mapTex = this.texture(texture);
      }
      this.materials.set(
        id,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.88,
          map: mapTex,
        }),
      );
    }
    return this.materials.get(id)!;
  }
  private mesh(
    group: THREE.Group,
    geo: THREE.BufferGeometry,
    posX: number,
    posY: number,
    posZ: number,
    color: string,
    tex?: TownTexture,
  ) {
    const mesh = new THREE.Mesh(geo, this.mat(color, tex));
    mesh.position.set(posX, posY, posZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  private box(
    group: THREE.Group,
    width: number,
    height: number,
    depth: number,
    posX: number,
    posY: number,
    posZ: number,
    color: string,
    tex?: TownTexture,
  ) {
    return this.mesh(
      group,
      new THREE.BoxGeometry(width, height, depth),
      posX,
      posY,
      posZ,
      color,
      tex,
    );
  }
  private cylinder(
    group: THREE.Group,
    rt: number,
    rb: number,
    height: number,
    posX: number,
    posY: number,
    posZ: number,
    color: string,
    tex?: TownCylinderTexture,
    sides = 12,
  ) {
    return this.mesh(
      group,
      new THREE.CylinderGeometry(rt, rb, height, sides),
      posX,
      posY,
      posZ,
      color,
      tex,
    );
  }
  private orb(
    group: THREE.Group,
    hexR: number,
    posX: number,
    posY: number,
    posZ: number,
    color: string,
  ) {
    return this.mesh(
      group,
      new THREE.SphereGeometry(hexR, 12, 8),
      posX,
      posY,
      posZ,
      color,
    );
  }
  private window(
    group: THREE.Group,
    posX: number,
    posY: number,
    posZ: number,
    scale = 1,
  ) {
    this.box(
      group,
      0.42 * scale,
      0.74 * scale,
      0.12,
      posX,
      posY,
      posZ,
      '#493d28',
    );
    this.box(
      group,
      0.29 * scale,
      0.57 * scale,
      0.14,
      posX,
      posY,
      posZ + 0.04,
      '#f9d98b',
    );
    this.box(
      group,
      0.04,
      0.61 * scale,
      0.17,
      posX,
      posY,
      posZ + 0.07,
      '#5a4029',
    );
    this.box(
      group,
      0.38 * scale,
      0.04,
      0.17,
      posX,
      posY,
      posZ + 0.07,
      '#5a4029',
    );
    this.box(
      group,
      0.56 * scale,
      0.09,
      0.3,
      posX,
      posY - 0.42 * scale,
      posZ,
      '#b7ab88',
      'stone',
    );
  }
  private arch(
    group: THREE.Group,
    posX: number,
    posY: number,
    posZ: number,
    hexR: number,
    color: string,
  ) {
    const mesh = this.mesh(
      group,
      new THREE.TorusGeometry(hexR, hexR * 0.16, 5, 16, Math.PI),
      posX,
      posY,
      posZ,
      color,
      'stone',
    );
    mesh.rotation.z = 0;
    this.box(
      group,
      hexR * 0.3,
      hexR,
      0.3,
      posX - hexR,
      posY - hexR / 2,
      posZ,
      color,
      'stone',
    );
    this.box(
      group,
      hexR * 0.3,
      hexR,
      0.3,
      posX + hexR,
      posY - hexR / 2,
      posZ,
      color,
      'stone',
    );
  }
  private flag(
    group: THREE.Group,
    posX: number,
    posY: number,
    posZ: number,
    color = '#b9c17e',
  ) {
    this.cylinder(
      group,
      0.025,
      0.025,
      1.35,
      posX,
      posY + 0.65,
      posZ,
      '#c0a251',
    );
    const cloth = this.box(
      group,
      0.68,
      0.38,
      0.025,
      posX + 0.33,
      posY + 1.12,
      posZ,
      color,
    );
    cloth.userData.flag = true;
    this.animated.push(cloth);
    this.box(
      group,
      0.09,
      0.24,
      0.04,
      posX + 0.33,
      posY + 1.12,
      posZ + 0.03,
      '#e8cc84',
    );
  }
  private tower(
    group: THREE.Group,
    posX: number,
    posZ: number,
    height: number,
    hexR = 0.75,
  ) {
    this.cylinder(
      group,
      hexR,
      hexR * 1.08,
      height,
      posX,
      height / 2,
      posZ,
      '#efe7cf',
      'stone',
    );
    for (const posY of [0.35, height * 0.57, height - 0.12]) {
      this.cylinder(
        group,
        hexR * 1.12,
        hexR * 1.12,
        0.17,
        posX,
        posY,
        posZ,
        '#b7b39a',
        'stone',
      );
    }
    this.window(group, posX, height * 0.58, posZ + hexR, 1.05);
    this.window(group, posX, height * 0.83, posZ + hexR, 0.75);
    this.cylinder(
      group,
      0,
      hexR * 1.45,
      height * 0.34,
      posX,
      height * 1.16,
      posZ,
      '#b8c9d0',
      'roof',
    );
    this.cylinder(
      group,
      0,
      0.09,
      0.55,
      posX,
      height * 1.34 + 0.15,
      posZ,
      '#e5bd60',
    );
  }
  private house(
    group: THREE.Group,
    posX: number,
    posZ: number,
    width: number,
    height: number,
    depth: number,
    roofColor = '#bd8d74',
  ) {
    this.box(
      group,
      width,
      height,
      depth,
      posX,
      height / 2,
      posZ,
      '#eadcc1',
      'stone',
    );
    // Steep tiled gable, with timber beams on the façade.
    const shape = new THREE.Shape();
    shape.moveTo(-width * 0.59, 0);
    shape.lineTo(0, height * 0.64);
    shape.lineTo(width * 0.59, 0);
    shape.closePath();
    this.mesh(
      group,
      new THREE.ExtrudeGeometry(shape, {
        depth: depth + 0.45,
        bevelEnabled: false,
      }),
      posX,
      height,
      posZ - depth / 2 - 0.22,
      roofColor,
      'roof',
    );
    for (const dx of [-width * 0.45, 0, width * 0.45]) {
      this.box(
        group,
        0.1,
        height,
        0.13,
        posX + dx,
        height / 2,
        posZ + depth / 2 + 0.03,
        '#6c4e31',
        'wood',
      );
    }
    this.box(
      group,
      width,
      0.12,
      0.14,
      posX,
      height * 0.7,
      posZ + depth / 2 + 0.03,
      '#6c4e31',
      'wood',
    );
    this.box(
      group,
      0.55,
      1.02,
      0.18,
      posX,
      0.51,
      posZ + depth / 2 + 0.09,
      '#4f3626',
      'wood',
    );
    this.arch(group, posX, 1, posZ + depth / 2 + 0.2, 0.34, '#dcc08f');
    for (const dx of [-width * 0.28, width * 0.28])
      {this.window(
        group,
        posX + dx,
        height * 0.57,
        posZ + depth / 2 + 0.12,
        0.7,
      );}
    this.box(
      group,
      0.36,
      1.1,
      0.36,
      posX + width * 0.29,
      height + 0.75,
      posZ,
      '#c3b18d',
      'stone',
    );
  }
  private tree(posX: number, posZ: number, size: number, autumn = false) {
    const group = this.city;
    this.cylinder(
      group,
      0.13 * size,
      0.21 * size,
      1.8 * size,
      posX,
      0.8 * size,
      posZ,
      '#69533e',
      'wood',
      6,
    );
    const crown = this.mesh(
      group,
      new THREE.IcosahedronGeometry(size, 2),
      posX,
      2.1 * size,
      posZ,
      (function ternaryValue() {
        if (autumn) {
          return '#90924f';
        }
        return '#526d3c';
      })(),
    );
    crown.scale.set(1, 1.3, 0.85);
    const top = this.mesh(
      group,
      new THREE.IcosahedronGeometry(size * 0.78, 2),
      posX + size * 0.2,
      3 * size,
      posZ,
      '#6f864b',
    );
    top.scale.y = 1.25;
    for (let index = 0; index < 3; index++) {
      const alpha = index * 2.4 + posX;
      const leaf = this.mesh(
        group,
        new THREE.IcosahedronGeometry(size * 0.64, 1),
        posX + Math.cos(alpha) * size * 0.55,
        (1.9 + index * 0.24) * size,
        posZ + Math.sin(alpha) * size * 0.5,
        (function ternaryValue() {
          if (index % 2) {
            return '#748547';
          }
          return '#425f36';
        })(),
      );
      leaf.scale.y = 1.13;
    }
  }
  private building(id: BuildingId, posX: number, posZ: number) {
    const group = new THREE.Group();
    group.position.set(posX, 0.06, posZ);
    group.userData.building = id;
    this.city.add(group);
    this.buildings.set(id, group);
    return group;
  }
  private donut(
    group: THREE.Group,
    posX: number,
    posY: number,
    posZ: number,
    radius: number,
    icing: string,
  ) {
    const dough = this.mesh(
      group,
      new THREE.TorusGeometry(radius, radius * 0.34, 12, 40),
      posX,
      posY,
      posZ,
      '#ba783a',
    );
    dough.rotation.x = -Math.PI / 2;
    const glaze = this.mesh(
      group,
      new THREE.TorusGeometry(radius, radius * 0.35, 12, 40, Math.PI * 1.92),
      posX,
      posY + radius * 0.12,
      posZ,
      icing,
    );
    glaze.rotation.x = -Math.PI / 2;
    for (let index = 0; index < 26; index++) {
      const alpha = index * 2.399,
        hexR = radius * (1 + Math.sin(index * 3.7) * 0.22);
      const sugar = this.box(
        group,
        0.15,
        0.065,
        0.055,
        posX + Math.cos(alpha) * hexR,
        posY + radius * 0.42,
        posZ + Math.sin(alpha) * hexR,
        (['#f2dca3', '#cc7798', '#70a980', '#e8ad58'] as const)[index % 4] ??
          '#f2dca3',
      );
      sugar.rotation.y = alpha;
    }
  }
  private chocolateBread(
    group: THREE.Group,
    posX: number,
    posY: number,
    posZ: number,
    scale = 1,
  ) {
    const loaf = this.orb(group, 1, posX, posY, posZ, '#c8904c');
    loaf.scale.set(1.6 * scale, 0.58 * scale, 0.85 * scale);
    for (let index = 0; index < 6; index++) {
      const fold = this.mesh(
        group,
        new THREE.TorusGeometry(0.72 * scale, 0.055 * scale, 6, 18, Math.PI),
        posX - 1.25 * scale + index * 0.5 * scale,
        posY,
        posZ,
        '#e8b879',
      );
      fold.rotation.y = Math.PI / 2;
      fold.scale.y = 0.74;
    }
    for (const xx of [-1, 1]) {
      for (const zz of [-0.3, 0.3]) {
        this.cylinder(
          group,
          0.13 * scale,
          0.13 * scale,
          0.2 * scale,
          posX + xx * 1.57 * scale,
          posY,
          posZ + zz * scale,
          '#3d231b',
          undefined,
          12,
        ).rotation.z = Math.PI / 2;
      }
    }
  }
  private creatureCabin(group: THREE.Group, family: 'sylve' | 'sol') {
    const body = this.mesh(
      group,
      new THREE.SphereGeometry(1, 32, 20),
      0,
      2,
      0,
      (function ternaryValue() {
        if (family === 'sylve') {
          return '#88729e';
        }
        return '#bc839f';
      })(),
      'stone',
    );
    body.scale.set(2.1, 2.25, 1.5);
    const cap = this.mesh(
      group,
      new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      0,
      3.6,
      0,
      '#735238',
      'roof',
    );
    cap.scale.set(1.62, 0.9, 1.4);
    for (const posX of [-0.63, 0.63]) {
      const eye = this.orb(group, 0.31, posX, 3.12, 1.19, '#eedbb8');
      eye.scale.set(1.1, 0.8, 0.22);
      const window = this.orb(group, 0.19, posX + 0.05, 3.09, 1.26, '#523b29');
      window.scale.z = 0.24;
      this.box(group, 0.045, 0.28, 0.07, posX + 0.05, 3.09, 1.32, '#edbd72');
    }
    const nose = this.orb(
      group,
      0.55,
      0,
      2.15,
      1.53,
      (function ternaryValue() {
        if (family === 'sylve') {
          return '#9983ae';
        }
        return '#d4a3b0';
      })(),
    );
    nose.scale.set(0.72, 1.15, 1.25);
    this.box(group, 0.82, 1.18, 0.16, 0, 0.62, 1.52, '#493224', 'wood');
    this.arch(group, 0, 1.18, 1.64, 0.46, '#d3a35e');
    for (const side of [-1, 1]) {
      const hand = this.orb(group, 0.55, side * 2.05, 1.42, 0.2, '#ba986f');
      hand.scale.set(1.2, 0.45, 0.8);
      this.chocolateBread(group, side * 0.96, 0.2, 1.45, 0.42);
      if (family === 'sylve') {
        for (let index = 0; index < 5; index++) {
          const leaf = this.orb(
            group,
            0.18,
            side * (0.44 + index * 0.13),
            1.45 - index * 0.12,
            1.55,
            '#507952',
          );
          leaf.scale.set(0.8, 2.4, 0.45);
        }
      }
    }
    if (family === 'sol') {
      for (let index = 0; index < 5; index++) {
        const tuft = this.cylinder(
          group,
          0,
          0.16,
          0.8 + (index % 2) * 0.35,
          (index - 2) * 0.22,
          4.65,
          0,
          '#e5be58',
        );
        tuft.rotation.z = (index - 2) * -0.18;
      }
    }
  }
  private constructionPlot(group: THREE.Group) {
    group.traverse((object3d) => {
      if (object3d instanceof THREE.Mesh) object3d.geometry.dispose();
    });
    group.clear();
    this.box(group, 3.6, 0.18, 3.3, 0, 0.09, 0, '#b39769', 'stone');
    for (const posX of [-1.65, 1.65]) {
      for (const posZ of [-1.5, 1.5])
        {this.cylinder(
          group,
          0.075,
          0.1,
          0.85,
          posX,
          0.5,
          posZ,
          '#805937',
          'wood',
        );}
    }
    this.box(group, 2.2, 0.65, 0.12, 0, 1.05, 1.5, '#715235', 'wood');
    this.box(group, 0.12, 0.4, 0.14, 0, 1.05, 1.6, '#eac27d');
    this.box(group, 0.4, 0.12, 0.14, 0, 1.05, 1.6, '#eac27d');
    for (let index = 0; index < 4; index++) {
      this.box(
        group,
        0.22,
        0.2,
        1.3,
        -0.6 + index * 0.35,
        0.26,
        0.15,
        '#b78d50',
        'wood',
      );
    }
  }
  // eslint-disable-next-line sonarjs/cognitive-complexity -- town mesh assembly
  private build() {
    this.box(this.city, 75, 0.5, 65, 0, -0.28, -10, '#9cad77', 'grass');
    const ridgeGeo = new THREE.PlaneGeometry(110, 65, 80, 45);
    ridgeGeo.rotateX(-Math.PI / 2);
    const vertices = ridgeGeo.attributes.position as THREE.BufferAttribute;
    const ridgeColors: number[] = [];
    for (let index = 0; index < vertices.count; index++) {
      const posX = vertices.getX(index),
        posZ = vertices.getZ(index) - 47;
      const envelope = Math.max(0, Math.min(1, (-posZ - 22) / 14));
      const height =
        envelope *
        (5 +
          Math.sin(posX * 0.18 + posZ * 0.14) * 2.2 +
          Math.sin(posX * 0.4 - posZ * 0.19) * 1.6 +
          Math.cos(posZ * 0.41) * 1.2);
      vertices.setXYZ(index, posX, height, posZ);
      const col = new THREE.Color(
        (function ternaryValue() {
          if (height > 6.5) {
            return '#c5cfc2';
          }
          return (function ternaryValue() {
            if (height > 3) {
              return '#738370';
            }
            return '#687d54';
          })();
        })(),
      );
      ridgeColors.push(col.r, col.g, col.b);
    }
    ridgeGeo.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(ridgeColors, 3),
    );
    ridgeGeo.computeVertexNormals();
    this.city.add(
      new THREE.Mesh(
        ridgeGeo,
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 1,
          side: THREE.DoubleSide,
        }),
      ),
    );
    // Soft painted sky is a texture on a 3D sky dome, not a town backdrop.
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512;
    skyCanvas.height = 256;
    const skyCtx = skyCanvas.getContext('2d')!;
    const gradient = skyCtx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#3f6e88');
    gradient.addColorStop(0.55, '#89acb5');
    gradient.addColorStop(1, '#e4d9b4');
    skyCtx.fillStyle = gradient;
    skyCtx.fillRect(0, 0, 512, 256);
    for (let index = 0; index < 14; index++) {
      skyCtx.fillStyle = '#fff6db18';
      skyCtx.beginPath();
      skyCtx.ellipse(
        (index * 89) % 512,
        60 + (index % 4) * 24,
        30 + (index % 5) * 5,
        4 + (index % 3) * 2,
        0,
        0,
        Math.PI * 2,
      );
      skyCtx.fill();
    }
    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(skyTexture);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(120, 24, 16),
      new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide,
        fog: false,
      }),
    );
    this.city.add(sky);
    let treeCount = 30;
    if (this.host.clientWidth < 600) {
      treeCount = 18;
    }
    for (let index = 0; index < treeCount; index++) {
      const posX = Math.sin(index * 17.37) * 18;
      const posZ = -14 + Math.cos(index * 7.1) * 5;
      if (Math.abs(posX) < 7 && posZ > -12) continue;
      this.tree(posX, posZ, 0.75 + (index % 5) * 0.16, index % 4 === 0);
    }
    for (const posX of [-14, 14]) {
      for (let index = 0; index < 8; index++) {
        this.tree(
          posX + Math.sin(index * 5) * 1.5,
          -3 + index * 1.5,
          0.9 + (index % 3) * 0.1,
        );
      }
    }
    // Curved river and little masonry bridge, rather than a flat backdrop.
    const river = new THREE.Shape();
    river.moveTo(9, -24);
    river.bezierCurveTo(5, -6, 14, 0, 11, 15);
    river.lineTo(15, 15);
    river.bezierCurveTo(19, 0, 10, -6, 13, -24);
    river.closePath();
    const water = this.mesh(
      this.city,
      new THREE.ShapeGeometry(river, 35),
      0,
      0.025,
      0,
      '#3f7482',
    );
    water.rotation.x = -Math.PI / 2;
    // Shape's y maps to -z, invert to preserve the river's plan coordinates.
    water.rotation.z = Math.PI;
    water.position.x = 24;
    water.userData.water = true;
    this.animated.push(water);
    for (let index = 0; index < 5; index++) {
      const xx = 9 + index * 0.72;
      this.box(
        this.city,
        0.7,
        0.16,
        2.3,
        xx,
        0.8 + Math.sin((index / 4) * Math.PI) * 0.22,
        7.1,
        '#dbceab',
        'stone',
      );
      for (const zz of [6, 8.2]) {
        this.box(
          this.city,
          0.7,
          0.48,
          0.15,
          xx,
          1.03 + Math.sin((index / 4) * Math.PI) * 0.22,
          zz,
          '#c3b591',
          'stone',
        );
      }
    }
    const road = this.box(
      this.city,
      3.2,
      0.05,
      20,
      0.2,
      0.05,
      1.8,
      '#d6c9a2',
      'stone',
    );
    road.rotation.y = -0.06;
    for (const segment of [
      [-4, 3, 8, 1.7, 0.18],
      [4, 0, 8, 1.7, -0.2],
      [-4, -3, 8, 1.7, -0.35],
      [4, 6, 8, 1.7, 0.28],
    ] as const) {
      const segX = segment[0];
      const segZ = segment[1];
      const segWidth = segment[2];
      const segDepth = segment[3];
      const segRot = segment[4];
      this.box(
        this.city,
        segWidth,
        0.055,
        segDepth,
        segX,
        0.065,
        segZ,
        '#d6c9a2',
        'stone',
      ).rotation.y = segRot;
    }
    const keep = this.building('keep', 6, -9);
    keep.add(pomponCitadel(this.level));
    for (const posX of [-1.3, 1.3]) {
      this.flag(
        keep,
        posX,
        5.4,
        0.5,
        (function ternaryValue() {
          if (posX < 0) {
            return '#685198';
          }
          return '#d1a845';
        })(),
      );
    }
    const hall = this.building('hall', -9, 5);
    let hallHeight = 1.8;
    let hallDonutY = 3.3;
    if (this.level >= 2) {
      hallHeight = 2.6;
      hallDonutY = 4.1;
    }
    this.house(hall, 0, 0, 3.5, hallHeight, 2.5, '#9c6444');
    this.donut(hall, 0, hallDonutY, 0, 1.65, '#bf8fa7');
    this.flag(hall, -1.5, 3, 0);
    const sylve = this.building('sylve', -7, -4);
    this.creatureCabin(sylve, 'sylve');
    const sol = this.building('sol', 6, 1);
    this.creatureCabin(sol, 'sol');
    this.chocolateBread(sol, 0, 0.3, 2.1, 0.7);
    const guild = this.building('guild', 10, 5);
    this.cylinder(guild, 1, 1.25, 4.7, 0, 2.35, 0, '#b19e83', 'stone', 24);
    for (let index = 0; index < 4; index++) {
      this.cylinder(
        guild,
        1.25,
        1.25,
        0.58,
        0,
        1.1 + index * 1.05,
        0,
        (function ternaryValue() {
          if (index % 2) {
            return '#b398bd';
          }
          return '#9eb49b';
        })(),
        undefined,
        32,
      );
      this.cylinder(
        guild,
        1.27,
        1.27,
        0.16,
        0,
        1.1 + index * 1.05,
        0,
        '#edc8a2',
        undefined,
        32,
      );
    }
    this.donut(guild, 0, 5, 0, 1.15, '#bfa0c6');
    this.box(guild, 0.8, 1.2, 0.15, 0, 0.6, 1.07, '#4a352d', 'wood');
    const crystal = this.mesh(
      guild,
      new THREE.OctahedronGeometry(0.42),
      0,
      6.6,
      0,
      '#b4adf2',
    );
    crystal.userData.crystal = true;
    this.animated.push(crystal);
    const tavern = this.building('tavern', -6, 10);
    this.house(tavern, 0, 0, 3.6, 1.9, 2.4, '#8e6047');
    this.chocolateBread(tavern, 0, 3, 0, 1.2);
    this.box(tavern, 4.1, 0.18, 1.2, 0, 1.53, 1.6, '#9d7b51', 'wood');
    for (const posX of [-1.7, 1.7]) {
      this.cylinder(tavern, 0.075, 0.09, 1.5, posX, 0.75, 2, '#795935', 'wood');
    }
    this.donut(tavern, 1.4, 2.3, 1.7, 0.32, '#bb91a8');
    const forge = this.building('forge', 0, 9);
    this.house(forge, 0, 0, 3.2, 1.65, 2.4, '#7d5844');
    this.chocolateBread(forge, 0, 2.8, 0, 1.05);
    this.cylinder(
      forge,
      0.32,
      0.4,
      2.7,
      -1.4,
      1.35,
      -0.3,
      '#9b7760',
      'stone',
      12,
    );
    this.donut(forge, -1.4, 2.9, -0.3, 0.45, '#af91bf');
    this.box(forge, 1, 0.6, 0.7, -1.3, 0.3, 1.7, '#514939');
    for (const [id, group] of this.buildings)
      {if (!this.built.includes(id)) this.constructionPlot(group);}
    this.animated = this.animated.filter((object3d) => {
      let point: THREE.Object3D | null = object3d;
      while (point && point !== this.city) point = point.parent;
      return point === this.city;
    });
    for (let index = 0; index < 26; index++) {
      const posX = -15 + (index % 8) * 4.1,
        posZ = -8 + Math.floor(index / 8) * 5.2;
      if (
        [...this.buildings.values()].some(
          (beta) =>
            Math.hypot(beta.position.x - posX, beta.position.z - posZ) < 3.5,
        ) ||
        Math.abs(posX) < 2
      ) {
        continue;
      }
      this.house(
        this.city,
        posX,
        posZ,
        2.1 + (index % 3) * 0.25,
        1.35 + (index % 2) * 0.35,
        1.8,
        '#bc8d72',
      );
    }
    for (let posX = -14; posX < 1; posX += 3.5) {
      this.box(this.city, 3.5, 2.2, 0.55, posX, 1.1, -10, '#d6d6c8', 'stone');
      for (let index = 0; index < 7; index++) {
        this.box(
          this.city,
          0.27,
          0.3,
          0.65,
          posX - 1.5 + index * 0.5,
          2.35,
          -10,
          '#d6d6c8',
          'stone',
        );
      }
      if (posX === -14 || posX === -7)
        {this.tower(this.city, posX, -10, 4.1, 0.55);}
    }
    // Living-vine arches and a golden Pompon statue identify the two creature lineages.
    for (const side of [-1, 1]) {
      for (let index = 0; index < 8; index++) {
        const leaf = this.orb(
          sylve,
          0.15,
          side * 1.8,
          0.3 + index * 0.28,
          1.5,
          '#419269',
        );
        leaf.scale.set(1, 1.8, 0.5);
      }
    }
    const statue = creatureModel('sol');
    statue.scale.setScalar(1.8);
    statue.position.set(1, 2, -4);
    statue.traverse((object3d) => {
      if (object3d instanceof THREE.Mesh) {
        (object3d.material as THREE.MeshStandardMaterial).color.set('#c4a25b');
        (object3d.material as THREE.MeshStandardMaterial).metalness = 0.7;
      }
    });
    this.city.add(statue);
    this.cylinder(this.city, 0.9, 1.2, 2, 1, 1, -4, '#c7c3a8', 'stone', 16);
    // Town square, fountain and flower beds.
    this.cylinder(
      this.city,
      1.3,
      1.45,
      0.35,
      0.5,
      0.2,
      3.9,
      '#d2c5a4',
      'stone',
      24,
    );
    const basin = this.cylinder(
      this.city,
      1.13,
      1.13,
      0.08,
      0.5,
      0.41,
      3.9,
      '#72aeb7',
    );
    basin.userData.water = true;
    this.animated.push(basin);
    this.cylinder(
      this.city,
      0.14,
      0.24,
      1.25,
      0.5,
      0.9,
      3.9,
      '#d2c5a4',
      'stone',
    );
    this.cylinder(
      this.city,
      0.66,
      0.28,
      0.2,
      0.5,
      1.48,
      3.9,
      '#e0d6b5',
      'stone',
    );
    for (let index = 0; index < 9; index++) {
      const drop = this.orb(this.city, 0.045, 0.5, 1.7, 3.9, '#a4e2dc');
      drop.userData.drop = index;
      this.animated.push(drop);
    }
    for (const bench of [
      [-3, 4.7],
      [3, 6.5],
      [-9, -2],
      [8, 5.5],
    ] as const) {
      const benchX = bench[0];
      const benchZ = bench[1];
      this.box(
        this.city,
        1.3,
        0.18,
        0.75,
        benchX,
        0.15,
        benchZ,
        '#7e704f',
        'stone',
      );
      for (let index = 0; index < 5; index++) {
        this.orb(
          this.city,
          0.12,
          benchX - 0.5 + index * 0.25,
          0.38,
          benchZ,
          (function ternaryValue() {
            if (index % 2) {
              return '#c6a16d';
            }
            return '#b680a9';
          })(),
        );
      }
    }
    for (const [id, posX, posZ] of [
      ['sylve', -6, -1.5],
      ['sol', 6, 3],
    ] as const) {
      const group = creatureModel(id);
      group.position.set(posX, 0.1, posZ);
      group.scale.setScalar(0.75);
      group.userData.bob = true;
      this.city.add(group);
      this.animated.push(group);
    }
    // Low town wall and lanterns define the foreground composition.
    for (const posX of [-9, 9]) {
      this.box(this.city, 5.3, 0.85, 0.4, posX, 0.44, 11.5, '#d0c5a3', 'stone');
      for (let index = 0; index < 9; index++) {
        this.box(
          this.city,
          0.3,
          0.26,
          0.45,
          posX - 2.4 + index * 0.6,
          0.98,
          11.5,
          '#d0c5a3',
          'stone',
        );
      }
    }
    for (const posX of [-1.7, 2.3]) {
      this.cylinder(this.city, 0.04, 0.07, 1.8, posX, 0.9, 9, '#514b3a');
      this.box(this.city, 0.28, 0.36, 0.28, posX, 1.85, 9, '#f4cb6e');
      this.cylinder(
        this.city,
        0,
        0.27,
        0.25,
        posX,
        2.15,
        9,
        '#68644d',
        undefined,
        4,
      );
    }
  }
  update(level: number, built: BuildingId[] = INITIAL_BUILDINGS) {
    const signature = `${level}:${built.join(',')}`;
    if (this.buildSignature === signature) return;
    this.buildSignature = signature;
    this.built = [...built];
    this.clearGeometry();
    this.level = level;
    this.build();
    this.select(this.selected);
    this.resize();
  }
  select(id: BuildingId | null) {
    this.selected = id;
    this.buildings.forEach((group, key) => {
      group.traverse((object3d) => {
        if (object3d instanceof THREE.Mesh) {
          if (!object3d.userData.baseMaterial)
            {object3d.userData.baseMaterial = object3d.material;}
          const base = object3d.userData
            .baseMaterial as THREE.MeshStandardMaterial;
          if (object3d.material !== base)
            {(object3d.material as THREE.Material).dispose();}
          if (key === id) {
            const mesh = base.clone();
            mesh.emissive.set('#68441c');
            mesh.emissiveIntensity = 0.18;
            object3d.material = mesh;
          } else object3d.material = base;
        }
      });
    });
  }
  private hit(posX: number, posY: number): BuildingId | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(
      new THREE.Vector2(
        ((posX - rect.left) / rect.width) * 2 - 1,
        (-(posY - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    this.camera.updateMatrixWorld(true);
    this.city.updateMatrixWorld(true);
    const hit = this.ray.intersectObjects(
      [...this.buildings.values()],
      true,
    )[0];
    let object3d: THREE.Object3D | null = hit?.object ?? null;
    while (object3d && !object3d.userData.building) object3d = object3d.parent;
    return (object3d?.userData.building as BuildingId) ?? null;
  }
  private resize() {
    const width = this.host.clientWidth,
      height = this.host.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.positionCamera();
  }
  private positionCamera() {
    this.labelsDirty = true;
    const aspect = this.camera.aspect;
    const distance = Math.max(34, 27 / aspect) / this.zoom;
    this.camera.position.set(
      Math.sin(this.yaw) * distance,
      distance * 0.39 + 4,
      Math.cos(this.yaw) * distance,
    );
    this.camera.lookAt(0, 2.8, -0.5);
    this.camera.updateProjectionMatrix();
  }
  setZoom(delta: number) {
    this.zoom = THREE.MathUtils.clamp(this.zoom + delta, 0.85, 1.45);
    this.positionCamera();
  }
  resetCamera() {
    this.zoom = 1;
    this.yaw = 0;
    this.positionCamera();
  }
  private animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    if (document.hidden || !this.host.isConnected) return;
    if (
      this.host.clientWidth > 0 &&
      this.host.clientHeight > 0 &&
      this.renderer.domElement.width === 0
    ) {
      this.resize();
    }
    const now = performance.now();
    if (now - this.lastFrame < 30) return;
    this.lastFrame = now;
    let animTime = now / 1000;
    if (this.reduced) {
      animTime = 0;
    }
    this.animated.forEach((object3d) => {
      if (object3d.userData.flag) {
        object3d.rotation.y =
          Math.sin(animTime * 2.6 + object3d.position.x) * 0.22;
      }
      if (object3d.userData.crystal) {
        object3d.rotation.y = animTime * 0.5;
        object3d.position.y = 6.6 + Math.sin(animTime * 1.6) * 0.1;
      }
      if (object3d.userData.sun) object3d.rotation.z = animTime * 0.1;
      if (object3d.userData.bob)
        {object3d.position.y =
          0.1 + Math.sin(animTime * 2 + object3d.position.x) * 0.035;
      }
      if (object3d.userData.drop !== undefined) {
        const point = (animTime * 0.8 + object3d.userData.drop / 9) % 1;
        const alpha = object3d.userData.drop * 2.4;
        object3d.position.set(
          0.5 + Math.cos(alpha) * point * 0.8,
          1.85 - point * point * 1.38,
          3.9 + Math.sin(alpha) * point * 0.8,
        );
      }
    });
    if (this.labelsDirty) {
      this.host.parentElement
        ?.querySelectorAll<HTMLElement>('.town-marker')
        .forEach((el) => {
          const building = this.buildings.get(
            el.dataset.building as BuildingId,
          );
          if (!building) return;
          const bounds = new THREE.Box3().setFromObject(building),
            point = bounds.getCenter(new THREE.Vector3());
          point.y = bounds.max.y + 0.4;
          point.project(this.camera);
          el.style.left = `${((point.x + 1) / 2) * 100}%`;
          el.style.top = `${((1 - point.y) / 2) * 100}%`;
        });
    }
    this.labelsDirty = false;
    this.renderer.render(this.scene, this.camera);
  };
  private clearGeometry() {
    const mats = new Set<THREE.Material>();
    this.city.traverse((object3d) => {
      if (object3d instanceof THREE.Mesh) {
        object3d.geometry.dispose();
        (function ternaryValue() {
          if (Array.isArray(object3d.material)) {
            return object3d.material;
          }
          return [object3d.material];
        })().forEach((mesh) => mats.add(mesh));
      }
    });
    mats.forEach((mesh) => {
      if (
        ![...this.materials.values()].includes(
          mesh as THREE.MeshStandardMaterial,
        )
      )
        {mesh.dispose();}
    });
    this.city.clear();
    this.buildings.clear();
    this.animated = [];
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.gestureInput.dispose();
    this.observer.disconnect();
    this.clearGeometry();
    this.materials.forEach((mesh) => mesh.dispose());
    this.textures.forEach(releaseMaterialTexture);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
