import * as THREE from 'three';
import { creatureModel } from './scene';
import { pomponCitadel } from './kingdom-models';
import { materialTexture, releaseMaterialTexture } from './material-textures';

import { INITIAL_BUILDINGS, type BuildingId } from '../game/buildings';
export { BUILDINGS, type BuildingId } from '../game/buildings';

/** An actual lit 3D town: every building consists of pickable architectural meshes. */
export class TownScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 180);
  private city = new THREE.Group();
  private buildings = new Map<BuildingId, THREE.Group>();
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private textures: THREE.CanvasTexture[] = [];
  private animated: THREE.Object3D[] = [];
  private observer: ResizeObserver;
  private frame = 0;
  private level = 0;
  private built: BuildingId[] = [...INITIAL_BUILDINGS];
  private buildSignature = '';
  private yaw = 0;
  private zoom = 1;
  private selected: BuildingId | null = null;
  private down: { x: number; y: number; moved: boolean } | null = null;
  private ray = new THREE.Raycaster();
  private lastFrame = 0;
  private labelsDirty = true;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(
    private host: HTMLElement,
    private pick: (id: BuildingId) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, host.clientWidth < 600 ? 1.25 : 1.5));
    this.renderer.shadowMap.enabled = true;
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
    sun.castShadow = true;
    const shadowSize = host.clientWidth < 600 ? 512 : 1024;
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
      'Ville 3D : touchez un bâtiment, glissez pour changer la vue. Les mêmes bâtiments sont accessibles par les boutons.',
    );
    canvas.addEventListener('pointerdown', (e) => {
      this.down = { x: e.clientX, y: e.clientY, moved: false };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (this.down && Math.abs(e.clientX - this.down.x) > 5) {
        this.yaw = THREE.MathUtils.clamp(this.yaw + (e.clientX - this.down.x) * 0.003, -0.28, 0.28);
        this.down.x = e.clientX;
        this.down.moved = true;
        this.positionCamera();
      }
      if (!this.down) canvas.style.cursor = this.hit(e.clientX, e.clientY) ? 'pointer' : 'grab';
    });
    canvas.addEventListener('pointerup', (e) => {
      if (this.down && !this.down.moved) {
        const id = this.hit(e.clientX, e.clientY);
        if (id) this.pick(id);
      }
      this.down = null;
    });
    canvas.addEventListener('pointercancel', () => {
      this.down = null;
    });
    this.update(1);
    this.resize();
    this.animate();
  }
  private texture(kind: 'stone' | 'roof' | 'wood' | 'grass') {
    const tex = materialTexture(kind);
    this.textures.push(tex);
    return tex;
  }
  private mat(color: string, texture?: 'stone' | 'roof' | 'wood' | 'grass') {
    const id = `${color}-${texture ?? ''}`;
    if (!this.materials.has(id))
      this.materials.set(
        id,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.88,
          map: texture ? this.texture(texture) : null,
        }),
      );
    return this.materials.get(id)!;
  }
  private mesh(
    g: THREE.Group,
    geo: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    color: string,
    tex?: 'stone' | 'roof' | 'wood' | 'grass',
  ) {
    const m = new THREE.Mesh(geo, this.mat(color, tex));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  }
  private box(
    g: THREE.Group,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: string,
    tex?: 'stone' | 'roof' | 'wood' | 'grass',
  ) {
    return this.mesh(g, new THREE.BoxGeometry(w, h, d), x, y, z, color, tex);
  }
  private cylinder(
    g: THREE.Group,
    rt: number,
    rb: number,
    h: number,
    x: number,
    y: number,
    z: number,
    color: string,
    tex?: 'stone' | 'roof' | 'wood',
    sides = 12,
  ) {
    return this.mesh(g, new THREE.CylinderGeometry(rt, rb, h, sides), x, y, z, color, tex);
  }
  private orb(g: THREE.Group, r: number, x: number, y: number, z: number, color: string) {
    return this.mesh(g, new THREE.SphereGeometry(r, 12, 8), x, y, z, color);
  }
  private window(g: THREE.Group, x: number, y: number, z: number, scale = 1) {
    this.box(g, 0.42 * scale, 0.74 * scale, 0.12, x, y, z, '#493d28');
    this.box(g, 0.29 * scale, 0.57 * scale, 0.14, x, y, z + 0.04, '#f9d98b');
    this.box(g, 0.04, 0.61 * scale, 0.17, x, y, z + 0.07, '#5a4029');
    this.box(g, 0.38 * scale, 0.04, 0.17, x, y, z + 0.07, '#5a4029');
    this.box(g, 0.56 * scale, 0.09, 0.3, x, y - 0.42 * scale, z, '#b7ab88', 'stone');
  }
  private arch(g: THREE.Group, x: number, y: number, z: number, r: number, color: string) {
    const m = this.mesh(
      g,
      new THREE.TorusGeometry(r, r * 0.16, 5, 16, Math.PI),
      x,
      y,
      z,
      color,
      'stone',
    );
    m.rotation.z = 0;
    this.box(g, r * 0.3, r, 0.3, x - r, y - r / 2, z, color, 'stone');
    this.box(g, r * 0.3, r, 0.3, x + r, y - r / 2, z, color, 'stone');
  }
  private flag(g: THREE.Group, x: number, y: number, z: number, color = '#b9c17e') {
    this.cylinder(g, 0.025, 0.025, 1.35, x, y + 0.65, z, '#c0a251');
    const cloth = this.box(g, 0.68, 0.38, 0.025, x + 0.33, y + 1.12, z, color);
    cloth.userData.flag = true;
    this.animated.push(cloth);
    this.box(g, 0.09, 0.24, 0.04, x + 0.33, y + 1.12, z + 0.03, '#e8cc84');
  }
  private tower(g: THREE.Group, x: number, z: number, h: number, r = 0.75) {
    this.cylinder(g, r, r * 1.08, h, x, h / 2, z, '#efe7cf', 'stone');
    for (const y of [0.35, h * 0.57, h - 0.12])
      this.cylinder(g, r * 1.12, r * 1.12, 0.17, x, y, z, '#b7b39a', 'stone');
    this.window(g, x, h * 0.58, z + r, 1.05);
    this.window(g, x, h * 0.83, z + r, 0.75);
    this.cylinder(g, 0, r * 1.45, h * 0.34, x, h * 1.16, z, '#b8c9d0', 'roof');
    this.cylinder(g, 0, 0.09, 0.55, x, h * 1.34 + 0.15, z, '#e5bd60');
  }
  private house(
    g: THREE.Group,
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    roofColor = '#bd8d74',
  ) {
    this.box(g, w, h, d, x, h / 2, z, '#eadcc1', 'stone');
    // Steep tiled gable, with timber beams on the façade.
    const shape = new THREE.Shape();
    shape.moveTo(-w * 0.59, 0);
    shape.lineTo(0, h * 0.64);
    shape.lineTo(w * 0.59, 0);
    shape.closePath();
    this.mesh(
      g,
      new THREE.ExtrudeGeometry(shape, { depth: d + 0.45, bevelEnabled: false }),
      x,
      h,
      z - d / 2 - 0.22,
      roofColor,
      'roof',
    );
    for (const dx of [-w * 0.45, 0, w * 0.45])
      this.box(g, 0.1, h, 0.13, x + dx, h / 2, z + d / 2 + 0.03, '#6c4e31', 'wood');
    this.box(g, w, 0.12, 0.14, x, h * 0.7, z + d / 2 + 0.03, '#6c4e31', 'wood');
    this.box(g, 0.55, 1.02, 0.18, x, 0.51, z + d / 2 + 0.09, '#4f3626', 'wood');
    this.arch(g, x, 1, z + d / 2 + 0.2, 0.34, '#dcc08f');
    for (const dx of [-w * 0.28, w * 0.28]) this.window(g, x + dx, h * 0.57, z + d / 2 + 0.12, 0.7);
    this.box(g, 0.36, 1.1, 0.36, x + w * 0.29, h + 0.75, z, '#c3b18d', 'stone');
  }
  private tree(x: number, z: number, size: number, autumn = false) {
    const g = this.city;
    this.cylinder(g, 0.13 * size, 0.21 * size, 1.8 * size, x, 0.8 * size, z, '#69533e', 'wood', 6);
    const crown = this.mesh(
      g,
      new THREE.IcosahedronGeometry(size, 2),
      x,
      2.1 * size,
      z,
      autumn ? '#90924f' : '#526d3c',
    );
    crown.scale.set(1, 1.3, 0.85);
    const top = this.mesh(
      g,
      new THREE.IcosahedronGeometry(size * 0.78, 2),
      x + size * 0.2,
      3 * size,
      z,
      '#6f864b',
    );
    top.scale.y = 1.25;
    for (let i = 0; i < 3; i++) {
      const a = i * 2.4 + x;
      const leaf = this.mesh(
        g,
        new THREE.IcosahedronGeometry(size * 0.64, 1),
        x + Math.cos(a) * size * 0.55,
        (1.9 + i * 0.24) * size,
        z + Math.sin(a) * size * 0.5,
        i % 2 ? '#748547' : '#425f36',
      );
      leaf.scale.y = 1.13;
    }
  }
  private building(id: BuildingId, x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, 0.06, z);
    g.userData.building = id;
    this.city.add(g);
    this.buildings.set(id, g);
    return g;
  }
  private donut(g: THREE.Group, x: number, y: number, z: number, radius: number, icing: string) {
    const dough = this.mesh(
      g,
      new THREE.TorusGeometry(radius, radius * 0.34, 12, 40),
      x,
      y,
      z,
      '#ba783a',
    );
    dough.rotation.x = -Math.PI / 2;
    const glaze = this.mesh(
      g,
      new THREE.TorusGeometry(radius, radius * 0.35, 12, 40, Math.PI * 1.92),
      x,
      y + radius * 0.12,
      z,
      icing,
    );
    glaze.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 26; i++) {
      const a = i * 2.399,
        r = radius * (1 + Math.sin(i * 3.7) * 0.22);
      const sugar = this.box(
        g,
        0.15,
        0.065,
        0.055,
        x + Math.cos(a) * r,
        y + radius * 0.42,
        z + Math.sin(a) * r,
        ['#f2dca3', '#cc7798', '#70a980', '#e8ad58'][i % 4],
      );
      sugar.rotation.y = a;
    }
  }
  private chocolateBread(g: THREE.Group, x: number, y: number, z: number, scale = 1) {
    const loaf = this.orb(g, 1, x, y, z, '#c8904c');
    loaf.scale.set(1.6 * scale, 0.58 * scale, 0.85 * scale);
    for (let i = 0; i < 6; i++) {
      const fold = this.mesh(
        g,
        new THREE.TorusGeometry(0.72 * scale, 0.055 * scale, 6, 18, Math.PI),
        x - 1.25 * scale + i * 0.5 * scale,
        y,
        z,
        '#e8b879',
      );
      fold.rotation.y = Math.PI / 2;
      fold.scale.y = 0.74;
    }
    for (const xx of [-1, 1])
      for (const zz of [-0.3, 0.3])
        this.cylinder(
          g,
          0.13 * scale,
          0.13 * scale,
          0.2 * scale,
          x + xx * 1.57 * scale,
          y,
          z + zz * scale,
          '#3d231b',
          undefined,
          12,
        ).rotation.z = Math.PI / 2;
  }
  private creatureCabin(g: THREE.Group, family: 'sylve' | 'sol') {
    const body = this.mesh(
      g,
      new THREE.SphereGeometry(1, 32, 20),
      0,
      2,
      0,
      family === 'sylve' ? '#88729e' : '#bc839f',
      'stone',
    );
    body.scale.set(2.1, 2.25, 1.5);
    const cap = this.mesh(
      g,
      new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      0,
      3.6,
      0,
      '#735238',
      'roof',
    );
    cap.scale.set(1.62, 0.9, 1.4);
    for (const x of [-0.63, 0.63]) {
      const eye = this.orb(g, 0.31, x, 3.12, 1.19, '#eedbb8');
      eye.scale.set(1.1, 0.8, 0.22);
      const window = this.orb(g, 0.19, x + 0.05, 3.09, 1.26, '#523b29');
      window.scale.z = 0.24;
      this.box(g, 0.045, 0.28, 0.07, x + 0.05, 3.09, 1.32, '#edbd72');
    }
    const nose = this.orb(g, 0.55, 0, 2.15, 1.53, family === 'sylve' ? '#9983ae' : '#d4a3b0');
    nose.scale.set(0.72, 1.15, 1.25);
    this.box(g, 0.82, 1.18, 0.16, 0, 0.62, 1.52, '#493224', 'wood');
    this.arch(g, 0, 1.18, 1.64, 0.46, '#d3a35e');
    for (const side of [-1, 1]) {
      const hand = this.orb(g, 0.55, side * 2.05, 1.42, 0.2, '#ba986f');
      hand.scale.set(1.2, 0.45, 0.8);
      this.chocolateBread(g, side * 0.96, 0.2, 1.45, 0.42);
      if (family === 'sylve')
        for (let i = 0; i < 5; i++) {
          const leaf = this.orb(
            g,
            0.18,
            side * (0.44 + i * 0.13),
            1.45 - i * 0.12,
            1.55,
            '#507952',
          );
          leaf.scale.set(0.8, 2.4, 0.45);
        }
    }
    if (family === 'sol')
      for (let i = 0; i < 5; i++) {
        const tuft = this.cylinder(
          g,
          0,
          0.16,
          0.8 + (i % 2) * 0.35,
          (i - 2) * 0.22,
          4.65,
          0,
          '#e5be58',
        );
        tuft.rotation.z = (i - 2) * -0.18;
      }
  }
  private constructionPlot(g: THREE.Group) {
    g.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    g.clear();
    this.box(g, 3.6, 0.18, 3.3, 0, 0.09, 0, '#b39769', 'stone');
    for (const x of [-1.65, 1.65])
      for (const z of [-1.5, 1.5]) this.cylinder(g, 0.075, 0.1, 0.85, x, 0.5, z, '#805937', 'wood');
    this.box(g, 2.2, 0.65, 0.12, 0, 1.05, 1.5, '#715235', 'wood');
    this.box(g, 0.12, 0.4, 0.14, 0, 1.05, 1.6, '#eac27d');
    this.box(g, 0.4, 0.12, 0.14, 0, 1.05, 1.6, '#eac27d');
    for (let i = 0; i < 4; i++)
      this.box(g, 0.22, 0.2, 1.3, -0.6 + i * 0.35, 0.26, 0.15, '#b78d50', 'wood');
  }
  private build() {
    this.box(this.city, 75, 0.5, 65, 0, -0.28, -10, '#9cad77', 'grass');
    const ridgeGeo = new THREE.PlaneGeometry(110, 65, 80, 45);
    ridgeGeo.rotateX(-Math.PI / 2);
    const vertices = ridgeGeo.attributes.position,
      ridgeColors: number[] = [];
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i),
        z = vertices.getZ(i) - 47;
      const envelope = Math.max(0, Math.min(1, (-z - 22) / 14));
      const height =
        envelope *
        (5 +
          Math.sin(x * 0.18 + z * 0.14) * 2.2 +
          Math.sin(x * 0.4 - z * 0.19) * 1.6 +
          Math.cos(z * 0.41) * 1.2);
      vertices.setXYZ(i, x, height, z);
      const col = new THREE.Color(height > 6.5 ? '#c5cfc2' : height > 3 ? '#738370' : '#687d54');
      ridgeColors.push(col.r, col.g, col.b);
    }
    ridgeGeo.setAttribute('color', new THREE.Float32BufferAttribute(ridgeColors, 3));
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
    for (let i = 0; i < 14; i++) {
      skyCtx.fillStyle = '#fff6db18';
      skyCtx.beginPath();
      skyCtx.ellipse(
        (i * 89) % 512,
        60 + (i % 4) * 24,
        30 + (i % 5) * 5,
        4 + (i % 3) * 2,
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
      new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide, fog: false }),
    );
    this.city.add(sky);
    for (let i = 0; i < (this.host.clientWidth < 600 ? 18 : 30); i++) {
      const x = Math.sin(i * 17.37) * 18;
      const z = -14 + Math.cos(i * 7.1) * 5;
      if (Math.abs(x) < 7 && z > -12) continue;
      this.tree(x, z, 0.75 + (i % 5) * 0.16, i % 4 === 0);
    }
    for (const x of [-14, 14])
      for (let i = 0; i < 8; i++)
        this.tree(x + Math.sin(i * 5) * 1.5, -3 + i * 1.5, 0.9 + (i % 3) * 0.1);
    // Curved river and little masonry bridge, rather than a flat backdrop.
    const river = new THREE.Shape();
    river.moveTo(9, -24);
    river.bezierCurveTo(5, -6, 14, 0, 11, 15);
    river.lineTo(15, 15);
    river.bezierCurveTo(19, 0, 10, -6, 13, -24);
    river.closePath();
    const water = this.mesh(this.city, new THREE.ShapeGeometry(river, 35), 0, 0.025, 0, '#3f7482');
    water.rotation.x = -Math.PI / 2;
    // Shape's y maps to -z, invert to preserve the river's plan coordinates.
    water.rotation.z = Math.PI;
    water.position.x = 24;
    water.userData.water = true;
    this.animated.push(water);
    for (let i = 0; i < 5; i++) {
      const xx = 9 + i * 0.72;
      this.box(
        this.city,
        0.7,
        0.16,
        2.3,
        xx,
        0.8 + Math.sin((i / 4) * Math.PI) * 0.22,
        7.1,
        '#dbceab',
        'stone',
      );
      for (const zz of [6, 8.2])
        this.box(
          this.city,
          0.7,
          0.48,
          0.15,
          xx,
          1.03 + Math.sin((i / 4) * Math.PI) * 0.22,
          zz,
          '#c3b591',
          'stone',
        );
    }
    const road = this.box(this.city, 3.2, 0.05, 20, 0.2, 0.05, 1.8, '#d6c9a2', 'stone');
    road.rotation.y = -0.06;
    for (const [x, z, w, d, rot] of [
      [-4, 3, 8, 1.7, 0.18],
      [4, 0, 8, 1.7, -0.2],
      [-4, -3, 8, 1.7, -0.35],
      [4, 6, 8, 1.7, 0.28],
    ]) {
      this.box(this.city, w, 0.055, d, x, 0.065, z, '#d6c9a2', 'stone').rotation.y = rot;
    }
    const keep = this.building('keep', 6, -9);
    keep.add(pomponCitadel(this.level));
    for (const x of [-1.3, 1.3]) this.flag(keep, x, 5.4, 0.5, x < 0 ? '#685198' : '#d1a845');
    const hall = this.building('hall', -9, 5);
    this.house(hall, 0, 0, 3.5, this.level >= 2 ? 2.6 : 1.8, 2.5, '#9c6444');
    this.donut(hall, 0, this.level >= 2 ? 4.1 : 3.3, 0, 1.65, '#bf8fa7');
    this.flag(hall, -1.5, 3, 0);
    const sylve = this.building('sylve', -7, -4);
    this.creatureCabin(sylve, 'sylve');
    const sol = this.building('sol', 6, 1);
    this.creatureCabin(sol, 'sol');
    this.chocolateBread(sol, 0, 0.3, 2.1, 0.7);
    const guild = this.building('guild', 10, 5);
    this.cylinder(guild, 1, 1.25, 4.7, 0, 2.35, 0, '#b19e83', 'stone', 24);
    for (let i = 0; i < 4; i++) {
      this.cylinder(
        guild,
        1.25,
        1.25,
        0.58,
        0,
        1.1 + i * 1.05,
        0,
        i % 2 ? '#b398bd' : '#9eb49b',
        undefined,
        32,
      );
      this.cylinder(guild, 1.27, 1.27, 0.16, 0, 1.1 + i * 1.05, 0, '#edc8a2', undefined, 32);
    }
    this.donut(guild, 0, 5, 0, 1.15, '#bfa0c6');
    this.box(guild, 0.8, 1.2, 0.15, 0, 0.6, 1.07, '#4a352d', 'wood');
    const crystal = this.mesh(guild, new THREE.OctahedronGeometry(0.42), 0, 6.6, 0, '#b4adf2');
    crystal.userData.crystal = true;
    this.animated.push(crystal);
    const tavern = this.building('tavern', -6, 10);
    this.house(tavern, 0, 0, 3.6, 1.9, 2.4, '#8e6047');
    this.chocolateBread(tavern, 0, 3, 0, 1.2);
    this.box(tavern, 4.1, 0.18, 1.2, 0, 1.53, 1.6, '#9d7b51', 'wood');
    for (const x of [-1.7, 1.7])
      this.cylinder(tavern, 0.075, 0.09, 1.5, x, 0.75, 2, '#795935', 'wood');
    this.donut(tavern, 1.4, 2.3, 1.7, 0.32, '#bb91a8');
    const forge = this.building('forge', 0, 9);
    this.house(forge, 0, 0, 3.2, 1.65, 2.4, '#7d5844');
    this.chocolateBread(forge, 0, 2.8, 0, 1.05);
    this.cylinder(forge, 0.32, 0.4, 2.7, -1.4, 1.35, -0.3, '#9b7760', 'stone', 12);
    this.donut(forge, -1.4, 2.9, -0.3, 0.45, '#af91bf');
    this.box(forge, 1, 0.6, 0.7, -1.3, 0.3, 1.7, '#514939');
    for (const [id, g] of this.buildings) if (!this.built.includes(id)) this.constructionPlot(g);
    this.animated = this.animated.filter((o) => {
      let p: THREE.Object3D | null = o;
      while (p && p !== this.city) p = p.parent;
      return p === this.city;
    });
    for (let i = 0; i < 26; i++) {
      const x = -15 + (i % 8) * 4.1,
        z = -8 + Math.floor(i / 8) * 5.2;
      if (
        [...this.buildings.values()].some(
          (b) => Math.hypot(b.position.x - x, b.position.z - z) < 3.5,
        ) ||
        Math.abs(x) < 2
      )
        continue;
      this.house(this.city, x, z, 2.1 + (i % 3) * 0.25, 1.35 + (i % 2) * 0.35, 1.8, '#bc8d72');
    }
    for (let x = -14; x < 1; x += 3.5) {
      this.box(this.city, 3.5, 2.2, 0.55, x, 1.1, -10, '#d6d6c8', 'stone');
      for (let i = 0; i < 7; i++)
        this.box(this.city, 0.27, 0.3, 0.65, x - 1.5 + i * 0.5, 2.35, -10, '#d6d6c8', 'stone');
      if (x === -14 || x === -7) this.tower(this.city, x, -10, 4.1, 0.55);
    }
    // Living-vine arches and a golden Pompon statue identify the two creature lineages.
    for (const side of [-1, 1])
      for (let i = 0; i < 8; i++) {
        const leaf = this.orb(sylve, 0.15, side * 1.8, 0.3 + i * 0.28, 1.5, '#419269');
        leaf.scale.set(1, 1.8, 0.5);
      }
    const statue = creatureModel('sol');
    statue.scale.setScalar(1.8);
    statue.position.set(1, 2, -4);
    statue.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        (o.material as THREE.MeshStandardMaterial).color.set('#c4a25b');
        (o.material as THREE.MeshStandardMaterial).metalness = 0.7;
      }
    });
    this.city.add(statue);
    this.cylinder(this.city, 0.9, 1.2, 2, 1, 1, -4, '#c7c3a8', 'stone', 16);
    // Town square, fountain and flower beds.
    this.cylinder(this.city, 1.3, 1.45, 0.35, 0.5, 0.2, 3.9, '#d2c5a4', 'stone', 24);
    const basin = this.cylinder(this.city, 1.13, 1.13, 0.08, 0.5, 0.41, 3.9, '#72aeb7');
    basin.userData.water = true;
    this.animated.push(basin);
    this.cylinder(this.city, 0.14, 0.24, 1.25, 0.5, 0.9, 3.9, '#d2c5a4', 'stone');
    this.cylinder(this.city, 0.66, 0.28, 0.2, 0.5, 1.48, 3.9, '#e0d6b5', 'stone');
    for (let i = 0; i < 9; i++) {
      const drop = this.orb(this.city, 0.045, 0.5, 1.7, 3.9, '#a4e2dc');
      drop.userData.drop = i;
      this.animated.push(drop);
    }
    for (const [x, z] of [
      [-3, 4.7],
      [3, 6.5],
      [-9, -2],
      [8, 5.5],
    ]) {
      this.box(this.city, 1.3, 0.18, 0.75, x, 0.15, z, '#7e704f', 'stone');
      for (let i = 0; i < 5; i++)
        this.orb(this.city, 0.12, x - 0.5 + i * 0.25, 0.38, z, i % 2 ? '#c6a16d' : '#b680a9');
    }
    for (const [id, x, z] of [
      ['sylve', -6, -1.5],
      ['sol', 6, 3],
    ] as const) {
      const g = creatureModel(id);
      g.position.set(x, 0.1, z);
      g.scale.setScalar(0.75);
      g.userData.bob = true;
      this.city.add(g);
      this.animated.push(g);
    }
    // Low town wall and lanterns define the foreground composition.
    for (const x of [-9, 9]) {
      this.box(this.city, 5.3, 0.85, 0.4, x, 0.44, 11.5, '#d0c5a3', 'stone');
      for (let i = 0; i < 9; i++)
        this.box(this.city, 0.3, 0.26, 0.45, x - 2.4 + i * 0.6, 0.98, 11.5, '#d0c5a3', 'stone');
    }
    for (const x of [-1.7, 2.3]) {
      this.cylinder(this.city, 0.04, 0.07, 1.8, x, 0.9, 9, '#514b3a');
      this.box(this.city, 0.28, 0.36, 0.28, x, 1.85, 9, '#f4cb6e');
      this.cylinder(this.city, 0, 0.27, 0.25, x, 2.15, 9, '#68644d', undefined, 4);
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
  }
  select(id: BuildingId | null) {
    this.selected = id;
    this.buildings.forEach((g, key) => {
      g.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          if (!o.userData.baseMaterial) o.userData.baseMaterial = o.material;
          const base = o.userData.baseMaterial as THREE.MeshStandardMaterial;
          if (o.material !== base) (o.material as THREE.Material).dispose();
          if (key === id) {
            const m = base.clone();
            m.emissive.set('#68441c');
            m.emissiveIntensity = 0.18;
            o.material = m;
          } else o.material = base;
        }
      });
    });
  }
  private hit(x: number, y: number): BuildingId | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(
      new THREE.Vector2(
        ((x - rect.left) / rect.width) * 2 - 1,
        (-(y - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    this.camera.updateMatrixWorld(true);
    this.city.updateMatrixWorld(true);
    const hit = this.ray.intersectObjects([...this.buildings.values()], true)[0];
    let o: THREE.Object3D | null = hit?.object ?? null;
    while (o && !o.userData.building) o = o.parent;
    return (o?.userData.building as BuildingId) ?? null;
  }
  private resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
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
    const now = performance.now();
    if (now - this.lastFrame < 30) return;
    this.lastFrame = now;
    const t = this.reduced ? 0 : now / 1000;
    this.animated.forEach((o) => {
      if (o.userData.flag) o.rotation.y = Math.sin(t * 2.6 + o.position.x) * 0.22;
      if (o.userData.crystal) {
        o.rotation.y = t * 0.5;
        o.position.y = 6.6 + Math.sin(t * 1.6) * 0.1;
      }
      if (o.userData.sun) o.rotation.z = t * 0.1;
      if (o.userData.bob) o.position.y = 0.1 + Math.sin(t * 2 + o.position.x) * 0.035;
      if (o.userData.drop !== undefined) {
        const p = (t * 0.8 + o.userData.drop / 9) % 1;
        const a = o.userData.drop * 2.4;
        o.position.set(
          0.5 + Math.cos(a) * p * 0.8,
          1.85 - p * p * 1.38,
          3.9 + Math.sin(a) * p * 0.8,
        );
      }
    });
    if (this.labelsDirty)
      this.host.parentElement?.querySelectorAll<HTMLElement>('.town-marker').forEach((el) => {
        const building = this.buildings.get(el.dataset.building as BuildingId);
        if (!building) return;
        const bounds = new THREE.Box3().setFromObject(building),
          p = bounds.getCenter(new THREE.Vector3());
        p.y = bounds.max.y + 0.4;
        p.project(this.camera);
        el.style.left = `${((p.x + 1) / 2) * 100}%`;
        el.style.top = `${((1 - p.y) / 2) * 100}%`;
      });
    this.labelsDirty = false;
    this.renderer.render(this.scene, this.camera);
  };
  private clearGeometry() {
    const mats = new Set<THREE.Material>();
    this.city.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
      }
    });
    mats.forEach((m) => {
      if (![...this.materials.values()].includes(m as THREE.MeshStandardMaterial)) m.dispose();
    });
    this.city.clear();
    this.buildings.clear();
    this.animated = [];
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.clearGeometry();
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach(releaseMaterialTexture);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
