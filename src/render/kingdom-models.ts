import * as THREE from 'three';
import { materialTexture } from './material-textures';
let wallMap: THREE.CanvasTexture | null = null;
/** Actual 3D gatehouse and crenellated towers; shared by town and adventure map. */
export function pomponCitadel(level = 1) {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({
    color: '#ba9770',
    map: (wallMap ??= materialTexture('stone')),
    roughness: 0.94,
  });
  const trim = new THREE.MeshStandardMaterial({ color: '#d0b383', roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: '#211d29' });
  const violet = new THREE.MeshStandardMaterial({ color: '#54458c', side: THREE.DoubleSide });
  const gold = new THREE.MeshStandardMaterial({
    color: '#dbb855',
    metalness: 0.65,
    roughness: 0.42,
  });
  const add = (
    geo: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material = stone,
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material = stone,
  ) => add(new THREE.BoxGeometry(w, h, d), x, y, z, mat);
  function tower(x: number, z: number, h: number) {
    box(1.7, h, 1.8, x, h / 2, z);
    for (const y of [0.3, h * 0.5, h - 0.6]) box(1.9, 0.17, 2, x, y, z, trim);
    box(2.05, 0.25, 2.15, x, h, z, trim);
    for (let i = 0; i < 4; i++)
      for (const side of [-1, 1]) {
        box(0.24, 0.42, 0.3, x - 0.78 + i * 0.52, h + 0.25, z + side * 0.94, trim);
        box(0.3, 0.42, 0.24, x + side * 0.87, h + 0.25, z - 0.85 + i * 0.55, trim);
      }
    for (let y = 1; y < h - 0.6; y += 1.1) box(0.14, 0.58, 0.025, x, y, z + 0.913, dark);
    for (const side of [-1, 1]) box(0.28, h, 0.24, x + side * 0.69, h / 2, z + 0.86, trim);
    box(0.45, 1.3, 0.04, x, h - 1.3, z + 0.96, violet);
    box(0.09, 1.05, 0.05, x, h - 1.3, z + 1, gold);
    box(0.37, 0.1, 0.05, x, h - 1.15, z + 1, gold);
    const dough = new THREE.MeshStandardMaterial({ color: '#bd7f40', roughness: 0.86 });
    const glaze = new THREE.MeshStandardMaterial({
      color: x < 0 ? '#ac84b0' : '#b7c19b',
      roughness: 0.58,
    });
    const ring = add(new THREE.TorusGeometry(0.78, 0.29, 12, 32), x, h + 0.5, z, dough);
    ring.rotation.x = -Math.PI / 2;
    const icing = add(
      new THREE.TorusGeometry(0.78, 0.3, 12, 32, Math.PI * 1.94),
      x,
      h + 0.57,
      z,
      glaze,
    );
    icing.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4;
      box(0.12, 0.04, 0.06, x + Math.cos(a) * 0.78, h + 0.84, z + Math.sin(a) * 0.78, gold);
    }
  }
  const h = 4.8 + (level - 1) * 0.7;
  tower(-2.3, 1.2, h);
  tower(2.3, 1.2, h + 0.5);
  tower(-3.7, -2, h + 1.6);
  tower(3.7, -2, h + 2.5);
  box(3, 3.5, 1.6, 0, 1.75, 0.7);
  box(3.3, 0.28, 1.9, 0, 3.5, 0.7, trim);
  for (let i = 0; i < 7; i++) box(0.28, 0.4, 0.32, -1.4 + i * 0.46, 3.83, 1.4, trim);
  const arch = add(new THREE.TorusGeometry(0.98, 0.23, 8, 24, Math.PI), 0, 1.86, 1.65);
  arch.rotation.z = 0;
  box(1.5, 2.3, 0.06, 0, 1.15, 1.55, dark);
  for (let i = 0; i < 7; i++) box(0.065, 2.3, 0.06, -0.65 + i * 0.22, 1.15, 1.6, trim);
  for (let i = 0; i < 5; i++) box(1.6, 0.075, 0.06, 0, 0.4 + i * 0.4, 1.64, trim);
  for (const x of [-4, 4]) box(0.55, 2.8, 4, x, 1.4, -0.8);
  box(8.4, 2.5, 0.55, 0, 1.25, -3.1);
  for (let i = 0; i < 18; i++) box(0.29, 0.38, 0.62, -4 + i * 0.47, 2.66, -3.1, trim);
  const disk = add(new THREE.CylinderGeometry(0.44, 0.44, 0.08, 24), 0, 2.95, 1.59, gold);
  disk.rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    const leaf = add(
      new THREE.SphereGeometry(0.2, 10, 8),
      side * 0.43,
      2.9,
      1.62,
      new THREE.MeshStandardMaterial({ color: '#3c956e' }),
    );
    leaf.scale.set(0.6, 1.7, 0.3);
    leaf.rotation.z = side * 0.55;
  }
  return g;
}
