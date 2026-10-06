import * as THREE from 'three';
import { materialTexture } from './material-textures';

let wallMap: THREE.CanvasTexture | null = null;

/** Actual 3D gatehouse and crenellated towers; shared by town and adventure map. */
export function pomponCitadel(level = 1) {
  const group = new THREE.Group();
  wallMap ??= materialTexture('stone');
  const stone = new THREE.MeshStandardMaterial({
    color: '#ba9770',
    map: wallMap,
    roughness: 0.94,
  });
  const trim = new THREE.MeshStandardMaterial({
    color: '#d0b383',
    roughness: 0.9,
  });
  const dark = new THREE.MeshStandardMaterial({ color: '#211d29' });
  const violet = new THREE.MeshStandardMaterial({
    color: '#54458c',
    side: THREE.DoubleSide,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: '#dbb855',
    metalness: 0.65,
    roughness: 0.42,
  });
  const add = (
    geo: THREE.BufferGeometry,
    posX: number,
    posY: number,
    posZ: number,
    mat: THREE.Material = stone,
  ) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(posX, posY, posZ);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const box = (
    width: number,
    height: number,
    depth: number,
    posX: number,
    posY: number,
    posZ: number,
    mat: THREE.Material = stone,
  ) => add(new THREE.BoxGeometry(width, height, depth), posX, posY, posZ, mat);

  function tower(posX: number, posZ: number, height: number) {
    box(1.7, height, 1.8, posX, height / 2, posZ);
    for (const bandY of [0.3, height * 0.5, height - 0.6]) {
      box(1.9, 0.17, 2, posX, bandY, posZ, trim);
    }
    box(2.05, 0.25, 2.15, posX, height, posZ, trim);
    for (let index = 0; index < 4; index++) {
      for (const side of [-1, 1]) {
        box(
          0.24,
          0.42,
          0.3,
          posX - 0.78 + index * 0.52,
          height + 0.25,
          posZ + side * 0.94,
          trim,
        );
        box(
          0.3,
          0.42,
          0.24,
          posX + side * 0.87,
          height + 0.25,
          posZ - 0.85 + index * 0.55,
          trim,
        );
      }
    }
    for (let bandY = 1; bandY < height - 0.6; bandY += 1.1) {
      box(0.14, 0.58, 0.025, posX, bandY, posZ + 0.913, dark);
    }
    for (const side of [-1, 1]) {
      box(
        0.28,
        height,
        0.24,
        posX + side * 0.69,
        height / 2,
        posZ + 0.86,
        trim,
      );
    }
    box(0.45, 1.3, 0.04, posX, height - 1.3, posZ + 0.96, violet);
    box(0.09, 1.05, 0.05, posX, height - 1.3, posZ + 1, gold);
    box(0.37, 0.1, 0.05, posX, height - 1.15, posZ + 1, gold);
    const dough = new THREE.MeshStandardMaterial({
      color: '#bd7f40',
      roughness: 0.86,
    });
    let glazeColor = '#b7c19b';
    if (posX < 0) {
      glazeColor = '#ac84b0';
    }
    const glaze = new THREE.MeshStandardMaterial({
      color: glazeColor,
      roughness: 0.58,
    });
    const ring = add(
      new THREE.TorusGeometry(0.78, 0.29, 12, 32),
      posX,
      height + 0.5,
      posZ,
      dough,
    );
    ring.rotation.x = -Math.PI / 2;
    const icing = add(
      new THREE.TorusGeometry(0.78, 0.3, 12, 32, Math.PI * 1.94),
      posX,
      height + 0.57,
      posZ,
      glaze,
    );
    icing.rotation.x = -Math.PI / 2;
    for (let index = 0; index < 12; index++) {
      const angle = index * 2.4;
      box(
        0.12,
        0.04,
        0.06,
        posX + Math.cos(angle) * 0.78,
        height + 0.84,
        posZ + Math.sin(angle) * 0.78,
        gold,
      );
    }
  }

  const towerHeight = 4.8 + (level - 1) * 0.7;
  tower(-2.3, 1.2, towerHeight);
  tower(2.3, 1.2, towerHeight + 0.5);
  tower(-3.7, -2, towerHeight + 1.6);
  tower(3.7, -2, towerHeight + 2.5);
  box(3, 3.5, 1.6, 0, 1.75, 0.7);
  box(3.3, 0.28, 1.9, 0, 3.5, 0.7, trim);
  for (let index = 0; index < 7; index++) {
    box(0.28, 0.4, 0.32, -1.4 + index * 0.46, 3.83, 1.4, trim);
  }
  const arch = add(
    new THREE.TorusGeometry(0.98, 0.23, 8, 24, Math.PI),
    0,
    1.86,
    1.65,
  );
  arch.rotation.z = 0;
  box(1.5, 2.3, 0.06, 0, 1.15, 1.55, dark);
  for (let index = 0; index < 7; index++) {
    box(0.065, 2.3, 0.06, -0.65 + index * 0.22, 1.15, 1.6, trim);
  }
  for (let index = 0; index < 5; index++) {
    box(1.6, 0.075, 0.06, 0, 0.4 + index * 0.4, 1.64, trim);
  }
  for (const wallX of [-4, 4]) {
    box(0.55, 2.8, 4, wallX, 1.4, -0.8);
  }
  box(8.4, 2.5, 0.55, 0, 1.25, -3.1);
  for (let index = 0; index < 18; index++) {
    box(0.29, 0.38, 0.62, -4 + index * 0.47, 2.66, -3.1, trim);
  }
  const disk = add(
    new THREE.CylinderGeometry(0.44, 0.44, 0.08, 24),
    0,
    2.95,
    1.59,
    gold,
  );
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
  return group;
}
